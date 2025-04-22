/**
 * Database setup script for Replit deployment
 * This script creates necessary tables if they don't exist
 */

import pg from 'pg';
const { Pool } = pg;

async function setupDatabase() {
  let pool;
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("❌ No DATABASE_URL found in environment variables");
      return false;
    }
    
    console.log("Connecting to database...");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await pool.connect();
    console.log(`✅ Successfully connected to PostgreSQL database`);
    
    // Create tables if they don't exist
    console.log("Creating tables if they don't exist...");
    
    // Create disaster_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS disaster_events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        severity VARCHAR(50),
        event_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ disaster_events table created or already exists");

    // Create sentiment_posts table
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
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ sentiment_posts table created or already exists");

    // Create analyzed_files table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ analyzed_files table created or already exists");

    // Check if we have sample data
    const { rows } = await client.query("SELECT COUNT(*) FROM disaster_events");
    const count = parseInt(rows[0].count);
    
    // Add sample data if tables are empty
    if (count === 0) {
      console.log("Adding sample disaster data...");
      
      // Insert sample disaster event
      await client.query(`
        INSERT INTO disaster_events (name, description, location, severity, event_type)
        VALUES ('Typhoon in Coastal Areas', 'Based on 3 reports from the community. Please stay safe.', 'Metro Manila, Philippines', 'High', 'Typhoon')
      `);
      
      // Insert sample sentiment post
      await client.query(`
        INSERT INTO sentiment_posts (text, source, language, sentiment, confidence, disaster_type, location)
        VALUES ('My prayers to our brothers and sisters in Visayas region..', 'News', 'en', 'neutral', 0.85, 'Typhoon', 'Visayas, Philippines')
      `);
      
      // Insert sample analyzed file
      await client.query(`
        INSERT INTO analyzed_files (original_name, stored_name, row_count, accuracy, precision, recall, f1_score)
        VALUES ('MAGULONG DATA! (1).csv', 'batch-EJBpcspVXK_TZ717aZDM7-MAGULONG DATA! (1).csv', 100, 0.89, 0.91, 0.87, 0.89)
      `);
      
      console.log("✅ Sample data added successfully");
    } else {
      console.log(`ℹ️ Database already contains ${count} disaster events, skipping sample data`);
    }
    
    client.release();
    console.log("✅ Database setup complete");
    return true;
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    return false;
  } finally {
    if (pool) await pool.end();
  }
}

// Run the setup function
setupDatabase().then(success => {
  if (success) {
    console.log("🚀 Database is ready for use");
  } else {
    console.error("⚠️ Database setup failed");
  }
}).catch(err => {
  console.error("❌ Unhandled error in database setup:", err);
});