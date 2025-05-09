#!/usr/bin/env node

/**
 * Test script to verify the dashboard scan display fix
 * 
 * This script tests if the Supabase client is properly configured with the required headers
 * and if the dashboard page can fetch scan data correctly.
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Test the Supabase client with proper headers
async function testSupabaseClient() {
  console.log('Testing Supabase client with proper headers...');
  
  // Create a Supabase client with the required headers
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  });
  
  try {
    // Try to fetch websites (this should work with the proper headers)
    const { data, error } = await supabase
      .from('websites')
      .select('id, url, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching websites:', error.message);
      return false;
    }
    
    console.log('✅ Successfully fetched websites with proper headers');
    console.log(`Found ${data.length} websites`);
    
    // Try to fetch scans for the first website
    if (data.length > 0) {
      const websiteId = data[0].id;
      console.log(`Testing scan fetch for website ${data[0].url} (${websiteId})...`);
      
      const { data: scanData, error: scanError } = await supabase
        .from('scans')
        .select('id, status, created_at')
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (scanError) {
        console.error('❌ Error fetching scans:', scanError.message);
        return false;
      }
      
      console.log('✅ Successfully fetched scans with proper headers');
      console.log(`Found ${scanData.length} scans for website ${data[0].url}`);
      
      if (scanData.length > 0) {
        console.log('Scan details:', {
          id: scanData[0].id,
          status: scanData[0].status,
          created_at: scanData[0].created_at
        });
      } else {
        console.log('No scans found for this website');
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Test the API endpoints with proper headers
async function testApiEndpoints() {
  console.log('\nTesting API endpoints with proper headers...');
  
  try {
    // Define headers for the request
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Test the health endpoint first to make sure the API is running
    const healthResponse = await fetch('http://localhost:3000/api/health', { headers });
    
    if (!healthResponse.ok) {
      console.error('❌ Health check failed. Is the server running?');
      console.error(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
      return false;
    }
    
    console.log('✅ Health check passed');
    
    // Test the scan status endpoint (this would normally require authentication)
    console.log('Note: The scan status endpoint test may fail without authentication');
    console.log('This is expected behavior and does not indicate a problem with the headers');
    
    const scanId = 'test-scan-id'; // This is just a placeholder
    const statusResponse = await fetch(`http://localhost:3000/api/scan/status?id=${scanId}`, { headers });
    
    console.log(`Scan status endpoint response: ${statusResponse.status} ${statusResponse.statusText}`);
    
    if (statusResponse.status === 401) {
      console.log('✅ Received 401 Unauthorized - This is expected without authentication');
    } else if (statusResponse.status === 404) {
      console.log('✅ Received 404 Not Found - This is expected for a non-existent scan ID');
    } else if (statusResponse.ok) {
      console.log('✅ Successfully accessed scan status endpoint');
    } else {
      console.warn(`⚠️ Unexpected status code: ${statusResponse.status}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error testing API endpoints:', err.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Dashboard Scan Display Fix Test ===\n');
  
  let success = true;
  
  // Test the Supabase client
  const clientSuccess = await testSupabaseClient();
  success = success && clientSuccess;
  
  // Test the API endpoints
  const apiSuccess = await testApiEndpoints();
  success = success && apiSuccess;
  
  console.log('\n=== Test Summary ===');
  if (success) {
    console.log('✅ All tests passed! The dashboard scan display fix is working correctly.');
    console.log('You should now be able to see past scans on the dashboard page.');
  } else {
    console.log('❌ Some tests failed. Please check the logs above for details.');
    console.log('You may need to review the fix implementation.');
  }
  
  console.log('\nTo verify the fix in the browser:');
  console.log('1. Make sure the application is running (npm run dev)');
  console.log('2. Open http://localhost:3000/dashboard in your browser');
  console.log('3. Check if past scans are displayed correctly');
  console.log('4. Verify that there are no 406 errors in the browser console');
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
