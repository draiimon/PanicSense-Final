/**
 * Render start script
 * This is the entry point for the Render deployment
 */

// Set critical environment variables
process.env.NODE_ENV = 'production';
process.env.RUNTIME_ENV = 'production';
process.env.RENDER_ENV = 'production';
process.env.SKIP_VITE_MIDDLEWARE = 'true';
process.env.VITE_SKIP = 'true';
process.env.SKIP_VITE = 'true';

// Import the production-specific server that doesn't rely on Vite
import './render-production.js';