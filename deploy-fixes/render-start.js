/**
 * Render start script
 * This is the entry point for the Render deployment
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Import the compiled server - using ES module import syntax
import './dist/server/index-wrapper.js';