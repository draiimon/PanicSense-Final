#!/bin/bash
# Super minimal build script for Render deployment
# Avoiding all complex dependencies

echo "====================================================="
echo "Starting minimal build process for Render deployment..."
echo "====================================================="

# Install only the necessary packages
npm install express ws

# Create the necessary directory structure
mkdir -p dist/public

# Create a minimal HTML page
cat > dist/public/index.html << 'EOF'
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
    <p>This is a simplified version of the PanicSense application.</p>
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
EOF

# Copy the minimal server to render-start.js
cp minimal.js render-start.js
chmod +x render-start.js

echo "====================================================="
echo "Minimal build process completed successfully!"
echo "====================================================="