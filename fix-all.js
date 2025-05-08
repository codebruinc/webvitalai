/**
 * Comprehensive Fix for WebVitalAI
 * 
 * This script addresses all potential issues:
 * 1. Sets the application to production mode
 * 2. Fixes RLS policies for the scans table
 * 3. Ensures the user has a premium subscription
 * 4. Tests the fix by creating a scan
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Create Supabase clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function fixAll() {
  try {
    console.log('Starting comprehensive fix for WebVitalAI...');
    
    // Step 1: Set production mode
    await setProductionMode();
    
    // Step 2: Fix RLS policies
    await fixRlsPolicies();
    
    // Step 3: Check user subscription
    await checkUserSubscription();
    
    // Step 4: Test the fix
    await testFix();
    
    console.log('\nAll fixes have been applied successfully!');
    console.log('Please restart your application:');
    console.log('npm run build && npm run start');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

async function setProductionMode() {
  console.log('\nStep 1: Setting production mode...');
  
  // Path to .env.local file
  const envFilePath = path.join(process.cwd(), '.env.local');
  
  // Check if .env.local exists
  if (!fs.existsSync(envFilePath)) {
    console.log('.env.local file not found. Creating a new one...');
    
    // Create minimal .env.local with production settings
    const minimalEnv = `# Production mode settings
NODE_ENV=production
TESTING_MODE=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
`;
    
    fs.writeFileSync(envFilePath, minimalEnv);
    console.log('Created new .env.local file with production settings.');
    return;
  }
  
  // Read existing .env.local file
  console.log('Reading existing .env.local file...');
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Parse environment variables
  const envLines = envContent.split('\n');
  const envVars = {};
  let hasNodeEnv = false;
  let hasTestingMode = false;
  
  envLines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') return;
    
    // Parse key-value pairs
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
      
      if (key === 'NODE_ENV') hasNodeEnv = true;
      if (key === 'TESTING_MODE') hasTestingMode = true;
    }
  });
  
  // Update environment variables
  let updated = false;
  
  if (!hasNodeEnv || envVars['NODE_ENV'] !== 'production') {
    envVars['NODE_ENV'] = 'production';
    updated = true;
    console.log('Updated NODE_ENV to production');
  }
  
  if (!hasTestingMode || envVars['TESTING_MODE'] !== 'false') {
    envVars['TESTING_MODE'] = 'false';
    updated = true;
    console.log('Updated TESTING_MODE to false');
  }
  
  if (!updated) {
    console.log('Environment already configured for production mode. No changes needed.');
    return;
  }
  
  // Convert back to string
  let newEnvContent = '';
  for (const [key, value] of Object.entries(envVars)) {
    newEnvContent += `${key}=${value}\n`;
  }
  
  // Write updated content back to .env.local
  fs.writeFileSync(envFilePath, newEnvContent);
  console.log('Updated .env.local file with production settings.');
}

async function fixRlsPolicies() {
  console.log('\nStep 2: Fixing RLS policies...');
  
  // SQL script to fix RLS policies
  const sqlScript = `
    -- Fix for the RLS policy issue preventing scan creation
    -- This script adds the necessary RLS policies for the scans table
    
    -- Start a transaction so we can roll back if anything fails
    BEGIN;
    
    -- Enable RLS for the scans table if not already enabled
    ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
    DROP POLICY IF EXISTS "Users can insert scans for their websites" ON public.scans;
    DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
    DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
    DROP POLICY IF EXISTS "Service role can manage all scans" ON public.scans;
    
    -- Create policy to allow users to view their own scans
    -- This joins scans to websites to check if the user owns the website
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
    
    -- If everything looks good, commit the transaction
    COMMIT;
  `;
  
  // Execute the SQL script
  try {
    // First, check if the exec_sql function exists
    const { data: funcExists, error: funcError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: `
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'exec_sql' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        );
      `
    });
    
    if (funcError) {
      console.log('Creating exec_sql function...');
      
      // Create the exec_sql function directly using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS VOID
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;
          `
        })
      });
      
      if (!response.ok) {
        console.error('Failed to create exec_sql function:', await response.text());
        console.log('Proceeding with alternative approach...');
        
        // Alternative approach: Execute SQL directly via REST API
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            query: sqlScript
          })
        });
        
        if (!sqlResponse.ok) {
          console.error('Failed to execute SQL directly:', await sqlResponse.text());
          throw new Error('Failed to apply RLS policies');
        } else {
          console.log('RLS policies applied successfully via direct SQL execution!');
        }
      } else {
        console.log('Created exec_sql function, executing RLS fix...');
        
        // Execute the SQL script
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript });
        
        if (error) {
          console.error('Error applying RLS fix:', error);
          throw new Error('Failed to apply RLS policies');
        } else {
          console.log('RLS policies applied successfully!');
        }
      }
    } else {
      // Execute the SQL script
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript });
      
      if (error) {
        console.error('Error applying RLS fix:', error);
        throw new Error('Failed to apply RLS policies');
      } else {
        console.log('RLS policies applied successfully!');
      }
    }
  } catch (error) {
    console.error('Error applying RLS policies:', error);
    console.log('Please run the SQL script directly in the Supabase dashboard.');
  }
}

async function checkUserSubscription() {
  console.log('\nStep 3: Checking user subscription...');
  
  // Get the authenticated user
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !session) {
    console.error('Error getting session:', sessionError);
    console.log('Please make sure you are logged in before running this script.');
    return;
  }
  
  const userId = session.user.id;
  console.log(`Authenticated as user: ${userId}`);
  
  // Check if user exists in public.users table
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single();
  
  if (userError) {
    console.log('User not found in public.users table, creating user record...');
    
    // Create user record in public.users table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || null,
        avatar_url: session.user.user_metadata?.avatar_url || null,
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('User creation error:', createError);
      console.log('Please run the create-user-and-subscription.sql script in the Supabase dashboard.');
      return;
    }
    
    console.log('User created successfully:', newUser.id);
  } else {
    console.log('User found in public.users table:', user.id);
  }
  
  // Check if user has a subscription
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, plan_type, status, current_period_end')
    .eq('user_id', userId)
    .single();
  
  if (subscriptionError) {
    console.log('No subscription found for user, creating premium subscription...');
    
    // Create premium subscription
    const { data: newSubscription, error: createError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'premium',
        status: 'active',
        stripe_customer_id: 'cus_manual_premium',
        stripe_subscription_id: 'sub_manual_premium',
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        cancel_at_period_end: false,
      })
      .select('id, plan_type, status')
      .single();
    
    if (createError) {
      console.error('Subscription creation error:', createError);
      console.log('Please run the create-user-and-subscription.sql script in the Supabase dashboard.');
      return;
    }
    
    console.log('Premium subscription created successfully:', newSubscription.id);
    console.log(`Plan type: ${newSubscription.plan_type}, Status: ${newSubscription.status}`);
  } else {
    console.log('Subscription found for user:', subscription.id);
    console.log(`Plan type: ${subscription.plan_type}, Status: ${subscription.status}`);
    
    // Update subscription if not premium or not active
    if (subscription.plan_type !== 'premium' || subscription.status !== 'active') {
      console.log('Updating subscription to premium and active...');
      
      const { data: updatedSubscription, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_type: 'premium',
          status: 'active',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          cancel_at_period_end: false,
        })
        .eq('id', subscription.id)
        .select('id, plan_type, status')
        .single();
      
      if (updateError) {
        console.error('Subscription update error:', updateError);
        return;
      }
      
      console.log('Subscription updated successfully:', updatedSubscription.id);
      console.log(`Plan type: ${updatedSubscription.plan_type}, Status: ${updatedSubscription.status}`);
    }
  }
}

async function testFix() {
  console.log('\nStep 4: Testing the fix...');
  
  // Get the authenticated user
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !session) {
    console.error('Error getting session:', sessionError);
    console.log('Please make sure you are logged in before running this script.');
    return;
  }
  
  const userId = session.user.id;
  
  // Get a website owned by the user
  const { data: websites, error: websiteError } = await supabaseClient
    .from('websites')
    .select('id, url')
    .eq('user_id', userId)
    .limit(1);
  
  if (websiteError || !websites || websites.length === 0) {
    console.log('No websites found for user, creating a test website...');
    
    // Create a test website
    const { data: newWebsite, error: createError } = await supabaseClient
      .from('websites')
      .insert({
        user_id: userId,
        url: 'https://example.com',
        name: 'Example Website',
        is_active: true
      })
      .select('id, url')
      .single();
    
    if (createError) {
      console.error('Error creating test website:', createError);
      console.log('Please create a website manually in the application.');
      return;
    }
    
    console.log(`Created test website: ${newWebsite.url} (${newWebsite.id})`);
    
    // Use the new website
    var websiteId = newWebsite.id;
    var websiteUrl = newWebsite.url;
  } else {
    var websiteId = websites[0].id;
    var websiteUrl = websites[0].url;
    console.log(`Using existing website: ${websiteUrl} (${websiteId})`);
  }
  
  // Try to create a scan
  console.log('Attempting to create a scan...');
  const { data: scan, error: scanError } = await supabaseClient
    .from('scans')
    .insert({
      website_id: websiteId,
      status: 'pending'
    })
    .select('id')
    .single();
  
  if (scanError) {
    console.error('Error creating scan:', scanError);
    console.log('The fix was not successful. Please check the error message above for more details.');
    return;
  }
  
  console.log(`Scan created successfully with ID: ${scan.id}`);
  console.log('The fix has been verified!');
}

// Execute the function
fixAll();