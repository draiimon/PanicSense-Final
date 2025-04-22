/**
 * SERVER
 * Simple Node.js server for the application
 */

import express from 'express';
import pg from 'pg';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// pg is a CommonJS module so we need to extract Pool like this
const { Pool } = pg;

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to server',
    timestamp: Date.now()
  }));
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// Import the database connection from server/db.ts
// Avoid creating a separate connection - use only the Neon database 
// managed by Drizzle ORM
let pool;
try {
  // For ES Module, use dynamic import
  const dbModule = await import('./server/db.js');
  pool = dbModule.pool;
  console.log('Using shared database connection from server/db.js');
} catch (error) {
  console.warn('Failed to import database connection from server/db.js:', error.message);
  console.warn('Some database features might be disabled');
  
  // Fallback to direct connection if needed
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });
      console.log('Created fallback database connection from DATABASE_URL');
    }
  } catch (fallbackError) {
    console.error('Failed to create fallback database connection:', fallbackError.message);
  }
}

// Create simple broadcast function for WebSocket
function broadcastUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    }
  });
}

// Register routes
async function registerRoutes() {
  // Basic health check
  app.get('/api/health', async (req, res) => {
    try {
      if (pool) {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        res.json({ 
          status: 'ok', 
          database: 'connected', 
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({ 
          status: 'ok', 
          database: 'not configured', 
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Core API routes
  app.get('/api/disaster-events', async (req, res) => {
    try {
      if (!pool) return res.json([]);
      // Use timestamp or id instead of created_at to fix database error
      const result = await pool.query('SELECT * FROM disaster_events ORDER BY id DESC');
      res.json(result.rows);
    } catch (err) {
      console.error('Error getting disaster events:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sentiment-posts', async (req, res) => {
    try {
      if (!pool) return res.json([]);
      const result = await pool.query('SELECT * FROM sentiment_posts ORDER BY timestamp DESC');
      res.json(result.rows);
    } catch (err) {
      console.error('Error getting sentiment posts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analyzed-files', async (req, res) => {
    try {
      if (!pool) return res.json([]);
      // Use id instead of created_at to fix database error
      const result = await pool.query('SELECT * FROM analyzed_files ORDER BY id DESC');
      res.json(result.rows);
    } catch (err) {
      console.error('Error getting analyzed files:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static files from the dist directory
  const distDir = path.join(__dirname, 'dist/public');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    console.log(`Serving static files from ${distDir}`);
    
    // Fallback for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn(`Static directory ${distDir} not found`);
    
    // Simple fallback page
    app.get('*', (req, res) => {
      res.send(`
        <html>
          <head><title>PanicSense</title></head>
          <body>
            <h1>Server is running but frontend is not built</h1>
            <p>API endpoints are available but the frontend was not properly built.</p>
          </body>
        </html>
      `);
    });
  }
  
  return server;
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('========================================');
    console.log(`Starting server initialization at: ${new Date().toISOString()}`);
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
    
    // Register routes
    await registerRoutes();
    console.log('Routes registered successfully');

    // Start server
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

// Start server
startServer().catch(err => {
  console.error('Error during startup:', err);
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} (startup error occurred)`);
  });
});