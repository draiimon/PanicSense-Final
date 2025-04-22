/**
 * DATABASE VERIFICATION TOOL
 * Run this script to verify the database is properly set up
 * 
 * Usage: node verify-db.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function verifyDatabase() {
  console.log('🔍 VERIFYING DATABASE SETUP');
  
  let pool;
  let client;
  
  try {
    // Connect to database using DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("❌ No DATABASE_URL found in environment variables");
      return false;
    }
    
    console.log("🔄 Connecting to database...");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
    });

    client = await pool.connect();
    console.log(`✅ Successfully connected to PostgreSQL database`);
    
    // Check if tables exist and have required columns
    console.log("\n📋 CHECKING TABLES AND COLUMNS:");
    
    // Check disaster_events
    try {
      const disasterResult = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'disaster_events'");
      if (disasterResult.rows.length > 0) {
        console.log("✅ disaster_events table exists with columns:", disasterResult.rows.map(r => r.column_name).join(', '));
        
        // Check for created_at
        const hasCreatedAt = disasterResult.rows.some(r => r.column_name === 'created_at');
        if (hasCreatedAt) {
          console.log("   ✓ disaster_events.created_at column exists");
        } else {
          console.log("   ✗ disaster_events.created_at column MISSING");
          
          // Check for timestamp as alternative
          const hasTimestamp = disasterResult.rows.some(r => r.column_name === 'timestamp');
          if (hasTimestamp) {
            console.log("   ✓ disaster_events.timestamp column exists as alternative");
          } else {
            console.log("   ✗ disaster_events.timestamp column MISSING");
          }
        }
      } else {
        console.log("❌ disaster_events table MISSING");
      }
    } catch (error) {
      console.error("❌ Error checking disaster_events table:", error.message);
    }
    
    // Check sentiment_posts
    try {
      const sentimentResult = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sentiment_posts'");
      if (sentimentResult.rows.length > 0) {
        console.log("✅ sentiment_posts table exists with columns:", sentimentResult.rows.map(r => r.column_name).join(', '));
      } else {
        console.log("❌ sentiment_posts table MISSING");
      }
    } catch (error) {
      console.error("❌ Error checking sentiment_posts table:", error.message);
    }
    
    // Check analyzed_files
    try {
      const filesResult = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'analyzed_files'");
      if (filesResult.rows.length > 0) {
        console.log("✅ analyzed_files table exists with columns:", filesResult.rows.map(r => r.column_name).join(', '));
        
        // Check for created_at
        const hasCreatedAt = filesResult.rows.some(r => r.column_name === 'created_at');
        if (hasCreatedAt) {
          console.log("   ✓ analyzed_files.created_at column exists");
        } else {
          console.log("   ✗ analyzed_files.created_at column MISSING");
          
          // Check for timestamp as alternative
          const hasTimestamp = filesResult.rows.some(r => r.column_name === 'timestamp');
          if (hasTimestamp) {
            console.log("   ✓ analyzed_files.timestamp column exists as alternative");
          } else {
            console.log("   ✗ analyzed_files.timestamp column MISSING");
          }
        }
      } else {
        console.log("❌ analyzed_files table MISSING");
      }
    } catch (error) {
      console.error("❌ Error checking analyzed_files table:", error.message);
    }
    
    // Count records in each table
    console.log("\n📊 CHECKING TABLE DATA:");
    
    try {
      const disasterCount = await client.query("SELECT COUNT(*) FROM disaster_events");
      console.log(`✅ disaster_events has ${disasterCount.rows[0].count} records`);
    } catch (error) {
      console.error("❌ Error counting disaster_events:", error.message);
    }
    
    try {
      const sentimentCount = await client.query("SELECT COUNT(*) FROM sentiment_posts");
      console.log(`✅ sentiment_posts has ${sentimentCount.rows[0].count} records`);
    } catch (error) {
      console.error("❌ Error counting sentiment_posts:", error.message);
    }
    
    try {
      const filesCount = await client.query("SELECT COUNT(*) FROM analyzed_files");
      console.log(`✅ analyzed_files has ${filesCount.rows[0].count} records`);
    } catch (error) {
      console.error("❌ Error counting analyzed_files:", error.message);
    }
    
    console.log("\n✅ Database verification complete");
    return true;
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);
    return false;
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

// Run the verification
verifyDatabase().then(result => {
  console.log('\nVerification result:', result ? '✅ SUCCESS' : '❌ FAILURE');
  process.exit(result ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});