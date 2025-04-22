#!/bin/bash

# PanicSense Render Compatibility Check Tool
# This script checks if your Replit project is ready for Render deployment

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PanicSense Render Compatibility Check Tool${NC}"
echo -e "Checking your project for Render deployment compatibility...\n"

ISSUES=0

# Check if Dockerfile exists
if [ -f "Dockerfile" ]; then
  echo -e "${GREEN}✅ Dockerfile exists${NC}"
else
  echo -e "${RED}❌ Dockerfile missing - Required for containerized deployment${NC}"
  ISSUES=$((ISSUES + 1))
fi

# Check if start.sh exists
if [ -f "start.sh" ]; then
  echo -e "${GREEN}✅ start.sh exists${NC}"
else
  echo -e "${RED}❌ start.sh missing - Required for application startup${NC}"
  ISSUES=$((ISSUES + 1))
fi

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
  echo -e "${GREEN}✅ render.yaml exists${NC}"
else
  echo -e "${RED}❌ render.yaml missing - Recommended for one-click deployment${NC}"
  ISSUES=$((ISSUES + 1))
fi

# Check Python requirements
if grep -q "python-dotenv" pyproject.toml 2>/dev/null; then
  echo -e "${GREEN}✅ Python dependencies found in pyproject.toml${NC}"
else
  echo -e "${YELLOW}⚠️ python-dotenv not found in pyproject.toml - Python dependencies may not be complete${NC}"
fi

# Check Node.js requirements
if grep -q "dependencies" package.json 2>/dev/null; then
  echo -e "${GREEN}✅ Node.js dependencies found in package.json${NC}"
else
  echo -e "${RED}❌ package.json missing or incomplete${NC}"
  ISSUES=$((ISSUES + 1))
fi

# Check for upload directories
mkdir -p uploads/data
mkdir -p uploads/profile_images
mkdir -p uploads/temp
touch uploads/data/.gitkeep
touch uploads/profile_images/.gitkeep
touch uploads/temp/.gitkeep

echo -e "${GREEN}✅ Upload directories and .gitkeep files created${NC}"

# Summary
echo -e "\n${YELLOW}Compatibility Check Summary:${NC}"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ Your project appears ready for Render deployment!${NC}"
else
  echo -e "${YELLOW}⚠️ Found $ISSUES issue(s) that should be addressed before deployment.${NC}"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Create a new GitHub repository for your Docker configuration"
echo -e "2. Push these files to your repository"
echo -e "3. Connect your repository to Render.com"
echo -e "4. Create a new Web Service with Docker configuration"
echo -e "5. Set the necessary environment variables in Render dashboard"