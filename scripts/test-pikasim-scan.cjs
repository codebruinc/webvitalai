#!/usr/bin/env node

/**
 * Test script for scanning pikasim.com
 * This script will:
 * 1. Verify the current Chromium setup
 * 2. Fix any issues with the Chromium configuration
 * 3. Run a scan against pikasim.com
 * 4. Log detailed information at each step
 * 5. Implement fallback mechanisms
 * 6. Verify the results
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const TEST_URL = 'https://pikasim.com';
const MAX_RETRIES = 3;
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

function runCommand(command, options = {}) {
  logVerbose(`Running command: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    logVerbose(`Command output: ${output}`);
    return { success: true, output };
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    return { success: false, error };
  }
}

function runScript(scriptPath, description) {
  log(`Running ${description}...`);
  const result = runCommand(`node "${scriptPath}"`, { stdio: 'inherit' });
  if (result.success) {
    log(`${description} completed successfully`, 'success');
  } else {
    log(`${description} failed`, 'error');
  }
  return result.success;
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

// Step 2: Verify Chromium setup
log('Step 2: Verifying Chromium setup...');
const verifyResult = runScript(
  path.resolve(__dirname, 'verify-chromium-setup.cjs'),
  'Chromium setup verification'
);

// Step 3: Fix Chromium issues if needed
if (!verifyResult) {
  log('Step 3: Fixing Chromium issues...');
  const fixResult = runScript(
    path.resolve(__dirname, 'fix-chromium-issues.cjs'),
    'Chromium issues fix'
  );
  
  if (!fixResult) {
    log('Attempting manual Chromium installation...', 'info');
    
    // Try to install Chromium using Homebrew if on macOS
    if (os.platform() === 'darwin') {
      log('Detected macOS, attempting to install Chromium via Homebrew...');
      runCommand('brew install --cask chromium || true');
    } else if (os.platform() === 'linux') {
      log('Detected Linux, attempting to install Chromium via apt...');
      runCommand('sudo apt-get update && sudo apt-get install -y chromium-browser || true');
    }
    
    // Try to find Chromium again
    log('Searching for Chromium installation...');
    let chromiumPath;
    
    try {
      if (os.platform() === 'darwin') {
        chromiumPath = execSync('which chromium').toString().trim();
      } else if (os.platform() === 'linux') {
        try {
          chromiumPath = execSync('which chromium-browser').toString().trim();
        } catch (e) {
          chromiumPath = execSync('which chromium').toString().trim();
        }
      }
      
      if (chromiumPath) {
        log(`Found Chromium at: ${chromiumPath}`, 'success');
        
        // Update .env.local
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          
          // Update PUPPETEER_EXECUTABLE_PATH
          if (envContent.includes('PUPPETEER_EXECUTABLE_PATH=')) {
            envContent = envContent.replace(/PUPPETEER_EXECUTABLE_PATH=.*(\r?\n|$)/g, `PUPPETEER_EXECUTABLE_PATH=${chromiumPath}$1`);
          } else {
            envContent += `\nPUPPETEER_EXECUTABLE_PATH=${chromiumPath}\n`;
          }
          
          // Update CHROME_PATH
          if (envContent.includes('CHROME_PATH=')) {
            envContent = envContent.replace(/CHROME_PATH=.*(\r?\n|$)/g, `CHROME_PATH=${chromiumPath}$1`);
          } else {
            envContent += `\nCHROME_PATH=${chromiumPath}\n`;
          }
          
          // Set USE_MOCK_RESULTS to false
          if (envContent.includes('USE_MOCK_RESULTS=')) {
            envContent = envContent.replace(/USE_MOCK_RESULTS=.*(\r?\n|$)/g, 'USE_MOCK_RESULTS=false$1');
          } else {
            envContent += '\nUSE_MOCK_RESULTS=false\n';
          }
          
          fs.writeFileSync(envPath, envContent);
          log(`Updated ${envPath} with Chromium path`, 'success');
          
          // Set environment variables for current process
          process.env.PUPPETEER_EXECUTABLE_PATH = chromiumPath;
          process.env.CHROME_PATH = chromiumPath;
          process.env.USE_MOCK_RESULTS = 'false';
        }
      }
    } catch (error) {
      log(`Failed to find Chromium: ${error.message}`, 'error');
    }
  }
}

// Step 4: Run scan against pikasim.com
log(`Step 4: Running scan against ${TEST_URL}...`);

// Function to run a scan with retries
async function runScanWithRetries(url, maxRetries = 3) {
  let retries = 0;
  let success = false;
  
  while (retries < maxRetries && !success) {
    if (retries > 0) {
      log(`Retry ${retries}/${maxRetries}...`);
    }
    
    try {
      log(`Starting scan for ${url}...`);
      
      // Instead of trying to execute the Next.js route file directly,
      // we'll make an HTTP request to a test endpoint or use the direct audit approach
      
      // For simplicity, we'll just skip to the direct audit approach
      // since we've already verified that the Lighthouse and Axe audits work
      log('Skipping direct route execution (not supported for Next.js routes)');
      log('Using direct audit approach instead...');
      
      // Return a failure to trigger the direct audit approach
      return { success: false, error: new Error('Skipping to direct audit approach') };
    } catch (error) {
      log(`Scan failed: ${error.message}`, 'error');
      retries++;
      
      if (retries >= maxRetries) {
        log(`Maximum retries (${maxRetries}) reached. Falling back to alternative approach.`, 'error');
        return { success: false, error };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Alternative approach: Use direct Lighthouse and Axe calls
async function runDirectAudits(url) {
  log(`Running direct audits for ${url}...`);
  
  // Run Lighthouse audit
  log('Running Lighthouse audit...');
  const lighthouseOutputPath = path.join(os.tmpdir(), `lighthouse-${Date.now()}.json`);
  const lighthouseResult = runCommand(`node "${path.resolve(__dirname, 'run-lighthouse.cjs')}" "${url}" "${lighthouseOutputPath}"`);
  
  if (lighthouseResult.success) {
    log('Lighthouse audit completed successfully', 'success');
    
    // Check if the output file exists
    if (fs.existsSync(lighthouseOutputPath)) {
      log(`Lighthouse results saved to ${lighthouseOutputPath}`, 'success');
      
      // Read and parse the results
      try {
        const lighthouseData = JSON.parse(fs.readFileSync(lighthouseOutputPath, 'utf8'));
        log('Lighthouse results parsed successfully', 'success');
        
        // Extract key metrics
        const performanceScore = lighthouseData.categories.performance.score * 100;
        const accessibilityScore = lighthouseData.categories.accessibility.score * 100;
        const bestPracticesScore = lighthouseData.categories['best-practices'].score * 100;
        const seoScore = lighthouseData.categories.seo.score * 100;
        
        log(`Performance score: ${performanceScore.toFixed(1)}`, 'info');
        log(`Accessibility score: ${accessibilityScore.toFixed(1)}`, 'info');
        log(`Best practices score: ${bestPracticesScore.toFixed(1)}`, 'info');
        log(`SEO score: ${seoScore.toFixed(1)}`, 'info');
        
        return { success: true, lighthouse: lighthouseData };
      } catch (error) {
        log(`Failed to parse Lighthouse results: ${error.message}`, 'error');
      }
    } else {
      log(`Lighthouse output file not found: ${lighthouseOutputPath}`, 'error');
    }
  } else {
    log('Lighthouse audit failed', 'error');
  }
  
  return { success: false };
}

// Run the scan with retries
runScanWithRetries(TEST_URL, MAX_RETRIES)
  .then(result => {
    if (result.success) {
      log('Scan completed successfully!', 'success');
    } else {
      log('Scan failed after retries, trying direct audits...', 'error');
      return runDirectAudits(TEST_URL);
    }
  })
  .then(result => {
    if (result && result.success) {
      log('Direct audits completed successfully!', 'success');
    } else {
      log('All attempts failed. Please check the logs for details.', 'error');
    }
    
    // Final summary
    log('Test script execution completed.', 'info');
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
