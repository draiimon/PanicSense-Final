# PanicSense - Real-time Disaster Monitoring System

PanicSense is a real-time disaster monitoring and sentiment analysis platform specially designed for Philippine disaster response. The application monitors news sources, analyzes disaster-related content, and provides valuable insights for emergency preparedness and response.

![PanicSense Dashboard](https://i.imgur.com/oyvn8Zf.png)

## 🚀 Features

- **Real-time News Monitoring**: Automatically scrapes and analyzes disaster-related news from Philippine sources
- **Sentiment Analysis**: AI-powered sentiment analysis of disaster-related content using Groq API
- **Disaster Event Tracking**: Categorizes and tracks ongoing disaster events
- **CSV Upload Analysis**: Batch processing of disaster-related text data
- **Interactive Dashboard**: User-friendly interface for monitoring and analysis
- **Data Export**: Export analyzed data in CSV format

## 🛠️ Tech Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - React Query for data fetching
  - React Router for navigation
  - Chart.js for data visualization

- **Backend**:
  - Node.js with Express
  - TypeScript for type safety
  - PostgreSQL (Neon.tech) database
  - Drizzle ORM for database interactions
  - WebSocket for real-time updates

- **AI & Data Processing**:
  - Groq API with DeepSeek R1 Distill Llama 70B for real-time analysis
  - Gemma2 9B IT for CSV batch processing
  - Python for data processing and model interaction
  - pandas and NumPy for data manipulation

## 📋 Prerequisites

Before running PanicSense, you need to have these installed:

- Node.js (v18+)
- Python 3.9+ 
- PostgreSQL database (or Neon.tech account)

## 🚀 Local Setup

Follow these steps to run PanicSense locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/PanicSense.git
   cd PanicSense
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies**:
   ```bash
   pip install pandas numpy langdetect requests
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL="postgresql://your_username:your_password@your_host:your_port/your_database?sslmode=require"
   GROQ_API_KEY="your_groq_api_key"
   ```

5. **Initialize the database**:
   ```bash
   npm run db:push
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   Open your browser and go to `http://localhost:5000`

## 🌐 Deployment Options

### Deploying to Render.com (Free Tier Compatible)

1. **Create a new Web Service** on Render:
   - Connect your GitHub repository
   - Select the branch to deploy

2. **Configure the service**:
   - **Name**: `panicSense` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server/index-wrapper.js`

3. **Add environment variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `GROQ_API_KEY`: Your Groq API key
   - `PORT`: `10000` (Render will automatically set this)

4. **Create and deploy!**

### Deploying to Railway

1. **Create a new project** on Railway:
   - Connect your GitHub repository

2. **Add a PostgreSQL database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create environment variables

3. **Configure deployment**:
   - Set the following variables in "Variables" section:
     - `GROQ_API_KEY`: Your Groq API key
     - Check that `DATABASE_URL` is automatically set
   - For the deploy settings:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `node server/index-wrapper.js`
     - **Root Directory**: `/`

4. **Deploy the application**:
   - Railway will automatically deploy when you push changes

## 📊 Database Schema

PanicSense uses the following main tables:

- `users`: User accounts and authentication
- `sentiment_posts`: Analyzed text with sentiment information
- `disaster_events`: Tracked disaster events
- `analyzed_files`: CSV files processed for batch analysis

## 🧠 AI Models

PanicSense uses two primary AI models through the Groq API:

1. **DeepSeek R1 Distill Llama 70B**: For real-time sentiment analysis and disaster detection
2. **Gemma2 9B IT**: For batch CSV processing and analysis

## 🛠️ Useful Commands

- **Development**: `npm run dev` - Start development server
- **Build**: `npm run build` - Build for production
- **Start (Production)**: `npm start` - Start production server
- **Database Push**: `npm run db:push` - Push schema changes to database
- **Lint**: `npm run lint` - Run ESLint
- **Type Check**: `npm run typecheck` - Check TypeScript types

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.