# PanicSense Render Deployment Guide

## Quick Start
Follow these steps to deploy PanicSense on Render's free tier without issues.

### Method 1: Super Simple Deployment (Recommended for Free Tier)

1. Go to your Render dashboard
2. Set **Build Command** to:
   ```
   bash ./minimal-build.sh
   ```
3. Set **Start Command** to:
   ```
   node render-start.js
   ```
4. Add these Environment Variables:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: (generate or let Render create)
   - `RENDER_ENV`: `production`

This creates a lightweight deployment without Vite dependencies. Perfect for testing the backend and API endpoints.

### Method 2: Full Deployment (More Complex)

If you need the full React frontend:

1. Set **Build Command** to:
   ```
   npm install && npm run build
   ```
2. Set **Start Command** to:
   ```
   node server/server.js
   ```
3. Add these Environment Variables:
   - `NODE_ENV`: `production`
   - `VITE_SKIP`: `true`
   - `SESSION_SECRET`: (generate or let Render create)
   - `RUNTIME_ENV`: `render`
   - `DATABASE_URL`: (your database connection string)
   - `GROQ_API_KEY`: (your Groq API key if using AI features)

## Troubleshooting

### Vite Dependency Errors
If you see errors about missing Vite packages:
- Use Method 1 above
- Or ensure all dependencies are properly installed in production

### Database Connection Issues
- Check that your `DATABASE_URL` is correct
- Make sure your database is accessible from Render

### Port Binding Issues
- Let Render assign the port automatically
- Your app should read from `process.env.PORT`

## Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| NODE_ENV | Set to "production" for deployment | Yes |
| PORT | Automatically assigned by Render | No |
| DATABASE_URL | PostgreSQL connection string | If using DB |
| SESSION_SECRET | Secret for session encryption | Yes |
| GROQ_API_KEY | API key for Groq AI services | If using AI |
| RENDER_ENV | Set to "production" | Yes |
| VITE_SKIP | Set to "true" to skip Vite middleware | Yes |