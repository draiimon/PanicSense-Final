#!/bin/bash

# Start script for PanicSense Docker Containerized Application

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting PanicSense application initialization...${NC}"

echo -e "${YELLOW}[DEBUG] System Information:${NC}"
uname -a

echo -e "${YELLOW}[DEBUG] Python Information:${NC}"
python3 --version
which python3

echo -e "${YELLOW}[DEBUG] NodeJS Information:${NC}"
node --version
which node

echo -e "${YELLOW}[DEBUG] Key Environment Variables:${NC}"
env | grep -E "PYTHON|NODE|GROQ|ENABLE|DEBUG"

echo -e "${YELLOW}[DEBUG] Current Working Directory:${NC}"
pwd

echo -e "${YELLOW}[DEBUG] Application Directory Structure:${NC}"
ls -la /app

echo -e "${YELLOW}[DEBUG] Python Directory Structure:${NC}"
ls -la /app/python

mkdir -p /app/uploads/data /app/uploads/profile_images /app/uploads/temp
chmod -R 777 /app/uploads

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL is not set. Please configure this in your Render environment variables.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking database connection...${NC}"
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
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

echo -e "${YELLOW}Performing database setup...${NC}"
echo -e "${YELLOW}Running emergency database fix directly...${NC}"
node server/direct-db-fix.js

if [ "$RUNTIME_ENV" = "render" ]; then
  echo -e "${GREEN}Detected Render environment, applying specialized fixes${NC}"
  /app/render-db-fix.sh
  echo -e "${YELLOW}Running secondary database fixes...${NC}"
  node -e "try { console.log('Fixing database tables...'); const { pool } = require('./server/db'); pool.query('ALTER TABLE analyzed_files ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); pool.query('ALTER TABLE disaster_events ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch(e) { console.error('Error fixing tables:', e.message); }"
  echo -e "${GREEN}Render database fixes completed${NC}"
else
  echo -e "${YELLOW}Not running on Render, skipping specialized fixes${NC}"
fi

echo -e "${YELLOW}[DEBUG] Testing Python with NLTK import...${NC}"
python3 -c "import sys; print('Python path:', sys.path); import nltk; print('NLTK path:', nltk.data.path); import pandas; print('Pandas version:', pandas.__version__)" || echo -e "${RED}[ERROR] Failed to import Python libraries${NC}"

echo -e "${YELLOW}[DEBUG] Testing process.py...${NC}"
cd /app/python && python3 process.py
