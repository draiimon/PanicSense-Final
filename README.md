# PanicSense

PanicSense is a comprehensive real-time disaster news and sentiment analysis platform designed to provide critical emergency insights and community support across multiple regions.

## Features
- Advanced sentiment analysis engine with AI-powered insights
- TypeScript/React frontend with responsive design
- Multilingual support (English and Filipino)
- Groq AI for natural language processing
- Neon database for robust data persistence
- Multi-source disaster news aggregation and validation system

## Deployment to Render using Docker (RECOMMENDED)

### Docker Deployment (Full Application)

1. Fork this repository to your GitHub account
2. Log in to [Render](https://render.com)
3. Create a new **Web Service** and select your forked repository
4. Change the Environment to **Docker**
5. No need to modify build command or start command as Docker will handle it
6. Add these environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `DATABASE_URL`: [Your PostgreSQL connection string]
   - `GROQ_API_KEY`: [Your GROQ API key for AI features]

That's it! Using Docker ensures that all dependencies (Node.js, Python, etc.) are correctly installed and configured.

### Docker Benefits
- No build issues - Docker handles all dependencies
- Consistent environment across development and production
- Python integration works perfectly with sentiment analysis
- Full application functionality including frontend and API endpoints

## Local Development

### Option 1: Docker (Recommended)
The easiest way to run the project locally is with Docker:

```bash
# Create a .env file with your database credentials
echo "DATABASE_URL=postgres://postgres:postgres@db:5432/panicsense" > .env
echo "GROQ_API_KEY=your-groq-api-key" >> .env

# Start the containers
docker-compose up -d

# Access the app at http://localhost:10000
```

### Option 2: Standard Development
If you prefer not to use Docker:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Database Setup
For local development without Docker, you'll need to:
1. Set up a PostgreSQL database
2. Set the DATABASE_URL environment variable
3. Run `npm run db:push` to create the schema

## License
MIT