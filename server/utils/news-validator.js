/**
 * News Validator using Groq API
 * This is a separate tool for validating if news content is related to a legitimate disaster
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Use the Groq API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Simple in-memory cache to reduce API calls
const responseCache = new Map();

// Cache expiry time - 1 hour in milliseconds
const CACHE_EXPIRY = 60 * 60 * 1000;

/**
 * Generate a cache key from title and content
 * @param {string} title - The news article title
 * @param {string} content - The news article content (truncated)
 * @returns {string} - Cache key
 */
function generateCacheKey(title, contentSample) {
  // Use title and a sample of content to create a unique key
  // Truncate content to avoid very long keys
  const contentPreview = contentSample.substring(0, 100).replace(/\s+/g, ' ').trim();
  return `${title.trim()}|${contentPreview}`;
}

/**
 * Validates if a news article is describing a legitimate disaster
 * @param {string} title - The news article title
 * @param {string} content - The news article content
 * @returns {Promise<{isDisaster: boolean, confidence: number, disasterType: string|null, details: string}>}
 */
async function validateNewsContent(title, content) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(title, content);
    
    // Check cache first
    if (responseCache.has(cacheKey)) {
      const cachedData = responseCache.get(cacheKey);
      
      // Check if cache is still valid
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
        console.log(`Using cached disaster validation for: "${title.substring(0, 30)}..."`);
        return cachedData.result;
      } else {
        // Cache expired, remove it
        responseCache.delete(cacheKey);
      }
    }
    
    // Simple keyword-based pre-filtering to reduce API calls
    const disasterKeywords = ['typhoon', 'earthquake', 'flood', 'fire', 'landslide', 'eruption', 
                             'tsunami', 'evacuation', 'emergency', 'disaster', 'rescue', 'survivors',
                             'bagyo', 'lindol', 'baha', 'sunog', 'pagguho', 'bulkan', 'sakuna'];
    
    const nonDisasterKeywords = ['died', 'death', 'passed away', 'funeral', 'politician', 
                                'election', 'pope', 'vatican', 'celebrity', 'sports'];
    
    // Check if contains clear disaster keywords
    const hasDisasterKeywords = disasterKeywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase()) || 
      content.toLowerCase().substring(0, 200).includes(keyword.toLowerCase())
    );
    
    // Check if contains clear non-disaster keywords and NO disaster keywords
    const hasNonDisasterKeywords = nonDisasterKeywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    ) && !hasDisasterKeywords;
    
    // If clearly not disaster related, return immediately without API call
    if (hasNonDisasterKeywords) {
      const result = {
        isDisaster: false,
        disasterType: null,
        confidence: 0.85,
        details: "Pre-filtered as non-disaster content based on keywords"
      };
      
      // Cache the result
      responseCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
    
    // If clearly disaster related, fast-track without API call to save quota
    if (hasDisasterKeywords) {
      // Find which disaster keyword matched
      let matchedType = null;
      for (const keyword of disasterKeywords) {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          matchedType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
      
      const result = {
        isDisaster: true,
        disasterType: matchedType,
        confidence: 0.75, 
        details: `Disaster content detected via keyword matching: ${matchedType || 'unspecified disaster type'}`
      };
      
      // Cache the result
      responseCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
    
    const validationPrompt = `
You are a disaster news validation assistant. Your task is to analyze the provided news article and determine if it is describing a legitimate disaster.

News title: ${title}
News content: ${content}

Please analyze the content and determine:
1. Is this describing a legitimate disaster or emergency event? (Yes/No)
2. What type of disaster is it? (e.g., Flood, Earthquake, Fire, Typhoon, etc. or None if not a disaster)
3. How confident are you about this classification (a number between 0 and 1)
4. Provide a brief explanation for your decision

Format your response as a valid JSON object with the following fields:
{
  "isDisaster": boolean,
  "disasterType": string or null,
  "confidence": number between 0 and 1,
  "details": explanation as string
}
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a specialized disaster news validation tool. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: validationPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    try {
      // Extract the JSON from the response
      const responseText = response.data.choices[0].message.content;
      
      // Parse the JSON
      const jsonResponse = JSON.parse(responseText);
      
      // Validate the response has the expected fields
      if (typeof jsonResponse.isDisaster !== 'boolean' || 
          typeof jsonResponse.confidence !== 'number' ||
          typeof jsonResponse.details !== 'string') {
        throw new Error('Invalid response format');
      }
      
      const result = {
        isDisaster: jsonResponse.isDisaster,
        disasterType: jsonResponse.disasterType || null,
        confidence: jsonResponse.confidence,
        details: jsonResponse.details
      };
      
      // Cache the result
      responseCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback manual extraction logic
      const responseText = response.data.choices[0].message.content;
      
      // Very basic fallback extraction using regex
      const isDisaster = /("isDisaster"\s*:\s*true|"isDisaster"\s*:\s*1)/i.test(responseText);
      const confidenceMatch = responseText.match(/"confidence"\s*:\s*([0-9.]+)/i);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
      const disasterTypeMatch = responseText.match(/"disasterType"\s*:\s*"([^"]*)"/i);
      const disasterType = disasterTypeMatch ? disasterTypeMatch[1] : null;
      const detailsMatch = responseText.match(/"details"\s*:\s*"([^"]*)"/i);
      const details = detailsMatch ? detailsMatch[1] : 'No explanation provided';
      
      return {
        isDisaster,
        disasterType,
        confidence,
        details
      };
    }
  } catch (error) {
    console.error('Error validating news with Groq API:', error.message);
    // Default fallback response
    return {
      isDisaster: false,
      disasterType: null,
      confidence: 0,
      details: `Error during validation: ${error.message}`
    };
  }
}

module.exports = {
  validateNewsContent
};