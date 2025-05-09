// scripts/test-scan-fixes.cjs
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://kittwppxvfbvwyyklwrn.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHR3cHB4dmZidnd5eWtsd3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM1MTA2MCwiZXhwIjoyMDYxOTI3MDYwfQ.xMpqh49iPpe5tnbgeX9H5tt6MKszqCfDsqoVhwo1FzI';

console.log('Using Supabase URL:', supabaseUrl);

// Create Supabase clients - one with service role key and one with regular client
const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  // Add required headers to prevent 406 errors
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

/**
 * Test 1: Fetch recent scans using the fixed query syntax (without .single())
 * This tests the fix for PGRST116 errors by avoiding .single() and handling empty results properly
 */
async function testRecentScans() {
  console.log('\n=== Test 1: Fetching Recent Scans ===');
  
  try {
    // Using the fixed query syntax (no .single())
    const { data: scans, error } = await supabaseServiceRole
      .from('scans')
      .select('id, created_at, status, website_id, websites(url, user_id)')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Error fetching scans:', error);
      return false;
    }
    
    console.log(`✅ Successfully fetched ${scans.length} recent scans`);
    
    // Check if scans have associated website data
    const scansWithWebsites = scans.filter(scan => scan.websites && scan.websites.url);
    console.log(`- ${scansWithWebsites.length} out of ${scans.length} scans have associated website data`);
    
    // Display scan details
    scans.forEach((scan, index) => {
      console.log(`\nScan #${index + 1}:`);
      console.log(`- ID: ${scan.id}`);
      console.log(`- Status: ${scan.status}`);
      console.log(`- Created: ${new Date(scan.created_at).toLocaleString()}`);
      console.log(`- Website ID: ${scan.website_id}`);
      console.log(`- Website URL: ${scan.websites ? scan.websites.url : 'N/A'}`);
      console.log(`- User ID: ${scan.websites ? scan.websites.user_id : 'N/A'}`);
    });
    
    return scans;
  } catch (err) {
    console.error('❌ Unexpected error in testRecentScans:', err);
    return false;
  }
}

/**
 * Test 2: Test retrieving a specific scan with both methods
 * This compares the old problematic method (.single()) with the fixed method
 */
async function testScanRetrieval(scanId) {
  console.log(`\n=== Test 2: Testing Scan Retrieval for ID: ${scanId} ===`);
  
  try {
    // Method 1: Using .single() (old problematic method)
    console.log('\nMethod 1: Using .single() (old problematic method)');
    try {
      const { data: scanSingle, error: singleError } = await supabaseServiceRole
        .from('scans')
        .select('id, status, website_id, websites(url, user_id)')
        .eq('id', scanId)
        .single();
        
      if (singleError) {
        console.log('❌ Error with .single() method:', singleError);
        console.log('- This error is expected if the PGRST116 issue is not fixed');
      } else {
        console.log('✅ Successfully retrieved scan with .single() method');
        console.log('- Scan status:', scanSingle.status);
        console.log('- Website URL:', scanSingle.websites ? scanSingle.websites.url : 'N/A');
      }
    } catch (singleErr) {
      console.log('❌ Exception with .single() method:', singleErr.message);
    }
    
    // Method 2: Using fixed method (no .single())
    console.log('\nMethod 2: Using fixed method (no .single())');
    const { data: scansArray, error: arrayError } = await supabaseServiceRole
      .from('scans')
      .select('id, status, website_id, websites(url, user_id)')
      .eq('id', scanId);
      
    if (arrayError) {
      console.error('❌ Error with fixed method:', arrayError);
      return false;
    }
    
    if (!scansArray || scansArray.length === 0) {
      console.log('❌ No scan found with the fixed method');
      return false;
    }
    
    const scan = scansArray[0];
    console.log('✅ Successfully retrieved scan with fixed method');
    console.log('- Scan status:', scan.status);
    console.log('- Website URL:', scan.websites ? scan.websites.url : 'N/A');
    
    return scan;
  } catch (err) {
    console.error('❌ Unexpected error in testScanRetrieval:', err);
    return false;
  }
}

/**
 * Test 3: Test the fixed query syntax for filtering by website user_id
 * This tests the RLS bypass using service role client
 */
async function testWebsiteUserFiltering(userId) {
  console.log(`\n=== Test 3: Testing Website User Filtering for User ID: ${userId} ===`);
  
  try {
    // Using service role client to bypass RLS
    const { data: websites, error: websitesError } = await supabaseServiceRole
      .from('websites')
      .select('id, url')
      .eq('user_id', userId);
      
    if (websitesError) {
      console.error('❌ Error fetching websites:', websitesError);
      return false;
    }
    
    console.log(`✅ Found ${websites.length} websites for user ${userId}`);
    
    if (websites.length === 0) {
      console.log('No websites found for this user');
      return false;
    }
    
    // Get the first website ID
    const websiteId = websites[0].id;
    console.log(`Testing scan retrieval for website ID: ${websiteId}`);
    
    // Get scans for this website using service role client
    const { data: scans, error: scansError } = await supabaseServiceRole
      .from('scans')
      .select('id, status, created_at')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (scansError) {
      console.error('❌ Error fetching scans for website:', scansError);
      return false;
    }
    
    console.log(`✅ Found ${scans.length} scans for website ${websiteId}`);
    
    // Display scan details
    scans.forEach((scan, index) => {
      console.log(`\nScan #${index + 1}:`);
      console.log(`- ID: ${scan.id}`);
      console.log(`- Status: ${scan.status}`);
      console.log(`- Created: ${new Date(scan.created_at).toLocaleString()}`);
    });
    
    return scans;
  } catch (err) {
    console.error('❌ Unexpected error in testWebsiteUserFiltering:', err);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting scan fixes verification tests...');
  
  // Test 1: Fetch recent scans
  const recentScans = await testRecentScans();
  
  if (!recentScans || recentScans.length === 0) {
    console.log('\n❌ No recent scans found. Cannot continue with specific scan tests.');
    return;
  }
  
  // Get the first scan ID and user ID for further tests
  const firstScan = recentScans[0];
  const scanId = firstScan.id;
  const userId = firstScan.websites ? firstScan.websites.user_id : null;
  
  // Test 2: Test scan retrieval with specific ID
  if (scanId) {
    await testScanRetrieval(scanId);
  } else {
    console.log('\n❌ No valid scan ID found for Test 2.');
  }
  
  // Test 3: Test website user filtering
  if (userId) {
    await testWebsiteUserFiltering(userId);
  } else {
    console.log('\n❌ No valid user ID found for Test 3.');
  }
  
  console.log('\n=== Test Summary ===');
  console.log('All tests completed. Check the logs above for any errors.');
  console.log('If no errors were reported and all tests show ✅, the fixes are working correctly.');
}

// Run the tests
runTests().catch(err => {
  console.error('Test script failed with error:', err);
  process.exit(1);
});