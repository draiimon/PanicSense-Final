import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Prioritize Neon database URL if available, fall back to regular DATABASE_URL
let databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Remove the 'DATABASE_URL=' prefix if it exists
if (databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.substring('DATABASE_URL='.length);
}

console.log(`Using database connection type: ${databaseUrl.split(':')[0]}`);

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
});

console.log('Connecting to database with schema:', Object.keys(schema).join(', '));
export const db = drizzle(pool, { schema });
