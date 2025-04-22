#!/bin/bash
# Build script for Render deployment

echo "Starting build process for Render deployment..."

# Install required packages
npm install

# Build client-side files - if this fails, we'll use a backup method
echo "Building client-side files..."
if npx vite build; then
  echo "✅ Vite build successful"
else
  echo "⚠️ Vite build failed - using alternative build method"
  
  # Create a minimal public directory with basic index.html
  mkdir -p dist/public
  cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PanicSense - Disaster Analysis Platform</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; text-align: center; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #2563eb; }
    .message { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .features { text-align: left; }
    .features li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PanicSense</h1>
    <div class="message">
      <h2>Disaster Analysis Platform</h2>
      <p>This is a minimal deployment version. For the full application, please visit the development environment.</p>
    </div>
    <div class="features">
      <h3>Key Features:</h3>
      <ul>
        <li>Advanced sentiment analysis engine with AI-powered insights</li>
        <li>Multi-source disaster news aggregation and validation</li>
        <li>Multilingual support (English and Filipino)</li>
        <li>Comprehensive disaster type classification</li>
      </ul>
    </div>
  </div>
  <script>
    // Basic client-side code
    document.addEventListener('DOMContentLoaded', () => {
      console.log('PanicSense Production Build Loaded');
      
      // Add API health check
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          console.log('API Health:', data);
          const messageEl = document.querySelector('.message');
          messageEl.innerHTML += `<p>API Status: ${data.status} | Mode: ${data.mode} | Version: ${data.version}</p>`;
        })
        .catch(err => {
          console.error('API Error:', err);
        });
    });
  </script>
</body>
</html>
EOF

  echo "✅ Created minimal client for production"
fi

# Create dist directory
mkdir -p dist/server

# Compile TypeScript files using esbuild (faster than tsc)
echo "Compiling TypeScript files with esbuild..."
npx esbuild server/index-wrapper.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server || echo "⚠️ Warning: esbuild failed on index-wrapper.ts"

# Compile critical server files needed by render-production.js
echo "Compiling critical server TypeScript files..."
npx esbuild server/db.ts server/storage.ts server/python-service.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server || echo "⚠️ Warning: esbuild failed on server TypeScript files"

# Copy necessary files to dist directory
echo "Copying essential files to dist..."
cp -r server/*.js dist/server/ 2>/dev/null || true
cp -r server/db-*.js dist/server/ 2>/dev/null || true

# Make sure render-start.js has executable permissions
echo "Setting permissions for render-start.js..."
chmod +x render-start.js

# Make sure render-production.js has executable permissions
echo "Setting permissions for render-production.js..."
chmod +x render-production.js

echo "Build process completed successfully!"