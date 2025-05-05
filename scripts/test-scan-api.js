/**
 * Test script for the scan API endpoint
 * This tests the entire scan flow including the Lighthouse integration
 */
import fetch from 'node-fetch';

// URL to test
const testUrl = 'https://example.com';
const apiUrl = 'http://localhost:3000/api/scan';

async function runTest() {
  console.log('Starting scan API test...');
  console.log(`Testing URL: ${testUrl}`);
  
  try {
    // Start the scan
    console.log('Initiating scan...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Scan initiated:', data);
    
    if (!data.success || !data.data.scan_id) {
      throw new Error('Failed to get scan ID from API response');
    }
    
    const scanId = data.data.scan_id;
    console.log(`Scan ID: ${scanId}`);
    
    // Poll for scan status
    console.log('Polling for scan status...');
    let scanComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // Maximum number of polling attempts
    
    while (!scanComplete && attempts < maxAttempts) {
      attempts++;
      
      // Wait for 2 seconds between polling attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check scan status
      const statusResponse = await fetch(`${apiUrl}/status?id=${scanId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Status API request failed with status ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      console.log(`Attempt ${attempts}: Status - ${statusData.data.status}`);
      
      if (statusData.data.status === 'completed') {
        scanComplete = true;
        console.log('Scan completed successfully!');
        
        // Get scan results
        const resultsResponse = await fetch(`${apiUrl}/results?id=${scanId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!resultsResponse.ok) {
          throw new Error(`Results API request failed with status ${resultsResponse.status}`);
        }
        
        const resultsData = await resultsResponse.json();
        
        // Display the results
        console.log('\nScan Results:');
        if (resultsData.data.performance) {
          console.log(`- Performance Score: ${resultsData.data.performance.score.toFixed(0)}`);
        }
        
        if (resultsData.data.accessibility) {
          console.log(`- Accessibility Score: ${resultsData.data.accessibility.score.toFixed(0)}`);
        }
        
        if (resultsData.data.seo) {
          console.log(`- SEO Score: ${resultsData.data.seo.score.toFixed(0)}`);
        }
        
        if (resultsData.data.bestPractices) {
          console.log(`- Best Practices Score: ${resultsData.data.bestPractices.score.toFixed(0)}`);
        }
        
        console.log('\nTest completed successfully!');
      } else if (statusData.data.status === 'failed') {
        throw new Error(`Scan failed: ${statusData.data.error || 'Unknown error'}`);
      }
    }
    
    if (!scanComplete) {
      throw new Error('Scan timed out');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();