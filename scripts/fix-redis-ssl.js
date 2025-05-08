/**
 * Fix Redis SSL Connection Issues
 *
 * This script updates the .env.local file to fix Redis SSL connection issues
 * by properly configuring the Redis connection parameters.
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the .env.local file
const envFilePath = path.resolve(path.dirname(__dirname), '.env.local');

// Check if the file exists
if (!fs.existsSync(envFilePath)) {
  console.error(`Error: ${envFilePath} not found.`);
  process.exit(1);
}

// Read the current .env.local file
const envContent = fs.readFileSync(envFilePath, 'utf8');

// Parse the current environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') return;
  
  // Extract key and value
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim();
  }
});

// Check if we need to update Redis configuration
console.log('Checking Redis configuration...');

// Get Redis URL from environment or use default
const redisUrl = envVars.REDIS_URL || 'redis-19373.c277.us-east-1-3.ec2.redns.redis-cloud.com';
const redisPort = envVars.REDIS_PORT || '19373';
const redisUsername = envVars.REDIS_USERNAME || 'default';
const redisPassword = envVars.REDIS_PASSWORD || '';

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for confirmation before updating
rl.question(`
Current Redis configuration:
- REDIS_URL=${redisUrl}
- REDIS_PORT=${redisPort}
- REDIS_USERNAME=${redisUsername}
- REDIS_PASSWORD=${redisPassword ? '(set)' : '(not set)'}

Do you want to update this configuration? (y/n) `, async (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  
  // Ask for Redis URL
  const getRedisUrl = () => new Promise(resolve => {
    rl.question(`Enter Redis host (default: ${redisUrl}): `, (input) => {
      resolve(input || redisUrl);
    });
  });
  
  // Ask for Redis port
  const getRedisPort = () => new Promise(resolve => {
    rl.question(`Enter Redis port (default: ${redisPort}): `, (input) => {
      resolve(input || redisPort);
    });
  });
  
  // Ask for Redis username
  const getRedisUsername = () => new Promise(resolve => {
    rl.question(`Enter Redis username (default: ${redisUsername}): `, (input) => {
      resolve(input || redisUsername);
    });
  });
  
  // Ask for Redis password
  const getRedisPassword = () => new Promise(resolve => {
    rl.question(`Enter Redis password (leave empty to keep current): `, (input) => {
      resolve(input || redisPassword);
    });
  });
  
  // Get updated values
  const newRedisUrl = await getRedisUrl();
  const newRedisPort = await getRedisPort();
  const newRedisUsername = await getRedisUsername();
  const newRedisPassword = await getRedisPassword();
  
  // Update environment variables
  envVars.REDIS_URL = newRedisUrl;
  envVars.REDIS_PORT = newRedisPort;
  envVars.REDIS_USERNAME = newRedisUsername;
  
  // Only update password if provided
  if (newRedisPassword) {
    envVars.REDIS_PASSWORD = newRedisPassword;
  }
  
  // Ensure we have the retry settings
  if (!envVars.REDIS_MAX_RETRIES) {
    envVars.REDIS_MAX_RETRIES = '5';
  }
  
  if (!envVars.REDIS_RETRY_DELAY_MS) {
    envVars.REDIS_RETRY_DELAY_MS = '5000';
  }
  
  // Generate the new .env.local content
  let newEnvContent = '';
  let redisSection = false;
  let redisVarsAdded = false;
  
  // Process the original file line by line to preserve comments and structure
  envContent.split('\n').forEach(line => {
    // Check if we're entering the Redis section
    if (line.includes('# Redis') || line.includes('# Bull') || line.includes('REDIS_')) {
      redisSection = true;
    } 
    // Check if we're leaving the Redis section
    else if (redisSection && line.trim().startsWith('#') && !line.includes('Redis')) {
      redisSection = false;
      
      // If we haven't added Redis vars yet, add them before leaving the section
      if (!redisVarsAdded) {
        newEnvContent += '# Redis (for Bull queue) - Using non-TLS connection based on testing\n';
        newEnvContent += `REDIS_URL=${envVars.REDIS_URL}\n`;
        newEnvContent += `REDIS_PORT=${envVars.REDIS_PORT}\n`;
        newEnvContent += `REDIS_USERNAME=${envVars.REDIS_USERNAME}\n`;
        newEnvContent += `REDIS_PASSWORD=${envVars.REDIS_PASSWORD}\n`;
        newEnvContent += `REDIS_MAX_RETRIES=${envVars.REDIS_MAX_RETRIES}\n`;
        newEnvContent += `REDIS_RETRY_DELAY_MS=${envVars.REDIS_RETRY_DELAY_MS}\n\n`;
        redisVarsAdded = true;
      }
    }
    
    // Skip Redis-related lines as we'll add them in our own section
    if (redisSection && (line.includes('REDIS_URL=') || 
                         line.includes('REDIS_PORT=') || 
                         line.includes('REDIS_USERNAME=') || 
                         line.includes('REDIS_PASSWORD=') ||
                         line.includes('REDIS_MAX_RETRIES=') ||
                         line.includes('REDIS_RETRY_DELAY_MS='))) {
      return;
    }
    
    // Add the line to the new content
    newEnvContent += line + '\n';
  });
  
  // If we haven't added Redis vars yet (no Redis section found), add them at the end
  if (!redisVarsAdded) {
    newEnvContent += '\n# Redis (for Bull queue)\n';
    newEnvContent += `REDIS_URL=${envVars.REDIS_URL}\n`;
    newEnvContent += `REDIS_PORT=${envVars.REDIS_PORT}\n`;
    newEnvContent += `REDIS_USERNAME=${envVars.REDIS_USERNAME}\n`;
    newEnvContent += `REDIS_PASSWORD=${envVars.REDIS_PASSWORD}\n`;
    newEnvContent += `REDIS_MAX_RETRIES=${envVars.REDIS_MAX_RETRIES}\n`;
    newEnvContent += `REDIS_RETRY_DELAY_MS=${envVars.REDIS_RETRY_DELAY_MS}\n`;
  }
  
  // Create a backup of the original file
  const backupPath = `${envFilePath}.bak`;
  fs.writeFileSync(backupPath, envContent);
  console.log(`Backup created at ${backupPath}`);
  
  // Write the new content to the .env.local file
  fs.writeFileSync(envFilePath, newEnvContent);
  console.log(`Updated ${envFilePath} with new Redis configuration.`);
  
  console.log('\nRedis configuration updated successfully!');
  console.log('Please restart your application for the changes to take effect.');
  
  rl.close();
});