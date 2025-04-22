/**
 * Disaster News Filter
 * This module filters news content to ensure only disaster-related news is displayed
 * It uses Groq API to validate if news content is disaster-related
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use the provided Groq API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

export interface DisasterValidationResult {
  isDisaster: boolean;
  disasterType: string | null;
  confidence: number;
  details: string;
}

/**
 * Validates if a news article is about a real disaster
 * @param {string} title - The news article title
 * @param {string} content - The news article content
 * @returns {Promise<DisasterValidationResult>}
 */
export async function isDisasterNews(title: string, content: string): Promise<DisasterValidationResult> {
  // Keywords for pre-filtering to reduce API calls - non-disaster keywords
  const nonDisasterKeywords = [
    'died', 'death', 'passed away', 'funeral', 'politician', 
    'election', 'pope', 'vatican', 'celebrity', 'actor', 'actress', 
    'sports', 'tournament', 'championship', 'concert', 'festival',
    'interview', 'economy', 'inflation', 'press release'
  ];
  
  // Check if title contains non-disaster keywords - quick optimization to avoid API calls
  const isLikelyNonDisaster = nonDisasterKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Skip API call if clearly non-disaster content
  if (isLikelyNonDisaster && !title.toLowerCase().includes('emergency') && 
      !title.toLowerCase().includes('disaster') && !title.toLowerCase().includes('typhoon') &&
      !title.toLowerCase().includes('earthquake') && !title.toLowerCase().includes('flood')) {
    return {
      isDisaster: false,
      disasterType: null,
      confidence: 0.9,
      details: "Pre-filtered as non-disaster content based on keywords"
    };
  }
  
  // Simple disaster keyword check for improved efficiency
  const disasterKeywords = [
    'typhoon', 'earthquake', 'flood', 'fire', 'landslide', 'eruption',
    'tsunami', 'evacuation', 'emergency', 'disaster', 'rescue', 'survivors',
    'bagyo', 'lindol', 'baha', 'sunog', 'pagguho', 'bulkan', 'sakuna',
    'quake', 'tremor', 'blaze', 'collapse', 'explosion', 'storm', 'cyclone',
    'evacuate', 'destroyed', 'damaged', 'submerged', 'trapped', 'killed',
    'casualty', 'casualties', 'injured', 'damages', 'devastation', 'devastated'
  ];
  
  // If title contains clear disaster keywords, we can skip API check to avoid rate limits
  const isLikelyDisaster = disasterKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Content analysis for better accuracy
  const contentContainsDisasterKeywords = disasterKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // If it's clearly a disaster based on title and content, return true immediately
  // This helps reduce API calls to avoid rate limits
  if (isLikelyDisaster && contentContainsDisasterKeywords) {
    // Extract disaster type from the title
    let disasterType = null;
    for (const keyword of disasterKeywords) {
      if (title.toLowerCase().includes(keyword.toLowerCase())) {
        disasterType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
    
    return {
      isDisaster: true,
      disasterType,
      confidence: 0.85, // Pretty high confidence since both title and content match
      details: `Disaster news detected by keyword analysis in both title and content: ${disasterType || 'unknown disaster'}`
    };
  }
  
  // Prepare the system and user message for the API
  const systemMessage = `
You are a disaster news classifier for an emergency monitoring system. Your ONLY task is to determine if the article is about a REAL, CURRENT disaster or emergency.

RULES:
1. ONLY classify as disaster if it's about a current, active emergency situation (earthquake, flood, typhoon, fire, volcanic eruption, landslide, etc.)
2. Do NOT classify as disaster:
   - Deaths of individuals (even prominent figures like the Pope)
   - Political news, scandals or social unrest
   - Economic problems, inflation, or poverty
   - Historical disasters unless they are ongoing
   - Weather warnings unless actual damage has occurred
   - Crime (unless it's large-scale terrorism)
   - Disease outbreaks unless at emergency levels
3. Respond ONLY in JSON format with no additional text
`;

  const userMessage = `
News title: ${title}
News content: ${content}

Analyze if this is a CURRENT, REAL DISASTER or EMERGENCY situation. 
Respond with EXACTLY this JSON format and nothing else:
{
  "isDisaster": boolean (true ONLY if a current disaster/emergency),
  "disasterType": string (name of the disaster type or null if not a disaster),
  "confidence": number (between 0-1),
  "details": string (brief explanation of your decision)
}
`;

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount < maxRetries) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
          top_p: 0.95
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Success, extract the response content
      const responseText = response.data.choices[0].message.content.trim();
      
      try {
        // Try to parse the JSON
        const jsonResponse = JSON.parse(responseText);
        
        return {
          isDisaster: jsonResponse.isDisaster === true,
          disasterType: jsonResponse.disasterType || null,
          confidence: typeof jsonResponse.confidence === 'number' ? jsonResponse.confidence : 0.5,
          details: jsonResponse.details || 'No explanation provided'
        };
      } catch (parseError) {
        console.error('Error parsing Groq API response:', parseError, 'Raw response:', responseText);
        
        // Fallback parsing method
        const isDisaster = responseText.includes('"isDisaster": true') || responseText.includes('"isDisaster":true');
        
        // Extract disaster type with regex
        let disasterType = null;
        const typeMatch = responseText.match(/"disasterType":\s*"([^"]+)"/);
        if (typeMatch && typeMatch[1] && typeMatch[1].toLowerCase() !== 'null' && typeMatch[1] !== 'n/a') {
          disasterType = typeMatch[1];
        }
        
        // Extract confidence with regex
        let confidence = 0.5;
        const confidenceMatch = responseText.match(/"confidence":\s*(0\.\d+|1\.0|1)/);
        if (confidenceMatch && confidenceMatch[1]) {
          confidence = parseFloat(confidenceMatch[1]);
        }
        
        // Extract details with regex
        let details = 'Failed to parse explanation';
        const detailsMatch = responseText.match(/"details":\s*"([^"]+)"/);
        if (detailsMatch && detailsMatch[1]) {
          details = detailsMatch[1];
        }
        
        return {
          isDisaster,
          disasterType,
          confidence,
          details
        };
      }
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      // If we hit rate limits (429) or server error (5xx), implement backoff
      if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10s backoff
        console.warn(`Rate limit hit (${error.response.status}), backing off for ${backoffMs}ms before retry ${retryCount}/${maxRetries}`);
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  // All retries failed or error was not retryable
  if (lastError) {
    console.error('Error calling Groq API for disaster validation after retries:', lastError.message);
    
    // If we have a good keyword match, use that as a fallback
    if (isLikelyDisaster) {
      // Extract disaster type from the title
      let disasterType = null;
      for (const keyword of disasterKeywords) {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          disasterType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
      
      return {
        isDisaster: true,
        disasterType,
        confidence: 0.6, // Lower confidence since it's keyword-based
        details: `API failed but disaster keywords found in title: ${disasterType || 'unknown'}`
      };
    }
    
    return {
      isDisaster: false,
      disasterType: null,
      confidence: 0,
      details: `API Error: ${lastError.message}`
    };
  }
  
  // This should never be reached, but TypeScript needs it
  return {
    isDisaster: false,
    disasterType: null,
    confidence: 0,
    details: "Failed to process after all retries"
  };
}