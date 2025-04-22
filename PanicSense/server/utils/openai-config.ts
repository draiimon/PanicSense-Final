/**
 * OpenAI configuration utilities for PanicSense PH
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
 * Check if OpenAI API key is configured
 * @returns {boolean} True if API key is available
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Get current OpenAI API key
 * @returns {string|null} API key or null
 */
export function getOpenAIKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

/**
 * Set OpenAI API key in environment
 * @param {string} apiKey - OpenAI API key
 */
export function setOpenAIKey(apiKey: string): void {
  process.env.OPENAI_API_KEY = apiKey;
}

/**
 * Validate OpenAI API key format (basic check)
 * @param {string} apiKey - OpenAI API key to validate
 * @returns {boolean} True if format is valid
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Basic validation (OpenAI keys start with "sk-")
  return typeof apiKey === 'string' && 
    apiKey.trim().startsWith('sk-') && 
    apiKey.trim().length > 20;
}

/**
 * Get OpenAI settings for use in UI components
 * @returns {Object} Settings object with isConfigured flag
 */
export function getOpenAIClientSettings(): { isConfigured: boolean, model: string } {
  return {
    isConfigured: isOpenAIConfigured(),
    model: 'gpt-4o-mini' // Default model for UI components
  };
}

/**
 * Log any detected OpenAI configuration issues
 */
export function logOpenAIStatus(): void {
  if (!isOpenAIConfigured()) {
    console.warn("⚠️ OpenAI API key not found in environment. AI disaster detection may not work.");
    console.warn("   Set OPENAI_API_KEY in your .env file or environment variables.");
  } else {
    console.log("✅ OpenAI API key found, disaster detection ready.");
  }
}