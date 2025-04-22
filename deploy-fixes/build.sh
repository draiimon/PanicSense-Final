#!/bin/bash
# Build script for Render deployment

echo "Starting build process for Render deployment..."

# Install required packages
npm install

# Build client-side files
echo "Building client-side files..."
npx vite build

# Create dist directory
mkdir -p dist/server

# Compile TypeScript files using esbuild (faster than tsc)
echo "Compiling TypeScript files with esbuild..."
npx esbuild server/index-wrapper.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Copy necessary files to dist directory
echo "Copying essential files to dist..."
cp -r server/*.js dist/server/ 2>/dev/null || true
cp -r server/db-*.js dist/server/ 2>/dev/null || true

# Create Render start script using ES modules syntax
echo "Creating Render start script..."
cat > render-start.js << EOF
/**
 * Render start script
 * This is the entry point for the Render deployment
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Import the compiled server using ES module syntax
import './dist/server/index-wrapper.js';
EOF

echo "Build process completed successfully!"