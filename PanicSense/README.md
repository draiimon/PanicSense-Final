# PanicSense: Philippine Disaster Monitoring Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

An advanced AI-powered disaster monitoring and community resilience platform for the Philippines, leveraging cutting-edge technology to enhance emergency preparedness and response capabilities.

## Features

- Real-time disaster event monitoring
- Sentiment analysis of disaster reports
- Interactive map of disaster areas
- CSV data upload and analysis
- Multilingual support (Filipino and English)
- AI-powered disaster classification
- Mobile-friendly responsive design

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn components
- **Backend**: Node.js with Express, PostgreSQL with Drizzle ORM
- **AI/ML**: Python processing with NLTK, scikit-learn, and Groq AI integration
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Docker container for Render.com

## Deployment

This repository contains all necessary Docker configuration for deploying the PanicSense platform to Render.com. For detailed deployment instructions, see [README-RENDER.md](README-RENDER.md).

### Quick Start

1. Fork this repository
2. Click the "Deploy to Render" button at the top of this README
3. Configure your environment variables (see below)
4. Enjoy your deployed PanicSense instance!

## Environment Variables

The following environment variables need to be configured in your Render service:

```
DATABASE_URL=your_neondb_postgresql_connection_string
DB_SSL_REQUIRED=true
NODE_ENV=production
TZ=Asia/Manila
PYTHON_PATH=python3
PYTHON_SERVICE_ENABLED=true
RUNTIME_ENV=render
SESSION_SECRET=your_session_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
```

## Local Development

To run this project locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the necessary environment variables
4. Start the development server: `npm run dev`

## License

This project is licensed under the MIT License.