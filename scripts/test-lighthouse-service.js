/**
 * Test script for the Lighthouse service integration
 */
import { runLighthouseAudit } from '../src/services/lighthouseService.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL to test
const testUrl = 'https://example.com';

async function runTest() {
  console.log('Starting Lighthouse service test...');
  console.log(`Testing URL: ${testUrl}`);
  
  try {
    // Run the Lighthouse audit using the service
    const result = await runLighthouseAudit(testUrl);
    
    // Display the results
    console.log('\nLighthouse Service Results:');
    console.log(`- Performance Score: ${result.performance.score.toFixed(0)}`);
    
    // Display some metrics
    const metrics = result.performance.metrics;
    if (metrics['First Contentful Paint']) {
      console.log(`- First Contentful Paint: ${(metrics['First Contentful Paint'].value / 1000).toFixed(2)}s`);
    }
    
    if (metrics['Largest Contentful Paint']) {
      console.log(`- Largest Contentful Paint: ${(metrics['Largest Contentful Paint'].value / 1000).toFixed(2)}s`);
    }
    
    if (metrics['Cumulative Layout Shift']) {
      console.log(`- Cumulative Layout Shift: ${metrics['Cumulative Layout Shift'].value.toFixed(3)}`);
    }
    
    // Display accessibility score
    console.log(`- Accessibility Score: ${result.accessibility.score.toFixed(0)}`);
    
    // Display SEO score
    console.log(`- SEO Score: ${result.seo.score.toFixed(0)}`);
    
    // Display Best Practices score
    console.log(`- Best Practices Score: ${result.bestPractices.score.toFixed(0)}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();