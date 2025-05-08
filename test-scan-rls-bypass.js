/**
 * This script tests the RLS bypass solution for scan creation
 * It attempts to create a scan using different methods to verify the solution works
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user ID - this should be a real user ID from your database
const testUserId = '8ff0950a-c73d-4efc-8b73-56205b8035e0';
const testUrl = 'https://example.com';

async function testScanCreation() {
  console.log('Testing scan creation with RLS bypass solution...');
  console.log('Using test user ID:', testUserId);
  console.log('Using test URL:', testUrl);

  try {
    // Step 1: Verify the test user exists
    console.log('\nStep 1: Verifying test user...');
    const { data: user, error: userError } = await supabaseServiceRole
      .from('users')
      .select('id, email')
      .eq('id', testUserId)
      .single();

    if (userError) {
      console.error('Error finding test user:', userError);
      console.log('Creating test user...');
      
      // Create a test user if it doesn't exist
      const { data: newUser, error: createError } = await supabaseServiceRole
        .from('users')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User',
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Failed to create test user:', createError);
        process.exit(1);
      }
      
      console.log('Test user created:', newUser.id);
    } else {
      console.log('Test user found:', user.id, user.email);
    }

    // Step 2: Create a test website
    console.log('\nStep 2: Creating test website...');
    const websiteId = crypto.randomUUID();
    const { data: website, error: websiteError } = await supabaseServiceRole
      .from('websites')
      .insert({
        id: websiteId,
        user_id: testUserId,
        url: testUrl,
        name: 'Test Website',
        is_active: true,
      })
      .select('id')
      .single();

    if (websiteError) {
      console.error('Error creating test website:', websiteError);
      
      // Try to find an existing website
      console.log('Looking for existing website...');
      const { data: existingWebsite, error: findError } = await supabaseServiceRole
        .from('websites')
        .select('id')
        .eq('user_id', testUserId)
        .limit(1)
        .single();
      
      if (findError) {
        console.error('Failed to find existing website:', findError);
        process.exit(1);
      }
      
      console.log('Using existing website:', existingWebsite.id);
      websiteId = existingWebsite.id;
    } else {
      console.log('Test website created:', website.id);
    }

    // Step 3: Test scan creation with anon client (should fail due to RLS)
    console.log('\nStep 3: Testing scan creation with anon client (expected to fail)...');
    try {
      const { data: anonScan, error: anonError } = await supabaseAnon
        .from('scans')
        .insert({
          website_id: websiteId,
          status: 'pending',
        })
        .select('id')
        .single();

      if (anonError) {
        console.log('Anon client failed as expected:', anonError.message);
      } else {
        console.log('Anon client succeeded unexpectedly:', anonScan.id);
      }
    } catch (error) {
      console.log('Anon client failed as expected:', error.message);
    }

    // Step 4: Test scan creation with service role client (should succeed)
    console.log('\nStep 4: Testing scan creation with service role client...');
    const { data: serviceScan, error: serviceError } = await supabaseServiceRole
      .from('scans')
      .insert({
        website_id: websiteId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (serviceError) {
      console.error('Service role client failed:', serviceError);
    } else {
      console.log('Service role client succeeded:', serviceScan.id);
    }

    // Step 5: Test scan creation with RPC function (should succeed)
    console.log('\nStep 5: Testing scan creation with RPC function...');
    const { data: rpcScan, error: rpcError } = await supabaseServiceRole.rpc(
      'create_scan_bypass_rls',
      { website_id_param: websiteId }
    );

    if (rpcError) {
      console.error('RPC function failed:', rpcError);
    } else {
      console.log('RPC function succeeded:', rpcScan);
    }

    // Step 6: Test the API endpoint
    console.log('\nStep 6: Testing API endpoint...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-testing-bypass': 'true'
        },
        body: JSON.stringify({ url: testUrl })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API endpoint failed:', result);
      } else {
        console.log('API endpoint succeeded:', result);
      }
    } catch (apiError) {
      console.error('API endpoint error:', apiError);
    }

    console.log('\nTest completed!');
  } catch (error) {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  }
}

// Run the test
testScanCreation().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});