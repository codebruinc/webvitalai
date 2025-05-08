/**
 * Verification script for the WebVitalAI scan creation fix
 * 
 * This script tests the scan creation API endpoint directly and verifies
 * that a scan is successfully created in the database using the service role client.
 * 
 * Run with: node verify-simple-fix.js
 */
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_URL = 'https://example.com';
const API_URL = 'http://localhost:3000/api/scan';

// Create a Supabase client with service role key to verify database entries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: Missing Supabase environment variables. Please check your .env.local file.');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create a service role client to verify database entries
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyFix() {
  console.log('\x1b[36m%s\x1b[0m', '=== WebVitalAI Scan Creation Fix Verification ===');
  console.log('Testing URL:', TEST_URL);
  console.log('API Endpoint:', API_URL);
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service Role Key:', supabaseServiceRoleKey.substring(0, 5) + '...');
  console.log('\x1b[36m%s\x1b[0m', '================================================');
  
  try {
    // Step 1: Test the scan API endpoint
    console.log('\n\x1b[33m%s\x1b[0m', '📡 STEP 1: Testing scan API endpoint...');
    
    const startTime = Date.now();
    // Create a dummy token for testing
    const dummyToken = 'test-token-for-verification';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add testing bypass header to skip authentication
        'x-testing-bypass': 'true',
        // Add authorization header for more realistic testing
        'Authorization': `Bearer ${dummyToken}`
      },
      body: JSON.stringify({ url: TEST_URL }),
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Time:', responseTime + 'ms');
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    if (!data.success || !data.data || !data.data.scan_id) {
      throw new Error('Invalid API response format: Missing scan_id');
    }
    
    const scanId = data.data.scan_id;
    console.log('\x1b[32m%s\x1b[0m', `✅ API endpoint test passed! Scan ID: ${scanId}`);
    
    // Step 2: Verify the scan was created in the database
    console.log('\n\x1b[33m%s\x1b[0m', '🔍 STEP 2: Verifying scan creation in database...');
    
    // Wait a moment to ensure the database operation completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Query the database using the service role client
    const { data: scan, error: scanError } = await supabaseAdmin
      .from('scans')
      .select('id, status, website_id, websites(url, user_id)')
      .eq('id', scanId)
      .single();
    
    if (scanError) {
      throw new Error(`Database query failed: ${scanError.message}`);
    }
    
    if (!scan) {
      throw new Error(`Scan not found in database: ${scanId}`);
    }
    
    console.log('Database Record:', JSON.stringify({
      id: scan.id,
      status: scan.status,
      website_id: scan.website_id,
      website_url: scan.websites?.url,
      user_id: scan.websites?.user_id
    }, null, 2));
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Database verification passed! Scan record exists.');
    
    // Step 3: Verify the website record
    console.log('\n\x1b[33m%s\x1b[0m', '🔍 STEP 3: Verifying website record...');
    
    const { data: website, error: websiteError } = await supabaseAdmin
      .from('websites')
      .select('id, url, user_id')
      .eq('id', scan.website_id)
      .single();
    
    if (websiteError) {
      throw new Error(`Website query failed: ${websiteError.message}`);
    }
    
    if (!website) {
      throw new Error(`Website not found in database: ${scan.website_id}`);
    }
    
    console.log('Website Record:', JSON.stringify(website, null, 2));
    console.log('\x1b[32m%s\x1b[0m', '✅ Website verification passed! Website record exists.');
    
    // Final verification result
    console.log('\n\x1b[42m\x1b[30m%s\x1b[0m', ' VERIFICATION SUCCESSFUL ');
    console.log('\x1b[32m%s\x1b[0m', '✅ The service role client fix is working correctly!');
    console.log('\x1b[32m%s\x1b[0m', '✅ Scan creation bypasses RLS policies successfully.');
    console.log('\x1b[32m%s\x1b[0m', '✅ All database records were created properly.');
    
  } catch (error) {
    // Detailed error reporting
    console.error('\n\x1b[41m\x1b[37m%s\x1b[0m', ' VERIFICATION FAILED ');
    console.error('\x1b[31m%s\x1b[0m', `❌ Error: ${error.message}`);
    
    if (error.stack) {
      console.error('\n\x1b[33m%s\x1b[0m', 'Error Stack:');
      console.error(error.stack.split('\n').slice(1).join('\n'));
    }
    
    if (error.cause) {
      console.error('\n\x1b[33m%s\x1b[0m', 'Error Cause:');
      console.error(error.cause);
    }
    
    console.error('\n\x1b[33m%s\x1b[0m', 'Troubleshooting Tips:');
    console.error('1. Ensure the local development server is running (npm run dev)');
    console.error('2. Check that .env.local contains the correct Supabase credentials');
    console.error('3. Verify that the service role key has the necessary permissions');
    console.error('4. Check that the RLS bypass implementation is correctly configured');
    
    process.exit(1);
  }
}

// Run the verification
verifyFix();