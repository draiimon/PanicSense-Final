/**
 * Groq API configuration utilities for PanicSense PH
 * Handles API key validation and configuration
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file if not already set
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Check if Groq API key is configured
 * @returns {boolean} True if API key is available
 */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * Get current Groq API key
 * @returns {string|null} API key or null
 */
export function getGroqKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

/**
 * Set Groq API key in environment
 * @param {string} apiKey - Groq API key
 */
export function setGroqKey(apiKey: string): void {
  process.env.GROQ_API_KEY = apiKey;
}

/**
 * Validate Groq API key format (basic check)
 * @param {string} apiKey - Groq API key to validate
 * @returns {boolean} True if format is valid
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Basic validation (Groq keys start with "gsk_")
  return typeof apiKey === 'string' && 
    apiKey.trim().startsWith('gsk_') && 
    apiKey.trim().length > 20;
}

/**
 * Get Groq settings for use in UI components
 * @returns {Object} Settings object with isConfigured flag
 */
export function getGroqClientSettings(): { isConfigured: boolean, model: string } {
  return {
    isConfigured: isGroqConfigured(),
    model: 'DeepSeek R1 Distill Llama 70B' // Default model for UI components
  };
}

/**
 * Log any detected Groq configuration issues
 */
export function logGroqStatus(): void {
  if (!isGroqConfigured()) {
    console.warn("⚠️ Groq API key not found in environment. AI disaster detection may not work.");
    console.warn("   Set GROQ_API_KEY in your .env file or environment variables.");
  } else {
    console.log("✅ Groq API key found, disaster detection ready.");
  }
}