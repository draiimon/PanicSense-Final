# PanicSense

PanicSense is a comprehensive real-time disaster news and sentiment analysis platform designed to provide critical emergency insights and community support across multiple regions.

## Features
- Advanced sentiment analysis engine with AI-powered insights
- TypeScript/React frontend with responsive design
- Multilingual support (English and Filipino)
- Groq AI for natural language processing
- Neon database for robust data persistence
- Multi-source disaster news aggregation and validation system

## Deployment to Render (UPDATED SIMPLE METHOD)

### Simplified Deployment

1. Fork this repository to your GitHub account
2. Log in to [Render](https://render.com)
3. Create a new Web Service and select your forked repository
4. Configure as follows:
   - **Build Command**: `npm install`
   - **Start Command**: `node start-server.js`
5. Add these environment variables:
   - `NODE_ENV`: production
   - `DATABASE_URL`: [Your PostgreSQL connection string]
   - `GROQ_API_KEY`: [Your GROQ API key for AI features]

That's it! This method bypasses vite build issues while preserving all functionality.

## Local Development
To run the project locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## License
MIT