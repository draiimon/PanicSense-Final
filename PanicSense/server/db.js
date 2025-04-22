/**
 * Simple ES Module compatible database connection
 * For use with Replit and Neon PostgreSQL
 */

import pg from 'pg';
const { Pool } = pg;

// Use DATABASE_URL from environment variables
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("⚠️ WARNING: No DATABASE_URL environment variable found");
  databaseUrl = ""; // Empty string will cause connect error later, but prevent crash here
}

// Remove the 'DATABASE_URL=' prefix if it exists (sometimes happens in environment vars)
if (databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.substring('DATABASE_URL='.length);
}

// Log database type but not the connection string (for security)
console.log(`Using database connection type: ${databaseUrl.split(':')[0]}`);

// Create the pool with SSL enabled (important for Neon.tech PostgreSQL)
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
});

// Export in a way compatible with older requires
export default {
  pool
};