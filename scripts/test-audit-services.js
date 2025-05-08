#!/usr/bin/env node

/**
 * This script tests the Lighthouse and Axe services to ensure they work correctly
 * with the current configuration. It's useful for verifying deployment configurations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// Log environment information
console.log('=== Environment Information ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Operating system: ${process.platform} ${process.arch}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`CHROME_PATH: ${process.env.CHROME_PATH || 'Not set'}`);
console.log(`PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set'}`);
console.log(`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: ${process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'Not set'}`);
console.log(`PUPPETEER_CACHE_DIR: ${process.env.PUPPETEER_CACHE_DIR || 'Not set'}`);
console.log('===============================\n');

// Check if Chromium is installed
console.log('=== Checking Chromium Installation ===');
const chromePaths = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/opt/chromium/chrome',
  '/opt/google/chrome/chrome'
];

let chromiumFound = false;
for (const chromePath of chromePaths) {
  if (!chromePath) continue;
  
  try {
    if (fs.existsSync(chromePath)) {
      console.log(`Chromium found at: ${chromePath}`);
      chromiumFound = true;
      
      // Try to get the version
      try {
        const version = execSync(`${chromePath} --version`, { stdio: 'pipe' }).toString().trim();
        console.log(`Chromium version: ${version}`);
      } catch (error) {
        console.log(`Could not get Chromium version: ${error.message}`);
      }
      
      break;
    }
  } catch (error) {
    console.log(`Error checking path ${chromePath}: ${error.message}`);
  }
}

if (!chromiumFound) {
  console.log('Chromium not found in any of the expected locations');
}
console.log('===============================\n');

// Test Lighthouse service
console.log('=== Testing Lighthouse Service ===');
try {
  // Create a test script that imports the Lighthouse service
  const testScript = `
    const { runLighthouseAudit } = require('../src/services/lighthouseService');
    
    async function testLighthouse() {
      try {
        console.log('Running Lighthouse audit on example.com...');
        const result = await runLighthouseAudit('https://example.com');
        console.log('Lighthouse audit completed successfully!');
        console.log('Performance score:', result.performance.score);
        console.log('Accessibility score:', result.accessibility.score);
        console.log('SEO score:', result.seo.score);
        console.log('Best Practices score:', result.bestPractices.score);
        return true;
      } catch (error) {
        console.error('Lighthouse audit failed:', error);
        return false;
      }
    }
    
    testLighthouse().then(success => {
      process.exit(success ? 0 : 1);
    });
  `;
  
  const testScriptPath = path.join(rootDir, 'scripts', 'temp-lighthouse-test.js');
  fs.writeFileSync(testScriptPath, testScript);
  
  // Run the test script
  console.log('Executing Lighthouse test...');
  execSync(`node ${testScriptPath}`, { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync(testScriptPath);
  console.log('Lighthouse test completed successfully!');
} catch (error) {
  console.error('Lighthouse test failed:', error.message);
}
console.log('===============================\n');

// Test Axe service
console.log('=== Testing Axe Service ===');
try {
  // Create a test script that imports the Axe service
  const testScript = `
    const { runAxeAudit } = require('../src/services/axeService');
    
    async function testAxe() {
      try {
        console.log('Running Axe audit on example.com...');
        const result = await runAxeAudit('https://example.com');
        console.log('Axe audit completed successfully!');
        console.log('Accessibility score:', result.score);
        console.log('Violations:', result.violations.length);
        console.log('Passes:', result.passes);
        return true;
      } catch (error) {
        console.error('Axe audit failed:', error);
        return false;
      }
    }
    
    testAxe().then(success => {
      process.exit(success ? 0 : 1);
    });
  `;
  
  const testScriptPath = path.join(rootDir, 'scripts', 'temp-axe-test.js');
  fs.writeFileSync(testScriptPath, testScript);
  
  // Run the test script
  console.log('Executing Axe test...');
  execSync(`node ${testScriptPath}`, { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync(testScriptPath);
  console.log('Axe test completed successfully!');
} catch (error) {
  console.error('Axe test failed:', error.message);
}
console.log('===============================\n');

console.log('All tests completed!');