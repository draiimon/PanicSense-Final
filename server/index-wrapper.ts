/**
 * This is a special wrapper around the main index.ts file
 * It wraps all top-level await calls in an async IIFE
 * to ensure compatibility with CommonJS in production
 */

import { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import session from 'express-session';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
// Import log function that works without Vite
function defaultLog(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Declare the function types but initialize later
let log: (message: string, source?: string) => void = defaultLog;
let setupVite: ((app: any, server: any) => Promise<void>) | null = null;
let serveStatic: ((app: any) => void) | null = null;

// We'll initialize these inside the async IIFE below
import { registerRoutes } from './routes';
import { simpleDbFix } from './db-simple-fix';
import { cleanupAndExit } from './index';

// Create Express server
const app: Express = express();
let server: Server;

// Export constants
export const SERVER_START_TIMESTAMP = new Date().getTime();

// Wrap the server initialization in an async IIFE
(async () => {
  try {
    console.log('========================================');
    console.log(`Starting server initialization at: ${new Date().toISOString()}`);
    console.log('========================================');
    
    // Conditionally load Vite modules if needed
    if (process.env.NODE_ENV !== 'production' && process.env.SKIP_VITE_MIDDLEWARE !== 'true') {
      try {
        console.log('Attempting to load Vite modules...');
        const viteModule = await import('./vite');
        log = viteModule.log;
        setupVite = viteModule.setupVite;
        serveStatic = viteModule.serveStatic;
        console.log('✅ Vite modules loaded successfully');
      } catch (error) {
        console.warn('⚠️ Failed to load Vite modules, using fallbacks:', error);
        // Keep using default implementations
      }
    }

    // Database initialization
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running simple database fix in development...');
      await simpleDbFix();
    }

    // Session setup (similar to original)
    app.use(express.json());
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
      })
    );
    
    // Create WebSocket server
    server = await registerRoutes(app);
    
    // Setup Vite or serve static files
    console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV !== 'production' && process.env.SKIP_VITE_MIDDLEWARE !== 'true') {
      console.log('Running in development mode, setting up Vite middleware...');
      if (setupVite) {
        await setupVite(app, server);
        console.log('Vite middleware setup complete');
      } else {
        console.log('Vite middleware skipped - not available');
      }
    } else {
      console.log('Running in production mode, serving static files...');
      // In production, just use express.static if serveStatic is not available
      if (serveStatic) {
        serveStatic(app);
      } else {
        // Simple implementation of serveStatic for production
        const path = await import('path');
        const distPath = path.join(process.cwd(), 'dist', 'public');
        console.log(`Serving static files from: ${distPath}`);
        app.use(express.static(distPath));
        app.use('*', (_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
      console.log('Static file serving setup complete');
    }
    
    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'An internal server error occurred',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    });
    
    // Listen on port
    const port = parseInt(process.env.PORT || '5000');
    console.log(`Attempting to listen on port ${port}...`);
    
    server.listen(port, '0.0.0.0', () => {
      console.log('========================================');
      console.log(`🚀 Server running on port ${port}`);
      console.log(`Server listening at: http://0.0.0.0:${port}`);
      console.log(`Server ready at: ${new Date().toISOString()}`);
      console.log('========================================');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Received SIGINT signal, shutting down gracefully...');
      cleanupAndExit(server);
    });
    
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM signal, shutting down gracefully...');
      cleanupAndExit(server);
    });
    
  } catch (error) {
    console.error('Error during server initialization:', error);
    process.exit(1);
  }
})();

// Export the app and server for testing
export { app, server };