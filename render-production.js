/**
 * PRODUCTION-ONLY SERVER ENTRY POINT FOR RENDER
 * This file is a completely separate entry point that doesn't rely on Vite
 * Used only for Render deployment to avoid Vite dependency issues
 */

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.RENDER_ENV = 'production';

// Core dependencies
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes and services
import { storage } from './dist/server/storage.js';
import { simpleDbFix } from './dist/server/db-simple-fix.js';
import { pythonService } from './dist/server/python-service.js';

// Constants and utilities
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Create Express application
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket message handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received message:', message);
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcaster function
function broadcastUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply database fixes on startup
async function setupDatabase() {
  try {
    console.log('Running database fixes for production...');
    await simpleDbFix();
    console.log('Database setup complete');
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// API routes go here (minimal implementation)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'production', version: '1.0' });
});

// Default route - serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: true, 
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

// Start the server
async function startServer() {
  try {
    // Setup database first
    await setupDatabase();
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`========================================`);
      console.log(`🚀 Production server running on port ${PORT}`);
      console.log(`Server listening at: http://0.0.0.0:${PORT}`);
      console.log(`Server ready at: ${new Date().toISOString()}`);
      console.log(`========================================`);
    });
    
    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      pythonService.cancelAllProcesses();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start everything
startServer();