#!/usr/bin/env node

/**
 * This script directly tests the Axe accessibility audit functionality
 * It helps diagnose issues with Puppeteer and Chromium configuration
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const TEST_URL = 'https://pikasim.com';
const VERBOSE = true;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌ ERROR' : type === 'success' ? '✅ SUCCESS' : 'ℹ️ INFO';
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

function logVerbose(message) {
  if (VERBOSE) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 VERBOSE: ${message}`);
  }
}

// Step 1: Check environment
log('Step 1: Checking environment...');
logVerbose(`Node version: ${process.version}`);
logVerbose(`Platform: ${os.platform()}`);
logVerbose(`Architecture: ${os.arch()}`);
logVerbose(`Current directory: ${process.cwd()}`);

// Check for required environment variables
const envVars = {
  NODE_ENV: process.env.NODE_ENV || 'Not set',
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set',
  CHROME_PATH: process.env.CHROME_PATH || 'Not set',
  USE_MOCK_RESULTS: process.env.USE_MOCK_RESULTS || 'Not set'
};

Object.entries(envVars).forEach(([key, value]) => {
  logVerbose(`${key}: ${value}`);
});

// Step 2: Check if required packages are installed
log('Step 2: Checking required packages...');
const requiredPackages = ['puppeteer', '@axe-core/puppeteer'];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    log(`Package ${pkg} is installed`, 'success');
  } catch (e) {
    log(`Package ${pkg} is not installed. Installing...`, 'error');
    try {
      execSync(`npm install ${pkg}`, { stdio: 'inherit' });
      log(`Package ${pkg} installed successfully`, 'success');
    } catch (installError) {
      log(`Failed to install ${pkg}: ${installError.message}`, 'error');
      process.exit(1);
    }
  }
}

// Step 3: Try to find Chromium
log('Step 3: Locating Chromium...');
let chromiumPath;

// Try environment variables first
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const exists = fs.existsSync(chromiumPath);
  log(`Chromium from PUPPETEER_EXECUTABLE_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`, exists ? 'success' : 'error');
  if (!exists) chromiumPath = null;
} else if (process.env.CHROME_PATH) {
  chromiumPath = process.env.CHROME_PATH;
  const exists = fs.existsSync(chromiumPath);
  log(`Chromium from CHROME_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`, exists ? 'success' : 'error');
  if (!exists) chromiumPath = null;
}

// If not found in environment variables, try to find using which command
if (!chromiumPath) {
  try {
    if (os.platform() === 'darwin') {
      // macOS
      chromiumPath = execSync('which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo ""').toString().trim();
    } else if (os.platform() === 'linux') {
      // Linux
      chromiumPath = execSync('which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo ""').toString().trim();
    } else if (os.platform() === 'win32') {
      // Windows - more complex, would need to search in Program Files
      log('Windows platform detected, searching for Chrome/Chromium...', 'info');
      // This is simplified - would need more robust detection for Windows
    }
    
    if (chromiumPath) {
      log(`Found Chromium using which command: ${chromiumPath}`, 'success');
    } else {
      log('Could not find Chromium using which command', 'error');
    }
  } catch (error) {
    log(`Error finding Chromium: ${error.message}`, 'error');
  }
}

// If still not found, try to get Puppeteer's bundled Chromium
if (!chromiumPath) {
  try {
    const puppeteer = require('puppeteer');
    chromiumPath = puppeteer.executablePath();
    const exists = fs.existsSync(chromiumPath);
    log(`Puppeteer bundled Chromium: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`, exists ? 'success' : 'error');
    if (!exists) chromiumPath = null;
  } catch (error) {
    log(`Error getting Puppeteer bundled Chromium: ${error.message}`, 'error');
  }
}

// Step 4: Run Axe audit
log(`Step 4: Running Axe audit for ${TEST_URL}...`);

async function runAxeAudit() {
  try {
    // Dynamically import puppeteer and axe-puppeteer
    const puppeteer = require('puppeteer');
    const { AxePuppeteer } = require('@axe-core/puppeteer');
    
    log('Launching browser...');
    
    // Configure browser launch options
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    };
    
    // Use the found Chromium path if available
    if (chromiumPath) {
      launchOptions.executablePath = chromiumPath;
      log(`Using Chromium at: ${chromiumPath}`);
    } else {
      log('Using default Puppeteer browser');
    }
    
    // Launch the browser
    const browser = await puppeteer.launch(launchOptions);
    log('Browser launched successfully', 'success');
    
    // Create a new page
    const page = await browser.newPage();
    log(`Navigating to ${TEST_URL}...`);
    
    // Navigate to the test URL
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    log('Page loaded successfully', 'success');
    
    // Run Axe audit
    log('Running Axe audit...');
    const results = await new AxePuppeteer(page).analyze();
    
    // Close the browser
    await browser.close();
    
    // Output results
    log('Axe audit completed successfully', 'success');
    log(`Violations found: ${results.violations.length}`);
    log(`Passes: ${results.passes.length}`);
    log(`Incomplete: ${results.incomplete.length}`);
    log(`Inapplicable: ${results.inapplicable.length}`);
    
    // Save results to file
    const outputPath = path.join(os.tmpdir(), `axe-results-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    log(`Results saved to ${outputPath}`, 'success');
    
    return { success: true, results };
  } catch (error) {
    log(`Axe audit failed: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    return { success: false, error };
  }
}

// Run the Axe audit
runAxeAudit()
  .then(result => {
    if (result.success) {
      log('Axe audit test completed successfully!', 'success');
      process.exit(0);
    } else {
      log('Axe audit test failed. See error details above.', 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
