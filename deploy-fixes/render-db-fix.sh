#!/bin/bash
# Database fix script specifically for Render deployment

echo "Running Render-specific database fixes..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Database fixes cannot be applied."
  exit 1
fi

# Create a temporary Node.js script to fix database issues
cat > render-db-fix.js << 'EOF'
// Simple script to fix database issues specific to Render
import pg from 'pg';
const { Pool } = pg;

async function fixRenderDatabaseIssues() {
  try {
    console.log('Starting Render-specific database fixes...');
    
    // Create database connection using DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Run fixes - modify these queries based on your specific database issues
    console.log('Checking and fixing table structures...');
    
    // Fix timestamp columns - add if missing
    await pool.query(`
      ALTER TABLE IF EXISTS sentiment_posts 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    await pool.query(`
      ALTER TABLE IF EXISTS analyzed_files 
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    await pool.query(`
      ALTER TABLE IF EXISTS disaster_events 
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    // Fix foreign key constraints if needed
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'sentiment_posts'
        ) AND EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'analyzed_files'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'sentiment_posts_file_id_fkey'
          ) THEN
            -- Add foreign key if it doesn't exist
            BEGIN
              ALTER TABLE sentiment_posts
              ADD CONSTRAINT sentiment_posts_file_id_fkey
              FOREIGN KEY (file_id) REFERENCES analyzed_files(id) ON DELETE CASCADE;
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Error adding foreign key: %', SQLERRM;
            END;
          END IF;
        END IF;
      END $$;
    `);
    
    console.log('Render database fixes completed successfully!');
    await pool.end();
    
  } catch (error) {
    console.error('Error during Render database fixes:', error);
    process.exit(1);
  }
}

fixRenderDatabaseIssues();
EOF

# Run the temporary script
echo "Executing database fix script..."
node --experimental-modules render-db-fix.js

# Clean up temporary file
rm render-db-fix.js

echo "Render database fix script completed."