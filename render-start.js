/**
 * Render start script
 * This is the entry point for the Render deployment
 */

// Set production environment and ensure vite isn't needed in production
process.env.NODE_ENV = 'production';
process.env.RENDER_ENV = 'production';
process.env.SKIP_VITE_MIDDLEWARE = 'true';

// Import the compiled server - using ES module import syntax
import './dist/server/index-wrapper.js';