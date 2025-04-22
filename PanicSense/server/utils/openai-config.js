/**
 * OpenAI configuration utilities for PanicSense PH
 * Handles API key validation and configuration
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file if not already set
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Check if OpenAI API key is configured
 * @returns {boolean} True if API key is available
 */
function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Get current OpenAI API key
 * @returns {string|null} API key or null
 */
function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || null;
}

/**
 * Set OpenAI API key in environment
 * @param {string} apiKey - OpenAI API key
 */
function setOpenAIKey(apiKey) {
  process.env.OPENAI_API_KEY = apiKey;
}

/**
 * Validate OpenAI API key format (basic check)
 * @param {string} apiKey - OpenAI API key to validate
 * @returns {boolean} True if format is valid
 */
function validateApiKeyFormat(apiKey) {
  // Basic validation (OpenAI keys start with "sk-")
  return typeof apiKey === 'string' && 
    apiKey.trim().startsWith('sk-') && 
    apiKey.trim().length > 20;
}

/**
 * Get OpenAI settings for use in UI components
 * @returns {Object} Settings object with isConfigured flag
 */
function getOpenAIClientSettings() {
  return {
    isConfigured: isOpenAIConfigured(),
    model: 'gpt-4o-mini' // Default model for UI components
  };
}

/**
 * Log any detected OpenAI configuration issues
 */
function logOpenAIStatus() {
  if (!isOpenAIConfigured()) {
    console.warn("⚠️ OpenAI API key not found in environment. AI disaster detection may not work.");
    console.warn("   Set OPENAI_API_KEY in your .env file or environment variables.");
  } else {
    console.log("✅ OpenAI API key found, disaster detection ready.");
  }
}

// Export utility functions
module.exports = {
  isOpenAIConfigured,
  getOpenAIKey,
  setOpenAIKey,
  validateApiKeyFormat,
  getOpenAIClientSettings,
  logOpenAIStatus
};