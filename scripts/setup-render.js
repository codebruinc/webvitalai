#!/usr/bin/env node

/**
 * This script sets up the environment for running on Render.com
 * It ensures Chromium is properly configured and available for Lighthouse and Axe audits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up environment for Render.com...');

// Check if we're running on Render
const isRender = process.env.RENDER === 'true';
if (isRender) {
  console.log('Detected Render environment');
} else {
  console.log('Not running on Render, but continuing setup anyway');
}

// Verify Chromium installation
let chromiumPath = '/usr/bin/chromium-browser';
try {
  if (fs.existsSync(chromiumPath)) {
    console.log(`Chromium found at ${chromiumPath}`);
  } else {
    console.log(`Chromium not found at ${chromiumPath}, checking alternatives...`);
    
    // Try alternative paths
    const alternatives = [
      '/usr/bin/chromium',
      '/opt/chromium/chrome',
      '/opt/google/chrome/chrome'
    ];
    
    for (const alt of alternatives) {
      if (fs.existsSync(alt)) {
        chromiumPath = alt;
        console.log(`Chromium found at alternative path: ${chromiumPath}`);
        break;
      }
    }
  }
} catch (error) {
  console.error('Error checking Chromium installation:', error);
}

// Set environment variables
process.env.CHROME_PATH = chromiumPath;
process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
console.log(`Set CHROME_PATH and PUPPETEER_EXECUTABLE_PATH to ${chromiumPath}`);

// Create Puppeteer cache directory if it doesn't exist
const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer-cache';
try {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`Created Puppeteer cache directory at ${cacheDir}`);
  }
  
  // Ensure the directory is writable
  fs.accessSync(cacheDir, fs.constants.W_OK);
  console.log(`Verified that ${cacheDir} is writable`);
} catch (error) {
  console.error(`Error setting up Puppeteer cache directory: ${error}`);
}

// Test Chromium
console.log('Testing Chromium installation...');
try {
  const result = execSync(`${chromiumPath} --version`, { stdio: 'pipe' }).toString();
  console.log(`Chromium version: ${result.trim()}`);
} catch (error) {
  console.error('Error testing Chromium:', error.message);
  console.log('This may cause issues with Lighthouse and Axe audits');
}

console.log('Render setup complete!');