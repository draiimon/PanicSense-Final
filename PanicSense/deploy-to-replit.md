# PanicSense Replit Deployment Guide

This guide will help you deploy PanicSense to Replit, a cloud-based development and hosting platform.

## Prerequisites

1. A Replit account (sign up at [replit.com](https://replit.com) if you don't have one)
2. A Groq API key (obtain from [groq.com](https://console.groq.com/keys))
3. A PostgreSQL database (recommended: [Neon](https://neon.tech) - they offer a free tier)

## Deployment Steps

### 1. Fork the PanicSense Project on Replit

1. Go to the PanicSense Replit project
2. Click the "Fork" button to create your own copy
3. Wait for the project to be forked and initialized

### 2. Configure Environment Variables

1. In your forked project, click on the "Secrets" tab (lock icon) in the Tools panel
2. Add the following environment variables:

```
DATABASE_URL=your_postgres_connection_string
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
SESSION_SECRET=a_random_secure_string
RUNTIME_ENV=replit
```

3. Replace the placeholders with your actual credentials

### 3. Set Up the Database

1. Make sure your PostgreSQL database is created and accessible
2. The application will automatically create the required tables on first run
3. You can manually push the schema by running this command in the Replit Shell:
   ```
   npm run db:push
   ```

### 4. Start the Application

1. Click the "Run" button at the top of the Replit interface
2. Wait for the application to build and start
3. You should see output indicating the server is running
4. Click on the WebView tab to see your running application

## Configuration Options

You can further customize PanicSense by adding these environment variables:

- `PORT`: Port to run the server on (default: 5000)
- `NODE_ENV`: Environment setting (default: development)
- `PYTHON_PATH`: Path to Python executable (default: python3)
- `PYTHON_SERVICE_ENABLED`: Enable Python processing service (default: true)
- `TZ`: Timezone (default: Asia/Manila)

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Make sure your database is accessible from Replit
- Check if your database requires SSL (most cloud databases do)

### API Rate Limiting

- If you see rate limiting errors, adjust the news refresh interval
- Consider upgrading your Groq API plan for higher rate limits

### Application Crashes

1. Check the console output for error messages
2. Verify all required environment variables are set
3. Ensure your database schema is up to date

## Keeping Your Deployment Updated

When new versions of PanicSense are released:

1. Pull the latest changes from the main repository
2. Run `npm install` to update dependencies
3. Run `npm run db:push` to update the database schema
4. Restart your application

## Support

If you encounter any issues with your Replit deployment, please:

1. Check the console logs for error messages
2. Verify your environment variables
3. Contact the PanicSense development team for support