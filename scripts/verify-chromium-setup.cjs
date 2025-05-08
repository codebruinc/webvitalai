#!/usr/bin/env node

/**
 * This script verifies that the Chromium setup is working correctly
 * It checks for the presence of required files and environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Verifying Chromium setup...');

// Check for environment variables
console.log('\nChecking environment variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set'}`);
console.log(`CHROME_PATH: ${process.env.CHROME_PATH || 'Not set'}`);
console.log(`USE_MOCK_RESULTS: ${process.env.USE_MOCK_RESULTS || 'Not set'}`);

// Check for required files
console.log('\nChecking for required files:');
const requiredFiles = [
  '.puppeteerrc.cjs',
  'scripts/set-chromium-path.cjs',
  'scripts/install-puppeteer-deps.cjs',
  'scripts/run-lighthouse.cjs',
  'scripts/lighthouse-wrapper.cjs'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.resolve(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`${file}: ${exists ? 'Found' : 'Missing'}`);
  if (!exists) {
    allFilesExist = false;
  }
}

// Check for Puppeteer and related packages
console.log('\nChecking for required packages:');
const requiredPackages = [
  'puppeteer',
  '@axe-core/puppeteer',
  'lighthouse',
  'chrome-launcher'
];

let allPackagesInstalled = true;
for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    console.log(`${pkg}: Installed`);
  } catch (e) {
    console.log(`${pkg}: Not installed`);
    allPackagesInstalled = false;
  }
}

// Try to detect Chromium
console.log('\nAttempting to detect Chromium:');
let chromiumDetected = false;
let chromiumPath;

// Try environment variables first
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const exists = fs.existsSync(chromiumPath);
  console.log(`Chromium from PUPPETEER_EXECUTABLE_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`);
  chromiumDetected = exists;
} else if (process.env.CHROME_PATH) {
  chromiumPath = process.env.CHROME_PATH;
  const exists = fs.existsSync(chromiumPath);
  console.log(`Chromium from CHROME_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`);
  chromiumDetected = exists;
} else {
  // Try to find Chromium using the 'which' command
  try {
    chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null || echo ""').toString().trim();
    if (chromiumPath) {
      console.log(`Chromium detected at: ${chromiumPath}`);
      chromiumDetected = true;
    } else {
      console.log('Chromium not found in PATH');
    }
  } catch (error) {
    console.log('Error detecting Chromium:', error.message);
  }
}

// Try to get Puppeteer's bundled Chromium path
try {
  const puppeteer = require('puppeteer');
  const executablePath = puppeteer.executablePath();
  console.log(`Puppeteer bundled Chromium: ${fs.existsSync(executablePath) ? 'Found' : 'Not found'} at ${executablePath}`);
  if (fs.existsSync(executablePath)) {
    chromiumDetected = true;
  }
} catch (error) {
  console.log('Error getting Puppeteer bundled Chromium:', error.message);
}

// Summary
console.log('\nSummary:');
console.log(`Required files: ${allFilesExist ? 'All present' : 'Some missing'}`);
console.log(`Required packages: ${allPackagesInstalled ? 'All installed' : 'Some missing'}`);
console.log(`Chromium detection: ${chromiumDetected ? 'Detected' : 'Not detected'}`);

if (allFilesExist && allPackagesInstalled && chromiumDetected) {
  console.log('\n✅ Chromium setup appears to be working correctly!');
  process.exit(0);
} else {
  console.log('\n❌ Chromium setup has issues that need to be addressed.');
  
  // Provide recommendations
  console.log('\nRecommendations:');
  if (!allFilesExist) {
    console.log('- Run the conversion scripts to create missing .cjs files');
  }
  if (!allPackagesInstalled) {
    console.log('- Run "npm install puppeteer @axe-core/puppeteer lighthouse chrome-launcher"');
  }
  if (!chromiumDetected) {
    console.log('- Run "node scripts/set-chromium-path.cjs" to set up Chromium path');
    console.log('- Run "node scripts/install-puppeteer-deps.cjs" to install Puppeteer dependencies');
  }
  
  process.exit(1);
}