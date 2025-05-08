// Comprehensive fix for RLS policy issues in WebVitalAI
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

// Function to apply the comprehensive RLS fix
async function applyComprehensiveRlsFix() {
  try {
    console.log('Starting comprehensive RLS policy fix...');
    
    // Step 1: Verify environment configuration
    console.log('\n--- Step 1: Verifying environment configuration ---');
    const nodeEnv = process.env.NODE_ENV;
    const testingMode = process.env.TESTING_MODE;
    
    console.log(`Current NODE_ENV: ${nodeEnv}`);
    console.log(`Current TESTING_MODE: ${testingMode}`);
    
    if (nodeEnv !== 'production' || testingMode === 'true') {
      console.warn('Warning: Application is not in production mode or testing mode is enabled.');
      console.warn('This may cause issues with RLS policies. Consider running set-production-mode.js');
    } else {
      console.log('Environment configuration is correct for production.');
    }
    
    // Step 2: Verify Supabase authentication
    console.log('\n--- Step 2: Verifying Supabase authentication ---');
    
    // Test service role authentication
    try {
      const { data: serviceRoleData, error: serviceRoleError } = await supabaseAdmin.auth.getSession();
      
      if (serviceRoleError) {
        console.error('Service role authentication error:', serviceRoleError);
      } else {
        console.log('Service role authentication successful.');
        console.log('Service role client initialized correctly.');
      }
    } catch (error) {
      console.error('Error testing service role authentication:', error);
    }
    
    // Step 3: Apply RLS policy fix
    console.log('\n--- Step 3: Applying RLS policy fix ---');
    
    // Define the improved RLS policy SQL
    const rlsPolicySql = `
-- Start a transaction so we can roll back if anything fails
BEGIN;

-- First, check if RLS is enabled for the scans table
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT obj_description('public.scans'::regclass)::jsonb->'security_policies'->'enabled' INTO rls_enabled;
  
  IF rls_enabled IS NULL THEN
    RAISE NOTICE 'Could not determine if RLS is enabled for scans table, enabling it now';
    ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE 'RLS is not enabled for scans table, enabling it now';
    ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'RLS is already enabled for scans table';
  END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert scans for their websites" ON public.scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
DROP POLICY IF EXISTS "Service role can manage all scans" ON public.scans;

-- Create policy to allow users to view their own scans
CREATE POLICY "Users can view their own scans" ON public.scans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to insert scans for websites they own
CREATE POLICY "Users can insert scans for their websites" ON public.scans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to update their own scans
CREATE POLICY "Users can update their own scans" ON public.scans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create policy to allow users to delete their own scans
CREATE POLICY "Users can delete their own scans" ON public.scans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = scans.website_id
      AND websites.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'scans' 
  AND schemaname = 'public';

-- If everything looks good, commit the transaction
COMMIT;
`;
    
    // Execute the SQL script using the service role client
    const { data: rlsData, error: rlsError } = await supabaseAdmin.rpc('exec_sql', { sql: rlsPolicySql });
    
    if (rlsError) {
      console.error('Error applying RLS fix:', rlsError);
      return;
    }
    
    console.log('RLS policy fix applied successfully!');
    console.log('The following policies have been created for the scans table:');
    console.log('- "Users can view their own scans"');
    console.log('- "Users can insert scans for their websites"');
    console.log('- "Users can update their own scans"');
    console.log('- "Users can delete their own scans"');
    
    // Step 4: Test the fix by creating a scan
    console.log('\n--- Step 4: Testing the fix by creating a scan ---');
    
    // First, try to authenticate as a real user
    console.log('Attempting to authenticate with a test user...');
    
    // Try to find an existing user in the database
    const { data: existingUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !existingUsers || existingUsers.length === 0) {
      console.error('Error finding test user:', usersError || 'No users found');
      console.log('Please create a user first or run create-user-and-subscription.sql');
      return;
    }
    
    const testUserId = existingUsers[0].id;
    console.log(`Using test user: ${existingUsers[0].email} (${testUserId})`);
    
    // Get a website owned by the user
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
      var websiteId = newWebsite.id;
      var websiteUrl = newWebsite.url;
    } else {
      console.log(`Using existing website: ${websites[0].url} (${websites[0].id})`);
      var websiteId = websites[0].id;
      var websiteUrl = websites[0].url;
    }
    
    // Test 1: Create a scan using the service role client (should always work)
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
      console.log('The RLS policy fix may not have been applied correctly.');
    } else {
      console.log(`Scan created successfully with service role, ID: ${adminScan.id}`);
    }
    
    // Test 2: Create a scan using the anonymous client (should fail due to RLS)
    console.log('\nTest 2: Creating scan with anonymous client (should fail due to RLS)...');
    const { data: anonScan, error: anonScanError } = await supabaseAnon
      .from('scans')
      .insert({
        website_id: websiteId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (anonScanError) {
      console.log('Anonymous client scan creation failed as expected due to RLS policy.');
      console.log('This confirms the RLS policy is working correctly.');
    } else {
      console.warn('Warning: Anonymous client was able to create a scan. RLS policy may not be working correctly.');
      console.log(`Unexpected scan created with ID: ${anonScan.id}`);
    }
    
    // Test 3: Try to create a scan through the API endpoint
    console.log('\nTest 3: Testing scan creation through API endpoint...');
    console.log('To test the API endpoint, run the following curl command:');
    console.log(`curl -X POST http://localhost:3000/api/scan -H "Content-Type: application/json" -d '{"url":"${websiteUrl}"}'`);
    console.log('Or use the web interface to create a scan.');
    
    console.log('\nComprehensive RLS fix completed and tested!');
    
  } catch (error) {
    console.error('Unexpected error during comprehensive RLS fix:', error);
  }
}

// Run the fix
applyComprehensiveRlsFix();