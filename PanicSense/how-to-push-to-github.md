# How to Push Docker Configuration to GitHub

Dahil sa security restrictions sa Replit, hindi natin magawa ang direct push sa GitHub. Sumusunod ang mga paraan para i-upload ang Docker configuration:

## Option 1: Manual Download and Upload

1. **Download ang tar.gz file**
   - Sa Replit File panel, i-click ang `/home/runner/workspace/panicsense-docker.tar.gz`
   - Right-click at i-download ito sa iyong computer

2. **Extract ang files**
   - Gamit ang tool tulad ng 7-Zip o WinRAR, i-extract ang tar.gz file

3. **Upload sa GitHub**
   - Pumunta sa https://github.com/draiimon/PanicSense
   - I-click ang "Add file" → "Upload files"
   - I-drag and drop ang lahat ng na-extract na files
   - I-commit ang mga files

## Option 2: Copy-Paste ng Code

Ang mga sumusunod ay ang mga pangunahing Docker configuration files. I-create ang mga ito direkta sa iyong GitHub repository:

### Dockerfile
```dockerfile
FROM node:20-slim

# Install Python and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    curl \
    procps \
    wget \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies with explicit production
RUN npm ci --only=production

# Install dev dependencies separately to ensure build tools are available
RUN npm ci --only=development

# Create Python virtual environment and install Python dependencies
COPY pyproject.toml .
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir pandas numpy scikit-learn nltk torch beautifulsoup4 langdetect python-dotenv pytz requests tqdm snscrape openai

# Install NLTK data
RUN python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Copy app source
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000
ENV TZ=Asia/Manila
ENV PYTHON_PATH=python3
ENV PYTHON_SERVICE_ENABLED=true
ENV RUNTIME_ENV=render
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Expose the port the app runs on - use Render's PORT variable
EXPOSE $PORT

# Create a directory for uploads and ensure proper permissions
RUN mkdir -p /app/uploads/data /app/uploads/profile_images /app/uploads/temp
RUN chmod -R 777 /app/uploads

# Copy and set execute permission for startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Add a basic healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Run the application using the startup script
CMD ["/app/start.sh"]
```

### start.sh
```bash
#!/bin/bash

# Start script for PanicSense Docker Containerized Application
# This script performs necessary initialization and starts the application

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting PanicSense application initialization...${NC}"

# Create required directories if they don't exist
mkdir -p /app/uploads/data
mkdir -p /app/uploads/profile_images
mkdir -p /app/uploads/temp

# Check if the environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL is not set. Please configure this in your Render environment variables.${NC}"
  exit 1
fi

# Wait for NeonDB to be available
echo -e "${YELLOW}Checking database connection...${NC}"
MAX_RETRIES=30
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
  # Check if database is available using Node script
  node verify-db.js > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database connection successful!${NC}"
    break
  fi
  
  COUNT=$((COUNT + 1))
  echo -e "${YELLOW}Waiting for database connection... ($COUNT/$MAX_RETRIES)${NC}"
  sleep 2
  
  if [ $COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Failed to connect to database after $MAX_RETRIES attempts.${NC}"
    echo -e "${YELLOW}The application will start anyway, but may not function correctly.${NC}"
  fi
done

# Apply database migrations if needed
echo -e "${YELLOW}Performing database setup...${NC}"
node server/direct-db-fix.js

# Start the application
echo -e "${GREEN}Starting PanicSense application on port $PORT...${NC}"
exec node server.js
```

### .dockerignore
```
# Development files
.git
.github
.vscode
.idea
*.md
!README-RENDER.md
!README.md

# Node.js
node_modules
npm-debug.log

# Build artifacts
/dist
/build
/.next
/.cache

# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# Temporary files
/tmp
/temp
*.log
*.tmp

# Large data files (these should be mounted or fetched during runtime)
/uploads/data/*
/uploads/profile_images/*
/uploads/temp/*

# Keep .gitkeep files for empty directories
!uploads/data/.gitkeep
!uploads/profile_images/.gitkeep
!uploads/temp/.gitkeep
```

### render.yaml
```yaml
services:
  - type: web
    name: disaster-monitoring-ph
    env: docker
    plan: free
    region: singapore
    buildCommand: ""
    startCommand: ""
    envVars:
      - key: NODE_ENV
        value: production
      - key: TZ
        value: Asia/Manila
      - key: PYTHON_PATH
        value: python3
      - key: PYTHON_SERVICE_ENABLED
        value: "true"
      - key: ENABLE_SOCIAL_SCRAPER
        value: "false"
      - key: RUNTIME_ENV
        value: render
      - key: DB_SSL_REQUIRED
        value: "true"
      - key: NODE_TLS_REJECT_UNAUTHORIZED
        value: "0"
      - key: DEBUG_MODE
        value: "false"
      - key: VERBOSE_LOGGING
        value: "false"
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: GROQ_API_KEY
        sync: false
      - key: GROQ_MODEL
        value: llama3-70b-8192
```

## Directory Structure
Kailangan mo ring i-create ang mga sumusunod na directory at empty files:
- `uploads/data/.gitkeep`
- `uploads/profile_images/.gitkeep`
- `uploads/temp/.gitkeep`

## After Pushing to GitHub
1. Sa Render.com, i-click ang "New" at piliin ang "Web Service"
2. I-connect ang GitHub repository
3. Piliin ang "Docker" bilang environment
4. I-set ang mga environment variables gaya ng nasa render.yaml file
5. Deploy ang application!