/**
 * Disaster News Filter
 * This module filters news content to ensure only disaster-related news is displayed
 * It uses Groq API to validate if news content is disaster-related
 */

const axios = require('axios');

// Use the provided Groq API key for disaster validation
const GROQ_API_KEY = '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';

/**
 * Validates if a news article is about a real disaster
 * @param {string} title - The news article title
 * @param {string} content - The news article content
 * @returns {Promise<{isDisaster: boolean, disasterType: string|null, confidence: number, details: string}>}
 */
async function isDisasterNews(title, content) {
  try {
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

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
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

    // Extract the response content
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
  } catch (error) {
    console.error('Error calling Groq API for disaster validation:', error.message);
    return {
      isDisaster: false,
      disasterType: null,
      confidence: 0,
      details: `API Error: ${error.message}`
    };
  }
}

// For ESM compatibility
export { isDisasterNews };