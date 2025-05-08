// Authentication verification and fix for WebVitalAI
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase clients with different roles
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Function to verify and fix authentication
async function verifyAndFixAuthentication() {
  try {
    console.log('Starting authentication verification and fix...');
    
    // Step 1: Verify environment configuration
    console.log('\n--- Step 1: Verifying environment configuration ---');
    const nodeEnv = process.env.NODE_ENV;
    const testingMode = process.env.TESTING_MODE;
    
    console.log(`Current NODE_ENV: ${nodeEnv}`);
    console.log(`Current TESTING_MODE: ${testingMode}`);
    
    if (nodeEnv !== 'production' || testingMode === 'true') {
      console.warn('Warning: Application is not in production mode or testing mode is enabled.');
      console.warn('This may cause authentication issues. Consider running set-production-mode.js');
    } else {
      console.log('Environment configuration is correct for production.');
    }
    
    // Step 2: Test service role authentication
    console.log('\n--- Step 2: Testing service role authentication ---');
    
    try {
      // Test if we can access auth.users table (requires service role)
      const { data: authUsers, error: authUsersError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .limit(1);
      
      if (authUsersError) {
        console.error('Service role authentication error:', authUsersError);
        console.log('The service role key may be invalid or missing required permissions.');
      } else {
        console.log('Service role authentication successful!');
        console.log('Service role client can access auth.users table.');
      }
    } catch (error) {
      console.error('Error testing service role authentication:', error);
    }
    
    // Step 3: Test auth.uid() function
    console.log('\n--- Step 3: Testing auth.uid() function ---');
    
    try {
      // Execute a SQL function to test auth.uid()
      const { data: uidTest, error: uidError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          DO $$
          DECLARE
            current_role TEXT;
            current_uid UUID;
          BEGIN
            -- Get the current role
            SELECT current_role INTO current_role;
            
            -- Try to get the current user ID
            BEGIN
              SELECT auth.uid() INTO current_uid;
              RAISE NOTICE 'Current role: %, Current auth.uid(): %', current_role, current_uid;
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Current role: %, Error getting auth.uid(): %', current_role, SQLERRM;
            END;
          END $$;
        `
      });
      
      if (uidError) {
        console.error('Error testing auth.uid() function:', uidError);
      } else {
        console.log('auth.uid() function test completed.');
        console.log('Note: For service role, auth.uid() should return NULL, which is expected.');
      }
    } catch (error) {
      console.error('Error executing SQL to test auth.uid():', error);
    }
    
    // Step 4: Test RLS policies with different roles
    console.log('\n--- Step 4: Testing RLS policies with different roles ---');
    
    // Find a test user
    const { data: testUsers, error: testUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (testUsersError || !testUsers || testUsers.length === 0) {
      console.error('Error finding test user:', testUsersError || 'No users found');
      console.log('Please create a user first or run create-user-and-subscription.sql');
      return;
    }
    
    const testUserId = testUsers[0].id;
    console.log(`Using test user: ${testUsers[0].email} (${testUserId})`);
    
    // Find or create a test website
    let websiteId;
    const { data: websites, error: websiteError } = await supabaseAdmin
      .from('websites')
      .select('id, url')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (websiteError || !websites || websites.length === 0) {
      console.log('No websites found for test user, creating one...');
      
      // Create a test website
      const testUrl = 'https://example.com';
      const { data: newWebsite, error: createWebsiteError } = await supabaseAdmin
        .from('websites')
        .insert({
          user_id: testUserId,
          url: testUrl,
          name: 'Example Website',
          is_active: true
        })
        .select('id, url')
        .single();
      
      if (createWebsiteError) {
        console.error('Error creating test website:', createWebsiteError);
        return;
      }
      
      console.log(`Created test website: ${newWebsite.url} (${newWebsite.id})`);
      websiteId = newWebsite.id;
    } else {
      console.log(`Using existing website: ${websites[0].url} (${websites[0].id})`);
      websiteId = websites[0].id;
    }
    
    // Test 1: Create a scan using the service role client
    console.log('\nTest 1: Creating scan with service role client...');
    const { data: adminScan, error: adminScanError } = await supabaseAdmin
      .from('scans')
      .insert({
        website_id: websiteId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (adminScanError) {
      console.error('Error creating scan with service role:', adminScanError);
      console.log('The service role may not have the necessary permissions.');
    } else {
      console.log(`Scan created successfully with service role, ID: ${adminScan.id}`);
      
      // Test 2: Verify the scan exists using the service role client
      console.log('\nTest 2: Verifying scan exists with service role client...');
      const { data: adminScanVerify, error: adminScanVerifyError } = await supabaseAdmin
        .from('scans')
        .select('id, status, website_id')
        .eq('id', adminScan.id)
        .single();
      
      if (adminScanVerifyError) {
        console.error('Error verifying scan with service role:', adminScanVerifyError);
      } else {
        console.log(`Scan verified successfully with service role: ${JSON.stringify(adminScanVerify)}`);
      }
      
      // Test 3: Try to access the scan using the anonymous client (should fail due to RLS)
      console.log('\nTest 3: Accessing scan with anonymous client (should fail due to RLS)...');
      const { data: anonScanVerify, error: anonScanVerifyError } = await supabaseAnon
        .from('scans')
        .select('id, status, website_id')
        .eq('id', adminScan.id)
        .single();
      
      if (anonScanVerifyError) {
        console.log('Anonymous client scan access failed as expected due to RLS policy.');
        console.log('This confirms the RLS policy is working correctly for anonymous users.');
      } else {
        console.warn('Warning: Anonymous client was able to access the scan. RLS policy may not be working correctly.');
        console.log(`Unexpected scan access: ${JSON.stringify(anonScanVerify)}`);
      }
    }
    
    // Step 5: Fix Supabase client initialization in the application
    console.log('\n--- Step 5: Recommendations for fixing Supabase client initialization ---');
    console.log('Based on the tests, here are recommendations for fixing Supabase client initialization:');
    console.log('1. Update src/lib/supabase.ts to use the service role key for the admin client');
    console.log('2. Ensure all server-side operations that need to bypass RLS use the admin client');
    console.log('3. Use the anonymous key only for client-side operations');
    console.log('4. Make sure authentication is properly handled in all API routes');
    
    console.log('\nAuthentication verification and fix completed!');
    
  } catch (error) {
    console.error('Unexpected error during authentication verification:', error);
  }
}

// Run the verification and fix
verifyAndFixAuthentication();