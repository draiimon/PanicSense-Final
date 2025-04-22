#!/usr/bin/env node

/**
 * Setup script for PanicSense
 * Helps with local setup and environment configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n\n🔥 PanicSense Setup Tool 🔥\n');
console.log('This tool will help you set up your PanicSense environment.\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envFileExists = fs.existsSync(envPath);

let envData = {};

if (envFileExists) {
  console.log('Found existing .env file.');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Parse existing env file
  envContent.split('\n').forEach(line => {
    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      envData[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// Start the setup questions
async function setupQuestions() {
  console.log('\n📊 Database Configuration');
  
  if (!envData.DATABASE_URL) {
    await new Promise(resolve => {
      rl.question('Enter your PostgreSQL connection string (DATABASE_URL): ', (answer) => {
        envData.DATABASE_URL = answer.trim();
        resolve();
      });
    });
  } else {
    console.log(`Your current DATABASE_URL: ${envData.DATABASE_URL.substring(0, 15)}...`);
    
    await new Promise(resolve => {
      rl.question('Do you want to update your DATABASE_URL? (y/N): ', (answer) => {
        if (answer.trim().toLowerCase() === 'y') {
          rl.question('Enter your new PostgreSQL connection string: ', (dbUrl) => {
            envData.DATABASE_URL = dbUrl.trim();
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
  
  console.log('\n🔑 API Keys Configuration');
  
  if (!envData.GROQ_API_KEY) {
    await new Promise(resolve => {
      rl.question('Enter your Groq API key (GROQ_API_KEY): ', (answer) => {
        envData.GROQ_API_KEY = answer.trim();
        resolve();
      });
    });
  } else {
    console.log(`Your current GROQ_API_KEY: ${envData.GROQ_API_KEY.substring(0, 5)}...`);
    
    await new Promise(resolve => {
      rl.question('Do you want to update your GROQ_API_KEY? (y/N): ', (answer) => {
        if (answer.trim().toLowerCase() === 'y') {
          rl.question('Enter your new Groq API key: ', (apiKey) => {
            envData.GROQ_API_KEY = apiKey.trim();
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
  
  // Write the .env file
  let envContent = '';
  for (const [key, value] of Object.entries(envData)) {
    envContent += `${key}="${value}"\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file has been created/updated.');
  
  // Ask about dependencies installation
  await new Promise(resolve => {
    rl.question('\nDo you want to install Node.js dependencies? (Y/n): ', (answer) => {
      if (answer.trim().toLowerCase() !== 'n') {
        console.log('📦 Installing Node.js dependencies...');
        exec('npm install', (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error installing dependencies: ${error.message}`);
          } else {
            console.log('✅ Node.js dependencies installed successfully.');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
  
  // Ask about Python dependencies
  await new Promise(resolve => {
    rl.question('\nDo you want to install Python dependencies? (Y/n): ', (answer) => {
      if (answer.trim().toLowerCase() !== 'n') {
        console.log('📦 Installing Python dependencies...');
        exec('pip install pandas numpy langdetect requests', (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error installing Python dependencies: ${error.message}`);
          } else {
            console.log('✅ Python dependencies installed successfully.');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
  
  // Ask about database setup
  await new Promise(resolve => {
    rl.question('\nDo you want to initialize the database (npm run db:push)? (Y/n): ', (answer) => {
      if (answer.trim().toLowerCase() !== 'n') {
        console.log('🗄️ Initializing database...');
        exec('npm run db:push', (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error initializing database: ${error.message}`);
          } else {
            console.log('✅ Database initialized successfully.');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
  
  console.log('\n🚀 PanicSense Setup Complete!');
  console.log('\nYou can now run the application with:');
  console.log('  npm run dev');
  
  rl.close();
}

setupQuestions().catch(console.error);