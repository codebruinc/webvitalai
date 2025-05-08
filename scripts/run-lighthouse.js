#!/usr/bin/env node

/**
 * This script runs Lighthouse audits in a separate process
 * to avoid ESM compatibility issues with Next.js
 */

// Use ES modules syntax
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This function will dynamically import the ESM modules
async function importModules() {
  try {
    // Import lighthouse and chrome-launcher
    console.log('Importing lighthouse...');
    const lighthouse = await import('lighthouse');
    console.log('Lighthouse imported successfully');
    
    console.log('Importing chrome-launcher...');
    const chromeLauncher = await import('chrome-launcher');
    console.log('Chrome-launcher imported successfully');
    
    // Use the correct exports
    return {
      lighthouse: lighthouse.default,
      chromeLauncher: chromeLauncher // Use the module directly, not .default
    };
  } catch (error) {
    console.error('Failed to import modules:', error);
    process.exit(1);
  }
}

// Get URL from command line arguments
const url = process.argv[2];
const outputPath = process.argv[3];

if (!url) {
  console.error('URL is required');
  process.exit(1);
}

if (!outputPath) {
  console.error('Output path is required');
  process.exit(1);
}

// Validate URL
try {
  new URL(url);
} catch (error) {
  console.error('Invalid URL format');
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  console.error(`Output directory does not exist: ${outputDir}`);
  process.exit(1);
}

async function runLighthouse() {
  // Import modules dynamically
  const { lighthouse, chromeLauncher } = await importModules();
  
  // Check if we're in testing mode
  const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
  
  // Launch Chrome using environment variable or auto-detect
  const chromeFlags = ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'];
  const launchOptions = { chromeFlags };
  
  // Use environment variable if set
  if (process.env.CHROME_PATH) {
    console.log(`Using Chrome at: ${process.env.CHROME_PATH}`);
    launchOptions.chromePath = process.env.CHROME_PATH;
  } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log(`Using Puppeteer's Chrome at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    launchOptions.chromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else {
    console.log('Using auto-detected Chrome');
  }
  
  const chrome = await chromeLauncher.launch(launchOptions);

  try {
    // Run Lighthouse
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    
    if (!runnerResult) {
      throw new Error('Lighthouse audit failed to return results');
    }
    
    // Write results to file
    fs.writeFileSync(outputPath, JSON.stringify(runnerResult.lhr));
    
    console.log(`Lighthouse audit completed successfully for ${url}`);
    console.log(`Results saved to ${outputPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    process.exit(1);
  } finally {
    // Always kill Chrome
    await chrome.kill();
  }
}

// We don't need to create package.json here since we've already created it

// Run the lighthouse audit
runLighthouse().catch(error => {
  console.error('Failed to run Lighthouse:', error);
  process.exit(1);
});