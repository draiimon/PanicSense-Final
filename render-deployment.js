/**
 * RENDER DEPLOYMENT SCRIPT
 * Very simple server without any Vite dependencies
 */

// Core Node.js modules
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.RENDER_ENV = 'production';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist/public (if it exists)
if (fs.existsSync(path.join(__dirname, 'dist', 'public'))) {
  app.use(express.static(path.join(__dirname, 'dist', 'public')));
}

// Basic health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API status endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'production-minimal', 
    version: '1.0',
    message: 'Limited functionality in minimal deployment mode'
  });
});

// Simple fallback HTML if no static files exist
app.get('*', (req, res) => {
  // Check if we have a built index.html
  const indexPath = path.join(__dirname, 'dist', 'public', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Otherwise, send a minimal HTML page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PanicSense - Disaster Analysis</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; }
        .message { background: #f0f9ff; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>PanicSense</h1>
      <div class="message">
        <h2>Minimal Deployment Version</h2>
        <p>This is a simplified deployment of the PanicSense application.</p>
        <p>API Status: <span id="status">Checking...</span></p>
      </div>
      <script>
        fetch('/api/health')
          .then(res => res.json())
          .then(data => {
            document.getElementById('status').textContent = data.status;
          })
          .catch(err => {
            document.getElementById('status').textContent = 'Error: ' + err.message;
          });
      </script>
    </body>
    </html>
  `);
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================`);
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`Server start time: ${new Date().toISOString()}`);
  console.log(`======================================`);
});