/**
 * Test script for the scan API with testing bypass
 * This script demonstrates how to use the testing bypass feature
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const API_URL = 'http://localhost:3001/api/scan';  // Updated port to 3001
const TEST_URL = 'https://example.com';

/**
 * Test the scan API with testing bypass
 */
async function testScanApiBypass() {
  console.log('Starting scan API test with testing bypass...');
  console.log(`Testing URL: ${TEST_URL}`);
  
  try {
    // Test POST endpoint (initiate scan)
    console.log('\nTesting POST endpoint with testing bypass...');
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-testing-bypass': 'true' // Enable testing bypass
      },
      body: JSON.stringify({ url: TEST_URL })
    });
    
    // Check if response is JSON or HTML
    const contentType = postResponse.headers.get('content-type');
    let postData;
    
    if (contentType && contentType.includes('application/json')) {
      postData = await postResponse.json();
    } else {
      // If not JSON, get the text and log it
      const text = await postResponse.text();
      console.error('Received non-JSON response:');
      console.error(text.substring(0, 200) + '...'); // Show first 200 chars
      throw new Error('Received HTML instead of JSON. Check if API endpoint is correct.');
    }
    console.log(`Response status: ${postResponse.status}`);
    console.log('Response data:', JSON.stringify(postData, null, 2));
    
    if (postResponse.status === 200 && postData.success) {
      console.log('✅ POST test passed: Scan initiated successfully');
      
      // Get the scan ID from the response
      const scanId = postData.data.scan_id;
      
      // Test GET endpoint (get scan status)
      console.log('\nTesting GET endpoint with testing bypass...');
      const getResponse = await fetch(`${API_URL}/status?id=${scanId}`, {
        method: 'GET',
        headers: {
          'x-testing-bypass': 'true' // Enable testing bypass
        }
      });
      
      const getData = await getResponse.json();
      console.log(`Response status: ${getResponse.status}`);
      console.log('Response data:', JSON.stringify(getData, null, 2));
      
      if (getResponse.status === 200 && getData.success) {
        console.log('✅ GET test passed: Scan status retrieved successfully');
      } else {
        console.log('❌ GET test failed:', getData.error || 'Unknown error');
      }
    } else {
      console.log('❌ POST test failed:', postData.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Test the scan API without testing bypass (should fail if not authenticated)
 */
async function testScanApiWithoutBypass() {
  console.log('\nTesting scan API without testing bypass (should fail if not authenticated)...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: TEST_URL })
    });
    
    // Check if response is JSON or HTML
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get the text and log it
      const text = await response.text();
      console.error('Received non-JSON response:');
      console.error(text.substring(0, 200) + '...'); // Show first 200 chars
      throw new Error('Received HTML instead of JSON. Check if API endpoint is correct.');
    }
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Security test passed: Unauthorized without testing bypass');
    } else {
      console.log('⚠️ Security test unexpected result: API did not return 401 Unauthorized');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Main function
 */
async function main() {
  // Check if we're in development mode
  const isDevMode = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (!isDevMode) {
    console.warn('⚠️ Warning: Testing bypass should only be used in development mode!');
    console.warn('Setting NODE_ENV=development for this test run...');
    process.env.NODE_ENV = 'development';
  }
  
  // Set testing mode explicitly
  process.env.TESTING_MODE = 'true';
  
  console.log(`Using API URL: ${API_URL}`);
  console.log('Testing mode enabled:', process.env.TESTING_MODE === 'true');
  
  // Run the tests
  await testScanApiBypass();
  await testScanApiWithoutBypass();
  
  console.log('\nTests completed!');
  console.log('\nNOTE: To enable testing bypass globally, set these environment variables:');
  console.log('  NODE_ENV=development');
  console.log('  TESTING_MODE=true');
}

// Run the main function
main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});