#!/usr/bin/env node

/**
 * This script directly tests the Lighthouse audit functionality
 * It helps diagnose issues with Chrome/Chromium configuration
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
const requiredPackages = ['lighthouse', 'chrome-launcher'];

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

// Step 3: Try to find Chrome/Chromium
log('Step 3: Locating Chrome/Chromium...');
let chromiumPath;

// Try environment variables first
if (process.env.CHROME_PATH) {
  chromiumPath = process.env.CHROME_PATH;
  const exists = fs.existsSync(chromiumPath);
  log(`Chrome from CHROME_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`, exists ? 'success' : 'error');
  if (!exists) chromiumPath = null;
} else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const exists = fs.existsSync(chromiumPath);
  log(`Chrome from PUPPETEER_EXECUTABLE_PATH: ${exists ? 'Found' : 'Not found'} at ${chromiumPath}`, exists ? 'success' : 'error');
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
      log(`Found Chrome/Chromium using which command: ${chromiumPath}`, 'success');
    } else {
      log('Could not find Chrome/Chromium using which command', 'error');
    }
  } catch (error) {
    log(`Error finding Chrome/Chromium: ${error.message}`, 'error');
  }
}

// Step 4: Run Lighthouse audit
log(`Step 4: Running Lighthouse audit for ${TEST_URL}...`);

async function runLighthouseAudit() {
  try {
    // Dynamically import lighthouse and chrome-launcher
    log('Importing lighthouse...');
    let lighthouse;
    try {
      // Try to import lighthouse as a module with named exports
      const lighthouseModule = require('lighthouse');
      
      // Check if it's a function or an object with a default export
      if (typeof lighthouseModule === 'function') {
        lighthouse = lighthouseModule;
      } else if (lighthouseModule && typeof lighthouseModule.default === 'function') {
        lighthouse = lighthouseModule.default;
      } else if (lighthouseModule && typeof lighthouseModule.lighthouse === 'function') {
        lighthouse = lighthouseModule.lighthouse;
      } else {
        log('Lighthouse module structure: ' + Object.keys(lighthouseModule).join(', '), 'info');
        throw new Error('Could not find lighthouse function in the imported module');
      }
    } catch (importError) {
      log(`Error importing lighthouse: ${importError.message}`, 'error');
      
      // Try alternative import approaches
      try {
        // Try dynamic import as a fallback
        const path = require('path');
        const lighthousePath = require.resolve('lighthouse');
        log(`Resolved lighthouse path: ${lighthousePath}`, 'info');
        
        // Try to load as a direct module
        const lighthouseModule = require(lighthousePath);
        
        if (typeof lighthouseModule === 'function') {
          lighthouse = lighthouseModule;
        } else if (lighthouseModule && typeof lighthouseModule.default === 'function') {
          lighthouse = lighthouseModule.default;
        } else if (lighthouseModule && typeof lighthouseModule.lighthouse === 'function') {
          lighthouse = lighthouseModule.lighthouse;
        } else {
          throw new Error('Could not find lighthouse function in the resolved module');
        }
      } catch (resolveError) {
        log(`Failed to resolve lighthouse module: ${resolveError.message}`, 'error');
        throw new Error('Could not load lighthouse module');
      }
    }
    log('Lighthouse imported successfully', 'success');
    
    log('Importing chrome-launcher...');
    const chromeLauncher = require('chrome-launcher');
    log('Chrome-launcher imported successfully', 'success');
    
    // Configure Chrome launch options
    const chromeFlags = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer'
    ];
    
    const launchOptions = { chromeFlags };
    
    // Use the found Chrome/Chromium path if available
    if (chromiumPath) {
      launchOptions.chromePath = chromiumPath;
      log(`Using Chrome/Chromium at: ${chromiumPath}`);
    } else {
      log('Using auto-detected Chrome');
    }
    
    // Launch Chrome
    log('Launching Chrome...');
    const chrome = await chromeLauncher.launch(launchOptions);
    log(`Chrome launched successfully on port ${chrome.port}`, 'success');
    
    // Run Lighthouse
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
    
    log(`Running Lighthouse audit for ${TEST_URL}...`);
    
    // Check if lighthouse is a function before calling it
    if (typeof lighthouse !== 'function') {
      throw new Error(`Lighthouse is not a function. Type: ${typeof lighthouse}`);
    }
    
    const runnerResult = await lighthouse(TEST_URL, options);
    
    if (!runnerResult) {
      throw new Error('Lighthouse audit failed to return results');
    }
    
    // Close Chrome
    await chrome.kill();
    
    // Save results to file
    const outputPath = path.join(os.tmpdir(), `lighthouse-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(runnerResult.lhr, null, 2));
    
    // Output results
    log('Lighthouse audit completed successfully', 'success');
    log(`Results saved to ${outputPath}`, 'success');
    
    // Extract key metrics
    const performanceScore = runnerResult.lhr.categories.performance.score * 100;
    const accessibilityScore = runnerResult.lhr.categories.accessibility.score * 100;
    const bestPracticesScore = runnerResult.lhr.categories['best-practices'].score * 100;
    const seoScore = runnerResult.lhr.categories.seo.score * 100;
    
    log(`Performance score: ${performanceScore.toFixed(1)}`, 'info');
    log(`Accessibility score: ${accessibilityScore.toFixed(1)}`, 'info');
    log(`Best practices score: ${bestPracticesScore.toFixed(1)}`, 'info');
    log(`SEO score: ${seoScore.toFixed(1)}`, 'info');
    
    // Extract Core Web Vitals
    const fcp = runnerResult.lhr.audits['first-contentful-paint'];
    const lcp = runnerResult.lhr.audits['largest-contentful-paint'];
    const cls = runnerResult.lhr.audits['cumulative-layout-shift'];
    const tbt = runnerResult.lhr.audits['total-blocking-time'];
    
    log('Core Web Vitals:', 'info');
    log(`First Contentful Paint: ${fcp.displayValue}`, 'info');
    log(`Largest Contentful Paint: ${lcp.displayValue}`, 'info');
    log(`Cumulative Layout Shift: ${cls.displayValue}`, 'info');
    log(`Total Blocking Time: ${tbt.displayValue}`, 'info');
    
    return { success: true, results: runnerResult.lhr };
  } catch (error) {
    log(`Lighthouse audit failed: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    return { success: false, error };
  }
}

// Alternative approach using the run-lighthouse.cjs script
async function runLighthouseScript() {
  try {
    log('Trying alternative approach using run-lighthouse.cjs script...');
    
    // Create a temporary file to store the Lighthouse results
    const outputPath = path.join(os.tmpdir(), `lighthouse-${Date.now()}.json`);
    
    // Run the Lighthouse script
    log(`Running Lighthouse script for ${TEST_URL}...`);
    execSync(`node "${path.resolve(__dirname, 'run-lighthouse.cjs')}" "${TEST_URL}" "${outputPath}"`, { stdio: 'inherit' });
    
    // Check if the output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Lighthouse results file not found');
    }
    
    // Read and parse the results
    const resultJson = fs.readFileSync(outputPath, 'utf8');
    const lhr = JSON.parse(resultJson);
    
    // Output results
    log('Lighthouse script completed successfully', 'success');
    
    // Extract key metrics
    const performanceScore = lhr.categories.performance.score * 100;
    const accessibilityScore = lhr.categories.accessibility.score * 100;
    const bestPracticesScore = lhr.categories['best-practices'].score * 100;
    const seoScore = lhr.categories.seo.score * 100;
    
    log(`Performance score: ${performanceScore.toFixed(1)}`, 'info');
    log(`Accessibility score: ${accessibilityScore.toFixed(1)}`, 'info');
    log(`Best practices score: ${bestPracticesScore.toFixed(1)}`, 'info');
    log(`SEO score: ${seoScore.toFixed(1)}`, 'info');
    
    return { success: true, results: lhr };
  } catch (error) {
    log(`Lighthouse script failed: ${error.message}`, 'error');
    return { success: false, error };
  }
}

// Run the Lighthouse audit
runLighthouseAudit()
  .then(result => {
    if (result.success) {
      log('Lighthouse audit test completed successfully!', 'success');
      process.exit(0);
    } else {
      log('Lighthouse audit failed, trying alternative approach...', 'error');
      return runLighthouseScript();
    }
  })
  .then(result => {
    if (result && result.success) {
      log('Lighthouse script test completed successfully!', 'success');
      process.exit(0);
    } else {
      log('All Lighthouse audit attempts failed. See error details above.', 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
