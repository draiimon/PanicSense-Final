/**
 * Database fix for "created_at" column errors
 * This script directly fixes the SQL queries in the server.js file if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverJsPath = path.join(__dirname, '..', 'server.js');

export async function fixDatabaseQueries() {
  try {
    console.log('🔧 Checking server.js for created_at column references...');
    
    // Only proceed if the file exists
    if (!fs.existsSync(serverJsPath)) {
      console.log('⚠️ server.js not found at path:', serverJsPath);
      return false;
    }
    
    // Read the server.js file
    let serverJs = fs.readFileSync(serverJsPath, 'utf8');
    
    // Fix for sentiment posts query
    let fixedServerJs = serverJs.replace(
      /const sentimentPosts = await client\.query\('SELECT \* FROM sentiment_posts ORDER BY created_at DESC LIMIT 100'\);/g,
      "const sentimentPosts = await client.query('SELECT * FROM sentiment_posts ORDER BY id DESC LIMIT 100');"
    );
    
    // Fix for disaster events query
    fixedServerJs = fixedServerJs.replace(
      /const disasterEvents = await client\.query\('SELECT \* FROM disaster_events ORDER BY created_at DESC'\);/g,
      "const disasterEvents = await client.query('SELECT * FROM disaster_events ORDER BY id DESC');"
    );
    
    // Fix for analyzed files query
    fixedServerJs = fixedServerJs.replace(
      /const analyzedFiles = await client\.query\('SELECT \* FROM analyzed_files ORDER BY created_at DESC'\);/g,
      "const analyzedFiles = await client.query('SELECT * FROM analyzed_files ORDER BY id DESC');"
    );
    
    // Only write the file if changes were made
    if (serverJs !== fixedServerJs) {
      fs.writeFileSync(serverJsPath, fixedServerJs);
      console.log('✅ Fixed created_at column references in server.js');
      return true;
    } else {
      console.log('ℹ️ No created_at column references found or already fixed in server.js');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fixing server.js:', error.message);
    return false;
  }
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Running database query fix script directly...');
  fixDatabaseQueries().then((result) => {
    console.log('Fix result:', result ? 'SUCCESS' : 'NO CHANGES NEEDED');
  }).catch((error) => {
    console.error('Error running fix:', error);
    process.exit(1);
  });
}