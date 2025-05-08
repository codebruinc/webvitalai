#!/usr/bin/env node

/**
 * This script sets up environment variables to bypass RLS for the service role
 * and configures the application to use the service role for scan operations.
 */

const fs = require('fs');
const path = require('path');

console.log('Setting up RLS bypass for service role...');

// Path to .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');

// Read the current .env.local file
let envContent = '';
try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Found existing .env.local file');
  } else {
    console.log('No .env.local file found, creating a new one');
  }
} catch (error) {
  console.error('Error reading .env.local file:', error);
  process.exit(1);
}

// Environment variables to set
const envVars = {
  'NODE_ENV': 'production',
  'TESTING_MODE': 'false',
  'BYPASS_RLS': 'true',
  'USE_SERVICE_ROLE': 'true',
  'SUPABASE_USE_SERVICE_ROLE': 'true'
};

// Update or add each environment variable
for (const [key, value] of Object.entries(envVars)) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (envContent.match(regex)) {
    // Update existing variable
    envContent = envContent.replace(regex, `${key}=${value}`);
    console.log(`Updated ${key}=${value}`);
  } else {
    // Add new variable
    envContent += `\n${key}=${value}`;
    console.log(`Added ${key}=${value}`);
  }
}

// Write the updated content back to .env.local
try {
  fs.writeFileSync(envPath, envContent);
  console.log('Successfully updated .env.local file');
} catch (error) {
  console.error('Error writing to .env.local file:', error);
  process.exit(1);
}

console.log('\nRLS bypass configuration complete!');
console.log('\nNext steps:');
console.log('1. Rebuild the application: npm run build');
console.log('2. Restart the application: npm run start');
console.log('3. Test creating a new scan');
console.log('\nThis configuration will make the application use the service role');
console.log('for all database operations, which bypasses RLS policies.');