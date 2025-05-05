#!/usr/bin/env node

/**
 * This script directly tests the Lighthouse wrapper without going through the API
 */
import { runLighthouseAudit } from './lighthouse-wrapper.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL to test
const testUrl = 'https://example.com';

// Output path for the results
const outputPath = path.join(__dirname, 'lighthouse-direct-test-result.json');

async function runTest() {
  console.log('Starting direct Lighthouse test...');
  console.log(`Testing URL: ${testUrl}`);
  console.log(`Output path: ${outputPath}`);
  
  try {
    // Run the Lighthouse audit
    await runLighthouseAudit(testUrl, outputPath);
    
    // Check if the results file exists
    if (fs.existsSync(outputPath)) {
      console.log('Lighthouse audit completed successfully!');
      
      // Read and parse the results
      const resultJson = fs.readFileSync(outputPath, 'utf8');
      const result = JSON.parse(resultJson);
      
      // Display some basic metrics
      console.log('\nPerformance Metrics:');
      console.log(`- Performance Score: ${(result.categories.performance.score * 100).toFixed(0)}`);
      console.log(`- Accessibility Score: ${(result.categories.accessibility.score * 100).toFixed(0)}`);
      console.log(`- SEO Score: ${(result.categories.seo.score * 100).toFixed(0)}`);
      console.log(`- Best Practices Score: ${(result.categories['best-practices'].score * 100).toFixed(0)}`);
      
      console.log('\nCore Web Vitals:');
      console.log(`- First Contentful Paint: ${(result.audits['first-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
      console.log(`- Largest Contentful Paint: ${(result.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
      console.log(`- Cumulative Layout Shift: ${result.audits['cumulative-layout-shift'].numericValue.toFixed(3)}`);
      console.log(`- Total Blocking Time: ${result.audits['total-blocking-time'].numericValue.toFixed(0)}ms`);
      
      // Clean up the test file
      fs.unlinkSync(outputPath);
      console.log('\nTest file cleaned up.');
      console.log('\nTest completed successfully!');
    } else {
      console.error('Error: Results file was not created.');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();