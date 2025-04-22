/**
 * EMERGENCY DATABASE FIX
 * Direct database fix for Replit deployment
 * This script will:
 * 1. Create missing tables if they don't exist
 * 2. Ensure all tables have the correct columns
 * 3. Add sample data if tables are empty
 */

import pg from 'pg';
const { Pool } = pg;

export async function emergencyDatabaseFix() {
  console.log('⚠️ RUNNING EMERGENCY DATABASE FIX');
  
  let pool;
  let client;
  
  try {
    // Connect to database using DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("❌ No DATABASE_URL found in environment variables");
      return false;
    }
    
    console.log("🔄 Connecting to database directly...");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
    });

    client = await pool.connect();
    console.log(`✅ Successfully connected to PostgreSQL database`);
    
    // Create basic tables (if they don't exist)
    console.log("🔄 Creating/verifying disaster_events table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS disaster_events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        severity VARCHAR(50),
        event_type VARCHAR(50),
        created_by VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("🔄 Creating/verifying sentiment_posts table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sentiment_posts (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(100),
        language VARCHAR(50),
        sentiment VARCHAR(50),
        confidence FLOAT,
        disaster_type VARCHAR(100),
        location VARCHAR(255)
      )
    `);
    
    console.log("🔄 Creating/verifying analyzed_files table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyzed_files (
        id SERIAL PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        row_count INTEGER,
        accuracy FLOAT,
        precision FLOAT,
        recall FLOAT,
        f1_score FLOAT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure tables have proper columns (if created_at is missing)
    console.log("🔄 Verifying disaster_events columns...");
    try {
      const disasterResult = await client.query("SELECT created_at FROM disaster_events LIMIT 1");
      console.log("✅ disaster_events.created_at exists");
    } catch (error) {
      if (error.message.includes("does not exist")) {
        console.log("⚠️ Adding timestamp column to disaster_events as created_at is missing");
        try {
          await client.query("ALTER TABLE disaster_events ADD COLUMN timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
          console.log("✅ Added timestamp column to disaster_events");
        } catch (alterError) {
          console.error("❌ Error adding timestamp column:", alterError.message);
        }
      }
    }
    
    console.log("🔄 Verifying analyzed_files columns...");
    try {
      const filesResult = await client.query("SELECT created_at FROM analyzed_files LIMIT 1");
      console.log("✅ analyzed_files.created_at exists");
    } catch (error) {
      if (error.message.includes("does not exist")) {
        console.log("⚠️ Adding timestamp column to analyzed_files as created_at is missing");
        try {
          await client.query("ALTER TABLE analyzed_files ADD COLUMN timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
          console.log("✅ Added timestamp column to analyzed_files");
        } catch (alterError) {
          console.error("❌ Error adding timestamp column:", alterError.message);
        }
      }
    }
    
    // Add sample data if tables are empty
    console.log("🔄 Checking if sample data is needed...");
    
    const disasterCount = await client.query("SELECT COUNT(*) FROM disaster_events");
    if (parseInt(disasterCount.rows[0].count) === 0) {
      console.log("⚠️ Adding sample disaster event as table is empty");
      
      // Insert sample disaster event
      await client.query(`
        INSERT INTO disaster_events (name, description, location, severity, event_type)
        VALUES ('Typhoon in Coastal Areas', 'Based on 3 reports from the community. Please stay safe.', 'Metro Manila, Philippines', 'High', 'Typhoon')
      `);
    }
    
    const sentimentCount = await client.query("SELECT COUNT(*) FROM sentiment_posts");
    if (parseInt(sentimentCount.rows[0].count) === 0) {
      console.log("⚠️ Adding sample sentiment post as table is empty");
      
      // Insert sample sentiment post
      await client.query(`
        INSERT INTO sentiment_posts (text, source, language, sentiment, confidence, disaster_type, location)
        VALUES ('My prayers to our brothers and sisters in Visayas region..', 'News', 'en', 'neutral', 0.85, 'Typhoon', 'Visayas, Philippines')
      `);
    }
    
    const filesCount = await client.query("SELECT COUNT(*) FROM analyzed_files");
    if (parseInt(filesCount.rows[0].count) === 0) {
      console.log("⚠️ Adding sample analyzed file as table is empty");
      
      // Insert sample analyzed file
      await client.query(`
        INSERT INTO analyzed_files (original_name, stored_name, row_count, accuracy, precision, recall, f1_score)
        VALUES ('MAGULONG DATA! (1).csv', 'batch-EJBpcspVXK_TZ717aZDM7-MAGULONG DATA! (1).csv', 100, 0.89, 0.91, 0.87, 0.89)
      `);
    }
    
    console.log("🔄 Creating upload_sessions table if needed...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS upload_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'active',
        file_name VARCHAR(255),
        progress INTEGER DEFAULT 0,
        error TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Emergency database fix completed successfully");
    return true;
    
  } catch (error) {
    console.error("❌ Error in emergency database fix:", error.message);
    return false;
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

// If this script is run directly
if (process.argv[1].endsWith('direct-db-fix.js')) {
  console.log('Running emergency database fix directly...');
  emergencyDatabaseFix().then(result => {
    console.log('Fix completed with result:', result ? 'SUCCESS' : 'FAILURE');
    process.exit(result ? 0 : 1);
  }).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}