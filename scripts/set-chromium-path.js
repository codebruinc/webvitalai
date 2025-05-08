#!/usr/bin/env node

/**
 * This script sets the CHROME_PATH environment variable to the correct path
 * for Chromium on this system. This is used by lighthouse and other tools.
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Try to find Chromium using the 'which' command
let chromiumPath;
try {
  chromiumPath = execSync('which chromium').toString().trim();
  console.log(`Found Chromium at: ${chromiumPath}`);
} catch (error) {
  console.error('Could not find Chromium using "which chromium"');
  
  // Try some common paths
  const commonPaths = [
    '/opt/homebrew/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];
  
  for (const path of commonPaths) {
    try {
      if (fs.existsSync(path)) {
        chromiumPath = path;
        console.log(`Found Chromium at common path: ${chromiumPath}`);
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }
}

if (!chromiumPath) {
  console.error('Could not find Chromium. Please install it or specify the path manually.');
  process.exit(1);
}

// Set the environment variable
process.env.CHROME_PATH = chromiumPath;
console.log(`Set CHROME_PATH environment variable to: ${chromiumPath}`);

// If .env.local exists, update it
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if CHROME_PATH is already set
  if (envContent.includes('CHROME_PATH=')) {
    // Update existing value
    envContent = envContent.replace(/CHROME_PATH=.*(\r?\n|$)/g, `CHROME_PATH=${chromiumPath}$1`);
  } else {
    // Add new value
    envContent += `\nCHROME_PATH=${chromiumPath}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ${envPath} with CHROME_PATH=${chromiumPath}`);
} else {
  console.log(`${envPath} does not exist. Not updating environment file.`);
}

console.log('Done!');