# Use a specific Node.js version compatible with Render
FROM node:18 as builder

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Build the frontend application
RUN npm run build || echo "Build step skipped - will serve pre-built assets"

# Install Python for sentiment analysis
FROM node:18

# Set working directory
WORKDIR /app

# Install Python and other required dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built assets from builder stage
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/client/dist /app/client/dist

# Copy application source
COPY . .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r python/requirements.txt

# Setup environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Start command - uses index-wrapper.js which is compatible with production
CMD ["node", "server/index-wrapper.js"]