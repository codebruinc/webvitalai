const fetch = require('node-fetch');

async function testScanApi() {
  try {
    console.log('Testing scan API...');
    
    // You'll need to replace this with a valid session cookie from your browser
    // This is just a placeholder and won't work without a real cookie
    const cookies = 'your-session-cookie-here';
    
    const response = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        url: 'https://example.com'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed: Scan initiated successfully');
      return true;
    } else {
      console.log('❌ Test failed: ' + (data.error || 'Unknown error'));
      return false;
    }
  } catch (error) {
    console.error('Error testing scan API:', error);
    return false;
  }
}

testScanApi();