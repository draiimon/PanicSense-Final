/**
 * MINIMAL RENDER DEPLOYMENT SERVER
 * This file is a standalone server with no external dependencies
 * to run on Render.com
 */

// Import Node.js core modules
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Set environment variables
process.env.NODE_ENV = 'production';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Basic WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'minimal',
    version: '1.0'
  });
});

// Serve static files if they exist
const publicDir = path.join(__dirname, 'dist', 'public');
if (fs.existsSync(publicDir)) {
  console.log(`Serving static files from ${publicDir}`);
  app.use(express.static(publicDir));
}

// Default fallback - serve a simple HTML page
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PanicSense - Minimal Deployment</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; }
        h1 { color: #2563eb; }
        .message { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>PanicSense</h1>
      <div class="message">
        <h2>Minimal Deployment</h2>
        <p>This is a simplified version of the PanicSense application for deployment testing.</p>
        <p id="status">Checking API status...</p>
      </div>
      <script>
        fetch('/api/health')
          .then(res => res.json())
          .then(data => {
            document.getElementById('status').textContent = 
              'API Status: ' + data.status + ' | Mode: ' + data.mode;
          })
          .catch(err => {
            document.getElementById('status').textContent = 'API Error: ' + err.message;
          });
      </script>
    </body>
    </html>
  `);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`===========================================`);
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`Server start time: ${new Date().toISOString()}`);
  console.log(`===========================================`);
});