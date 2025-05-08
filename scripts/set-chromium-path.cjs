#!/usr/bin/env node

/**
 * This script sets the PUPPETEER_EXECUTABLE_PATH environment variable to the correct path
 * for Chromium on this system. This is used by Puppeteer for Axe and Lighthouse audits.
 * 
 * In production environments, it will set up fallback mechanisms if Chromium is not found.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);

// Try to find Chromium using the 'which' command
let chromiumPath;
try {
  // Try different commands based on platform
  if (os.platform() === 'darwin') {
    // macOS
    chromiumPath = execSync('which chromium').toString().trim();
  } else if (os.platform() === 'linux') {
    // Linux - try chromium-browser first, then chromium
    try {
      chromiumPath = execSync('which chromium-browser').toString().trim();
    } catch (e) {
      chromiumPath = execSync('which chromium').toString().trim();
    }
  } else if (os.platform() === 'win32') {
    // Windows - more complex, would need to search in Program Files
    console.log('Windows platform detected, searching for Chrome/Chromium...');
    // This is simplified - would need more robust detection for Windows
  }
  
  if (chromiumPath) {
    console.log(`Found Chromium at: ${chromiumPath}`);
  }
} catch (error) {
  console.error('Could not find Chromium using "which" command');
  
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

// If we're in production and still haven't found Chromium, set up fallback
if (isProduction && !chromiumPath) {
  console.log('Production environment detected but Chromium not found.');
  console.log('Setting up fallback mechanism for Puppeteer...');
  
  // Set environment variables to use Puppeteer's bundled Chromium
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  
  console.log('Configured Puppeteer to use its bundled Chromium');
  
  // Exit successfully - we'll rely on Puppeteer's bundled Chromium
  process.exit(0);
}

if (!chromiumPath) {
  console.error('Could not find Chromium. Please install it or specify the path manually.');
  if (!isProduction) {
    // Only exit with error in non-production environments
    process.exit(1);
  }
}

// Set the environment variable
if (chromiumPath) {
  process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
  console.log(`Set PUPPETEER_EXECUTABLE_PATH environment variable to: ${chromiumPath}`);
}

// If .env.local exists, update it
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if PUPPETEER_EXECUTABLE_PATH is already set
  if (envContent.includes('PUPPETEER_EXECUTABLE_PATH=')) {
    // Update existing value
    if (chromiumPath) {
      envContent = envContent.replace(/PUPPETEER_EXECUTABLE_PATH=.*(\r?\n|$)/g, `PUPPETEER_EXECUTABLE_PATH=${chromiumPath}$1`);
    } else if (isProduction) {
      // In production, if no path found, remove the variable to use bundled Chromium
      envContent = envContent.replace(/PUPPETEER_EXECUTABLE_PATH=.*(\r?\n|$)/g, '');
    }
  } else if (chromiumPath) {
    // Add new value if we found a path
    envContent += `\nPUPPETEER_EXECUTABLE_PATH=${chromiumPath}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ${envPath}`);
} else {
  console.log(`${envPath} does not exist. Not updating environment file.`);
}

console.log('Done!');