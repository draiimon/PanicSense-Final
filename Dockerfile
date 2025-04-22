# ========== 1. Build Stage ==========
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Install Node dependencies first (with better caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Build the frontend (skip error if already built)
RUN npm run build || echo "No frontend build needed"

# ========== 2. Final Runtime Stage ==========
FROM node:18

# Set working directory
WORKDIR /app

# Install Python and build tools for sentiment analysis
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and production build from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/client/dist /app/client/dist

# Copy server and Python source only
COPY server/ ./server/
COPY python/ ./python/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r python/requirements.txt

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Start the production-ready server
CMD ["node", "server/index-wrapper.js"]
