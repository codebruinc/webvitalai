#!/usr/bin/env node

/**
 * This script verifies that the Chromium/Puppeteer setup is working correctly.
 * It checks the environment, tests Chromium installation, and runs a simple
 * browser test to ensure everything is configured properly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Print a header
console.log(`\n${colors.bright}${colors.cyan}=== WebVital AI Chromium/Puppeteer Setup Verification ===${colors.reset}\n`);

// Check environment
console.log(`${colors.bright}Checking environment:${colors.reset}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Working directory: ${process.cwd()}`);

// Check environment variables
const envVars = [
  'CHROME_PATH',
  'PUPPETEER_EXECUTABLE_PATH',
  'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD',
  'PUPPETEER_SKIP_DOWNLOAD',
  'PUPPETEER_CACHE_DIR',
  'NODE_ENV',
  'RENDER'
];

console.log(`\n${colors.bright}Environment variables:${colors.reset}`);
envVars.forEach(varName => {
  const value = process.env[varName] || 'Not set';
  console.log(`${varName}: ${value}`);
});

// Check Chromium installation
console.log(`\n${colors.bright}Checking Chromium installation:${colors.reset}`);

// Possible Chromium paths
const chromePaths = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/opt/chromium/chrome',
  '/opt/google/chrome/chrome'
];

let chromiumFound = false;
let chromiumPath = null;

for (const chromePath of chromePaths) {
  if (!chromePath) continue;
  
  try {
    if (fs.existsSync(chromePath)) {
      chromiumPath = chromePath;
      chromiumFound = true;
      console.log(`${colors.green}✓ Chromium found at: ${chromePath}${colors.reset}`);
      
      // Try to get the version
      try {
        const version = execSync(`${chromePath} --version`, { stdio: 'pipe' }).toString().trim();
        console.log(`${colors.green}✓ Chromium version: ${version}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.yellow}⚠ Could not get Chromium version: ${error.message}${colors.reset}`);
      }
      
      break;
    }
  } catch (error) {
    console.log(`Error checking path ${chromePath}: ${error.message}`);
  }
}

if (!chromiumFound) {
  console.log(`${colors.red}✗ Chromium not found in any of the expected locations${colors.reset}`);
}

// Check Puppeteer installation
console.log(`\n${colors.bright}Checking Puppeteer installation:${colors.reset}`);
try {
  const puppeteerPath = require.resolve('puppeteer');
  console.log(`${colors.green}✓ Puppeteer found at: ${puppeteerPath}${colors.reset}`);
  
  // Get Puppeteer version
  const puppeteer = require('puppeteer');
  console.log(`${colors.green}✓ Puppeteer version: ${puppeteer.version()}${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Puppeteer not found: ${error.message}${colors.reset}`);
}

// Check Lighthouse installation
console.log(`\n${colors.bright}Checking Lighthouse installation:${colors.reset}`);
try {
  const lighthousePath = require.resolve('lighthouse');
  console.log(`${colors.green}✓ Lighthouse found at: ${lighthousePath}${colors.reset}`);
  
  // Try to get Lighthouse version
  try {
    const lighthouseVersion = execSync('npx lighthouse --version', { stdio: 'pipe' }).toString().trim();
    console.log(`${colors.green}✓ Lighthouse version: ${lighthouseVersion}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ Could not get Lighthouse version: ${error.message}${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}✗ Lighthouse not found: ${error.message}${colors.reset}`);
}

// Check Axe Core installation
console.log(`\n${colors.bright}Checking Axe Core installation:${colors.reset}`);
try {
  const axePath = require.resolve('@axe-core/puppeteer');
  console.log(`${colors.green}✓ Axe Core found at: ${axePath}${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Axe Core not found: ${error.message}${colors.reset}`);
}

// Test browser launch
console.log(`\n${colors.bright}Testing browser launch:${colors.reset}`);
const testBrowserLaunch = async () => {
  try {
    const puppeteer = require('puppeteer');
    
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: chromiumPath
    });
    
    console.log('Opening a new page...');
    const page = await browser.newPage();
    
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    
    console.log('Getting page title...');
    const title = await page.title();
    
    console.log('Closing browser...');
    await browser.close();
    
    console.log(`${colors.green}✓ Browser test successful! Page title: ${title}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Browser test failed: ${error.message}${colors.reset}`);
    return false;
  }
};

// Test service files
console.log(`\n${colors.bright}Checking service files:${colors.reset}`);
const serviceFiles = [
  'src/services/axeService.ts',
  'src/services/lighthouseService.ts',
  'scripts/run-lighthouse.js',
  'scripts/lighthouse-wrapper.cjs',
  'scripts/lighthouse-wrapper.js',
  '.puppeteerrc.cjs'
];

serviceFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ ${filePath} exists${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${filePath} not found${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error checking ${filePath}: ${error.message}${colors.reset}`);
  }
});

// Run the browser test
testBrowserLaunch().then(success => {
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  
  if (chromiumFound) {
    console.log(`${colors.green}✓ Chromium found at: ${chromiumPath}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Chromium not found${colors.reset}`);
  }
  
  if (success) {
    console.log(`${colors.green}✓ Browser launch test successful${colors.reset}`);
    console.log(`\n${colors.bright}${colors.green}Chromium/Puppeteer setup verification completed successfully!${colors.reset}`);
    console.log(`You can now run the full audit test with: npm run test:audit\n`);
  } else {
    console.log(`${colors.red}✗ Browser launch test failed${colors.reset}`);
    console.log(`\n${colors.bright}${colors.yellow}Chromium/Puppeteer setup verification completed with issues.${colors.reset}`);
    console.log(`Please check the documentation at docs/deployment/render-deployment.md for troubleshooting.\n`);
  }
});