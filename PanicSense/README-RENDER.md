# Render Deployment Instructions

This document provides instructions for deploying the Disaster Monitoring System to Render.com.

## ONE-CLICK DEPLOYMENT

For the easiest deployment, click the button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

This will automatically deploy using the settings in the `render.yaml` file.

## Manual Deployment (Alternative Method)

### Prerequisites

1. A Render.com account
2. Your existing Neon PostgreSQL database

### Deployment Steps

### 1. Create a New Web Service on Render

1. Log in to your Render dashboard: https://dashboard.render.com/
2. Click **New** and select **Web Service**
3. Connect your GitHub repository or upload the code directly

### 2. Configure the Web Service

- **Name**: Choose a name for your application
- **Environment**: Select Docker
- **Region**: Singapore (best for Philippines)
- **Branch**: main (or your preferred branch)
- **Root Directory**: Leave empty
- **Plan Type**: Select your preferred plan (Free tier works for testing)

### 3. Set Environment Variables

In the Render dashboard, add the following environment variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_N5MsSKHuk1Qf@ep-silent-sun-a1u48xwz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_SSL_REQUIRED=true
NODE_ENV=production
TZ=Asia/Manila
PYTHON_PATH=python3
PYTHON_SERVICE_ENABLED=true
ENABLE_SOCIAL_SCRAPER=false
RUNTIME_ENV=render
SESSION_SECRET=your_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
DEBUG_MODE=false
VERBOSE_LOGGING=false
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**IMPORTANT**:
- Use your own NeonDB connection string for `DATABASE_URL`
- Generate a secure random value for `SESSION_SECRET`
- Use your actual `GROQ_API_KEY`

### 4. Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy your application using the Dockerfile and start.sh script
3. Once the build is complete, you can access your application at the provided URL

## Troubleshooting

If your application fails to deploy or run:

1. Check the Render logs for errors
2. Ensure your DATABASE_URL is correct and accessible
3. Verify that all required environment variables are set
4. Check that the Neon PostgreSQL database is accepting connections from Render's IP addresses

## Health Check

Your application includes a health check endpoint at `/api/health` that Render will use to verify the application is running. If this fails, check the logs.

## Additional Information

- The application runs on the port assigned by Render (via the PORT environment variable)
- All database tables and schema will be automatically created on first run
- The application will apply emergency database fixes if needed

**Note**: This deployment uses Docker to ensure compatibility and consistent behavior between Replit and Render environments.