import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { checkPortPeriodically, checkPort } from "./debug-port";
// Import emergency database fixes - both old and new strategy
// Emergency fixes module removed to clean up the codebase
// Import the simple fix (now ESM compatible)
import { simpleDbFix } from "./db-simple-fix";
// Import Python service for shutdown handling
import { pythonService } from "./python-service";
// Import rate limiter middleware
import { createRateLimiter, dailyUsageCheck } from "./middleware/rate-limiter";

// Create a global server start timestamp for detecting restarts
// This will be used by routes.ts to detect server restarts
export const SERVER_START_TIMESTAMP = new Date().getTime();

// Cleanup function to terminate Python processes
// Define this outside any block to avoid strict mode errors
export function cleanupAndExit(server: any): void {
  console.log('🧹 Starting cleanup process before shutdown...');
  
  try {
    // First, cancel all active Python processes
    const activeSessions = pythonService.getActiveProcessSessions();
    if (activeSessions.length > 0) {
      console.log(`🔥 Cancelling ${activeSessions.length} active Python processes`);
      pythonService.cancelAllProcesses();
      console.log('✅ All Python processes terminated successfully');
    } else {
      console.log('ℹ️ No active Python processes to terminate');
    }
    
    // Then close the server
    console.log('🛑 Closing HTTP server...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      console.log('👋 Exiting process');
      process.exit(0);
    });
    
    // Force exit after 3 seconds if server.close doesn't complete
    setTimeout(() => {
      console.log('⚠️ Forced exit due to timeout');
      process.exit(1);
    }, 3000);
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Force exit on error
    process.exit(1);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' })); // Increased limit for better performance
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Apply standard rate limiter to all API routes as base protection
app.use('/api', createRateLimiter('standard'));

// Apply specific rate limiters to heavy endpoints
app.use('/api/upload-csv', createRateLimiter('upload'));
app.use('/api/analyze-text', createRateLimiter('analysis'));
app.use('/api/sentiment-feedback', createRateLimiter('analysis')); // Training feedback is resource-intensive
app.use('/api/profile-images', createRateLimiter('upload')); // File uploads need stricter limits

// Apply admin rate limiters to sensitive operations
app.use('/api/emergency-reset', createRateLimiter('admin'));
app.use('/api/reset-upload-sessions', createRateLimiter('admin'));
app.use('/api/delete-all-data', createRateLimiter('admin'));
app.use('/api/cleanup-error-sessions', createRateLimiter('admin'));
app.use('/api/untrained-feedback', createRateLimiter('admin'));

// Track these endpoints for usage limits
const dataProcessingEndpoints = [
  '/api/upload-csv', 
  '/api/analyze-text',
  '/api/sentiment-feedback',
  '/api/untrained-feedback'
];

// Apply daily usage check to data processing endpoints
app.use(dataProcessingEndpoints, dailyUsageCheck);

// Enhanced logging middleware with better performance metrics
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const summary = JSON.stringify(capturedJsonResponse).slice(0, 100);
        logLine += ` :: ${summary}${summary.length > 99 ? '...' : ''}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("========================================");
    console.log("Starting server initialization at: " + new Date().toISOString());
    console.log("========================================");
    
    // Apply emergency database fixes before anything else
    if (process.env.NODE_ENV === "production") {
      console.log("Running in production mode, applying emergency database fixes...");
      try {
        // First, try the simple fix (more reliable, simpler code)
        console.log("Trying simple database fix first...");
        const simpleFixSuccessful = await simpleDbFix();
        
        if (simpleFixSuccessful) {
          console.log("✅ Simple database fix successful!");
        } else {
          // We removed the complex emergency fix method to clean up codebase
          console.log("Simple fix failed but complex fix is removed");
          console.warn("⚠️ Database may need attention if problems persist");
        }
      } catch (error) {
        console.error("Fatal error in database fix script:", error);
      }
    } else {
      // In development, also apply the simple fix (helps with local testing)
      try {
        console.log("Running simple database fix in development...");
        await simpleDbFix();
      } catch (error) {
        console.error("Development database fix failed:", error);
      }
    }
    
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");
    
    // Setup process shutdown handlers to ensure cleanup
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing server and cleaning up Python processes');
      cleanupAndExit(server);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing server and cleaning up Python processes');
      cleanupAndExit(server);
    });
    
    // Unhandled promise rejections and exceptions
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection, reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      cleanupAndExit(server);
    });
    
    // We use the global cleanupAndExit function defined at the top of this file

    // Enhanced error handling with structured error response
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const details = err.stack || "";

      console.error(`[Error] ${status} - ${message}\n${details}`);
      res.status(status).json({ 
        error: true,
        message,
        timestamp: new Date().toISOString(),
        path: _req.path
      });
    });

    console.log("Current NODE_ENV:", process.env.NODE_ENV);
    
    if (process.env.NODE_ENV === "production") {
      console.log("Running in production mode, serving static files...");
      serveStatic(app);
      console.log("Static file serving setup complete");
    } else {
      console.log("Running in development mode, setting up Vite middleware...");
      await setupVite(app, server);
      console.log("Vite middleware setup complete");
    }

    // Use PORT environment variable with fallback to 5000 for local development
    const port = parseInt(process.env.PORT || "5000", 10);
    console.log(`Attempting to listen on port ${port}...`);
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`========================================`);
      log(`🚀 Server running on port ${port}`);
      console.log(`Server listening at: http://0.0.0.0:${port}`);
      console.log(`Server ready at: ${new Date().toISOString()}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
})();