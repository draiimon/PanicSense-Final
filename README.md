# PanicSense

PanicSense is a comprehensive real-time disaster news and sentiment analysis platform designed to provide critical emergency insights and community support across multiple regions.

## Features
- Advanced sentiment analysis engine with AI-powered insights
- TypeScript/React frontend with responsive design
- Multilingual support (English and Filipino)
- Groq AI for natural language processing
- Neon database for robust data persistence
- Multi-source disaster news aggregation and validation system

## Deployment to Render

### One-Click Deployment (Recommended)
The easiest way to deploy PanicSense is by using the included `render.yaml` file:

1. Fork this repository to your GitHub account
2. Log in to [Render](https://render.com)
3. Click "New" and select "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` and set up the project!
6. Make sure to add your `GROQ_API_KEY` in the environment variables section

### Manual Deployment
If you prefer manual deployment:

1. Create a new PostgreSQL database on Render
2. Create a new Web Service:
   - Build Command: `bash ./build.sh`
   - Start Command: `node render-start.js`
   - Environment Variables:
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `DATABASE_URL`: [Your PostgreSQL connection string]
     - `SESSION_SECRET`: [Generate a random string]
     - `GROQ_API_KEY`: [Your GROQ API key for AI features]

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