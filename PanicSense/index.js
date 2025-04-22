/**
 * PRODUCTION ENTRY POINT FOR RENDER.COM
 * 
 * This is now an ES Module file to match the package.json "type": "module" setting
 */

// Use ES Module syntax for compatibility with package.json type: module
import express from 'express';
import pg from 'pg';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 10000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to server',
    timestamp: Date.now()
  }));
  
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// Connect to PostgreSQL database
let pool;
let databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

// Remove DATABASE_URL= prefix if present
if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.substring('DATABASE_URL='.length);
  console.log('Fixed database URL format by removing prefix');
}

if (databaseUrl) {
  console.log(`Connecting to PostgreSQL database... (${databaseUrl.split(':')[0]} type)`);
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Always use SSL for Neon
  });
} else {
  console.warn('No DATABASE_URL or NEON_DATABASE_URL provided, database features will be disabled');
}

// Create simple broadcast function for WebSocket
function broadcastUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocketServer.OPEN
      client.send(JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    }
  });
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('========================================');
    console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
    console.log('========================================');
    
    // Test database connection
    if (pool) {
      try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to PostgreSQL database');
        client.release();
      } catch (err) {
        console.error('❌ Failed to connect to PostgreSQL database:', err);
      }
    }
    
    // Setup static file serving
    const distDir = path.join(__dirname, 'client/dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      console.log(`Serving static files from ${distDir}`);
    } else {
      console.warn(`Static directory ${distDir} not found`);
    }
    
    // Add health check route
    app.get('/api/health', async (req, res) => {
      try {
        if (pool) {
          const client = await pool.connect();
          await client.query('SELECT NOW()');
          client.release();
          res.json({ 
            status: 'ok', 
            database: 'connected', 
            timestamp: new Date().toISOString(),
            mode: process.env.NODE_ENV || 'development'
          });
        } else {
          res.json({ 
            status: 'ok', 
            database: 'not configured', 
            timestamp: new Date().toISOString(),
            mode: process.env.NODE_ENV || 'development'
          });
        }
      } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
      }
    });
    
    // Simple routes for live check
    app.get('/api/echo', (req, res) => {
      res.json({
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        mode: process.env.NODE_ENV || 'development'
      });
    });
    
    // Fallback route for SPA
    app.get('*', (req, res) => {
      if (fs.existsSync(path.join(distDir, 'index.html'))) {
        res.sendFile(path.join(distDir, 'index.html'));
      } else {
        res.status(404).send('Application not properly built. Static files missing.');
      }
    });
    
    // Start the server
    server.listen(port, '0.0.0.0', () => {
      console.log(`========================================`);
      console.log(`🚀 Server running on port ${port}`);
      console.log(`Server listening at: http://0.0.0.0:${port}`);
      console.log(`Server ready at: ${new Date().toISOString()}`);
      console.log(`========================================`);
    });
    
  } catch (err) {
    console.error('FATAL ERROR during startup:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    if (pool) {
      pool.end().then(() => {
        console.log('Database pool closed');
        process.exit(0);
      }).catch(() => process.exit(1));
    } else {
      process.exit(0);
    }
  });
});

// Start without any top-level await
startServer().catch(err => {
  console.error('Error during startup:', err);
  // Still start the server even if there's an error
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} (startup error occurred)`);
  });
});