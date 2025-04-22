/**
 * Groq API Utility
 * 
 * A unified interface for working with Groq API across the application.
 * This utility provides caching, retry logic, and standardized request handling.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { cacheManager } from './cache-manager';

// Load environment variables
dotenv.config();

// Get API key and model from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

// Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_RETRIES = 3;
const CACHE_NAMESPACE = 'groq-api';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Error types
enum ErrorType {
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  AUTHENTICATION = 'authentication',
  BAD_REQUEST = 'bad_request',
  UNKNOWN = 'unknown'
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

interface GroqResponse<T> {
  data: T;
  fromCache: boolean;
}

class GroqAPI {
  /**
   * Send a chat completion request to Groq API
   */
  async chatCompletion<T = any>(
    messages: GroqMessage[],
    options: GroqRequestOptions = {}
  ): Promise<GroqResponse<T>> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.2,
      max_tokens = 1000,
      top_p = 0.95,
      cache = true,
      cacheKey,
      cacheTTL = CACHE_TTL
    } = options;
    
    // If caching is enabled and a cacheKey is provided, check cache first
    if (cache && cacheKey) {
      const cachedResponse = cacheManager.get<T>(cacheKey, {
        namespace: CACHE_NAMESPACE,
        ttl: cacheTTL
      });
      
      if (cachedResponse) {
        console.log(`Using cached Groq API response for key: ${cacheKey}`);
        return {
          data: cachedResponse,
          fromCache: true
        };
      }
    }
    
    // Prepare request body
    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: false
    };
    
    // Retry logic with exponential backoff
    let retryCount = 0;
    let lastError: any = null;
    
    while (retryCount < MAX_RETRIES) {
      try {
        const response = await axios.post(
          GROQ_API_URL,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Extract response content
        const responseData = response.data.choices[0].message.content;
        let parsedData: T;
        
        // Try to parse JSON response if it looks like JSON
        if (typeof responseData === 'string' && 
            (responseData.trim().startsWith('{') || responseData.trim().startsWith('['))) {
          try {
            parsedData = JSON.parse(responseData);
          } catch (parseError) {
            console.warn('Failed to parse JSON response from Groq API:', parseError);
            parsedData = responseData as unknown as T;
          }
        } else {
          parsedData = responseData as unknown as T;
        }
        
        // Cache the result if caching is enabled
        if (cache && cacheKey) {
          cacheManager.set(cacheKey, parsedData, {
            namespace: CACHE_NAMESPACE,
            ttl: cacheTTL
          });
        }
        
        return {
          data: parsedData,
          fromCache: false
        };
      } catch (error: any) {
        lastError = error;
        retryCount++;
        
        // Determine error type
        const errorType = this.getErrorType(error);
        
        // Retry on rate limits and server errors
        if (errorType === ErrorType.RATE_LIMIT || errorType === ErrorType.SERVER_ERROR) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10s backoff
          console.warn(`Groq API ${errorType} error, backing off for ${backoffMs}ms before retry ${retryCount}/${MAX_RETRIES}`);
          
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        } else {
          // Don't retry other types of errors
          break;
        }
      }
    }
    
    // All retries failed or error was not retryable
    throw this.formatError(lastError);
  }
  
  /**
   * Determine the type of error from the Axios error response
   */
  private getErrorType(error: any): ErrorType {
    if (!error.response) {
      return ErrorType.UNKNOWN;
    }
    
    const status = error.response.status;
    
    if (status === 429) {
      return ErrorType.RATE_LIMIT;
    } else if (status >= 500) {
      return ErrorType.SERVER_ERROR;
    } else if (status === 401 || status === 403) {
      return ErrorType.AUTHENTICATION;
    } else if (status === 400) {
      return ErrorType.BAD_REQUEST;
    } else {
      return ErrorType.UNKNOWN;
    }
  }
  
  /**
   * Format the error for better debugging
   */
  private formatError(error: any): Error {
    if (!error) {
      return new Error('Unknown Groq API error');
    }
    
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      const status = error.response.status;
      const data = error.response.data || {};
      const message = data.error?.message || 'Unknown API error';
      
      return new Error(`Groq API error (${status}): ${message}`);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error(`Groq API network error: No response received`);
    } else {
      // Something happened in setting up the request
      return new Error(`Groq API request error: ${error.message}`);
    }
  }
  
  /**
   * Clear the cache for a specific key or namespace
   */
  clearCache(key?: string): void {
    if (key) {
      cacheManager.delete(key, CACHE_NAMESPACE);
    } else {
      cacheManager.clear(CACHE_NAMESPACE);
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number, namespaces: Record<string, number> } {
    return cacheManager.getStats();
  }
}

// Export a singleton instance
export const groqAPI = new GroqAPI();

// Export the class for testing or specific instances
export default GroqAPI;