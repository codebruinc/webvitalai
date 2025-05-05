/**
 * Direct test script for the modified functions
 * This script tests the functions directly without requiring the server to be running
 */

// Import required modules
require('dotenv').config({ path: '.env.local' });

// Set testing mode
process.env.NODE_ENV = 'development';
process.env.TESTING_MODE = 'true';

// Import the modified services
const { queueScan, getScanJobStatus } = require('./src/services/queueService');
const lighthouseWrapper = require('./scripts/lighthouse-wrapper.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test configuration
const TEST_SCAN_ID = 'test-scan-' + Date.now();
const TEST_URL = 'https://example.com';

/**
 * Test the queueService functions
 */
async function testQueueService() {
  console.log('\n--- Testing Queue Service ---');
  
  try {
    console.log(`Testing queueScan with scan ID: ${TEST_SCAN_ID}`);
    
    // Test queueScan function
    const jobId = await queueScan(TEST_SCAN_ID);
    console.log('✅ queueScan test passed:', jobId);
    
    // Test getScanJobStatus function
    console.log(`Testing getScanJobStatus with job ID: ${jobId}`);
    const status = await getScanJobStatus(jobId);
    console.log('✅ getScanJobStatus test passed:', status);
    
    return true;
  } catch (error) {
    console.error('❌ Queue service test failed:', error);
    return false;
  }
}

/**
 * Test the lighthouse wrapper
 */
async function testLighthouseWrapper() {
  console.log('\n--- Testing Lighthouse Wrapper ---');
  
  try {
    // Create a temporary output file
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `lighthouse-test-${Date.now()}.json`);
    
    console.log(`Testing runLighthouseAudit with URL: ${TEST_URL}`);
    console.log(`Output path: ${outputPath}`);
    
    // Test runLighthouseAudit function
    await lighthouseWrapper.runLighthouseAudit(TEST_URL, outputPath);
    
    // Check if the output file exists
    if (fs.existsSync(outputPath)) {
      console.log('✅ Lighthouse wrapper test passed: Output file created');
      
      // Read the file to verify it contains valid JSON
      const content = fs.readFileSync(outputPath, 'utf8');
      const json = JSON.parse(content);
      
      console.log('✅ Output file contains valid JSON');
      console.log('Categories:', Object.keys(json.categories).join(', '));
      
      // Clean up
      fs.unlinkSync(outputPath);
      return true;
    } else {
      console.error('❌ Lighthouse wrapper test failed: Output file not created');
      return false;
    }
  } catch (error) {
    console.error('❌ Lighthouse wrapper test failed:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting direct function tests...');
  console.log('Testing mode enabled:', process.env.TESTING_MODE === 'true');
  
  // Run the tests
  const queueServiceResult = await testQueueService();
  const lighthouseWrapperResult = await testLighthouseWrapper();
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log('Queue Service:', queueServiceResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Lighthouse Wrapper:', lighthouseWrapperResult ? '✅ PASSED' : '❌ FAILED');
  
  if (queueServiceResult && lighthouseWrapperResult) {
    console.log('\n✅ All tests passed! Your changes are working correctly.');
    console.log('You can now start the server with `npm run dev` to test the full application.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});