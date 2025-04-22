#!/bin/bash
# Build script for Render deployment

echo "Starting build process for Render deployment..."

# Install required packages
npm install

# Build client-side files
echo "Building client-side files..."
npm run dev:build || npx vite build

# Compile TypeScript files
echo "Compiling TypeScript files..."
npx tsc

# Compile index-wrapper.ts specifically
echo "Compiling server/index-wrapper.ts..."
npx tsc --skipLibCheck server/index-wrapper.ts --outDir dist/server

# Copy necessary files to dist directory
echo "Copying essential files to dist..."
mkdir -p dist/server
cp -r server/*.js dist/server/ 2>/dev/null || true
cp -r server/db-*.js dist/server/ 2>/dev/null || true

# Create Render start script
echo "Creating Render start script..."
cat > render-start.js << EOF
/**
 * Render start script
 * This is the entry point for the Render deployment
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Import the compiled server
require('./dist/server/index-wrapper.js');
EOF

echo "Build process completed successfully!"