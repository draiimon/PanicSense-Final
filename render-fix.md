# Render Deployment Fix

This document outlines a simple fix to deploy the PanicSense app on Render's free tier without Vite dependency issues.

## Problem
The application fails to deploy on Render due to Vite dependencies being required in production mode.

## Solution
Use a minimal deployment script that doesn't rely on Vite or complex dependencies.

## Instructions

1. Go to your Render dashboard for PanicSense-Final
2. Update these settings:

   **Build Command:** 
   ```
   bash ./minimal-build.sh
   ```

   **Start Command:**
   ```
   node render-start.js
   ```

3. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or let Render set this automatically)
   - `SESSION_SECRET`: (generate a random string or let Render generate it)
   - `RENDER_ENV`: `production`

4. Click "Save Changes" to trigger a new deployment

## What This Does

This creates a minimal deployment that:
- Avoids Vite completely
- Serves a simple landing page
- Provides basic API endpoints
- Sets up proper health checks for Render

The minimal deployment allows you to verify the server is running properly without complex frontend dependencies.

## After Successful Deployment

Once the minimal version is deployed successfully, you can:
1. Check that the server can connect to your database
2. Test the API endpoints
3. Gradually add more functionality if needed

## Limitations

This is a simplified deployment that only provides basic functionality. The full React frontend will not be available in this mode.