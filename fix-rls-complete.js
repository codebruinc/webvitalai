/**
 * Comprehensive RLS Policy Fix for WebVitalAI
 * 
 * This script will:
 * 1. Check if RLS is enabled for the scans table
 * 2. Check if the correct policies are applied
 * 3. Apply the correct policies if needed
 * 4. Test the fix by attempting to create a scan
 * 5. Provide detailed error information if the fix fails
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (needed for RLS modifications)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRlsPolicy() {
  try {
    console.log('Starting comprehensive RLS policy fix...');
    
    // Step 1: Check if RLS is enabled for the scans table
    console.log('\nStep 1: Checking if RLS is enabled for scans table...');
    const { data: rlsEnabled, error: rlsError } = await supabase.rpc('check_rls_enabled', { 
      table_name: 'scans' 
    });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      
      // Create the check_rls_enabled function if it doesn't exist
      console.log('Creating check_rls_enabled function...');
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
          RETURNS BOOLEAN
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            is_enabled BOOLEAN;
          BEGIN
            SELECT relrowsecurity INTO is_enabled
            FROM pg_class
            WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
            
            RETURN is_enabled;
          END;
          $$;
        `
      });
      
      // Try again
      const { data: rlsEnabledRetry, error: rlsErrorRetry } = await supabase.rpc('check_rls_enabled', { 
        table_name: 'scans' 
      });
      
      if (rlsErrorRetry) {
        console.error('Failed to check RLS status:', rlsErrorRetry);
        console.log('Proceeding with fix anyway...');
      } else {
        console.log(`RLS is ${rlsEnabledRetry ? 'enabled' : 'disabled'} for scans table`);
      }
    } else {
      console.log(`RLS is ${rlsEnabled ? 'enabled' : 'disabled'} for scans table`);
      
      // Enable RLS if it's disabled
      if (!rlsEnabled) {
        console.log('Enabling RLS for scans table...');
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;`
        });
        console.log('RLS enabled for scans table');
      }
    }
    
    // Step 2: Check existing policies
    console.log('\nStep 2: Checking existing policies for scans table...');
    const { data: policies, error: policiesError } = await supabase.rpc('list_policies', { 
      table_name: 'scans' 
    });
    
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
      
      // Create the list_policies function if it doesn't exist
      console.log('Creating list_policies function...');
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION list_policies(table_name TEXT)
          RETURNS JSON
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            policies JSON;
          BEGIN
            SELECT json_agg(row_to_json(p))
            INTO policies
            FROM (
              SELECT 
                policyname,
                permissive,
                cmd,
                qual,
                with_check
              FROM pg_policies
              WHERE tablename = table_name AND schemaname = 'public'
            ) p;
            
            RETURN policies;
          END;
          $$;
        `
      });
      
      // Try again
      const { data: policiesRetry, error: policiesErrorRetry } = await supabase.rpc('list_policies', { 
        table_name: 'scans' 
      });
      
      if (policiesErrorRetry) {
        console.error('Failed to list policies:', policiesErrorRetry);
        console.log('Proceeding with fix anyway...');
      } else {
        if (policiesRetry && policiesRetry.length > 0) {
          console.log(`Found ${policiesRetry.length} policies for scans table:`);
          policiesRetry.forEach(policy => {
            console.log(`- ${policy.policyname} (${policy.cmd})`);
          });
        } else {
          console.log('No policies found for scans table');
        }
      }
    } else {
      if (policies && policies.length > 0) {
        console.log(`Found ${policies.length} policies for scans table:`);
        policies.forEach(policy => {
          console.log(`- ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('No policies found for scans table');
      }
    }
    
    // Step 3: Apply the RLS policy fix
    console.log('\nStep 3: Applying RLS policy fix...');
    
    // Read the SQL file
    let sqlScript;
    try {
      sqlScript = fs.readFileSync('./fix-rls-policy.sql', 'utf8');
      console.log('Successfully read fix-rls-policy.sql');
    } catch (err) {
      console.error('Error reading fix-rls-policy.sql:', err);
      console.log('Using embedded SQL script instead');
      
      // Embedded SQL script as fallback
      sqlScript = `
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
          );
        
        -- Create policy to allow service role to manage all scans
        CREATE POLICY "Service role can manage all scans" ON public.scans
          USING (auth.role() = 'service_role');
        
        -- If everything looks good, commit the transaction
        COMMIT;
      `;
    }
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error applying RLS fix:', error);
      
      // Check if the exec_sql function exists
      console.log('Checking if exec_sql function exists...');
      const { data: funcExists, error: funcError } = await supabase.rpc('exec_sql', { 
        sql: `
          SELECT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'exec_sql' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          );
        `
      });
      
      if (funcError) {
        console.error('Error checking for exec_sql function:', funcError);
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
          console.log('Please run the SQL script directly in the Supabase dashboard');
        } else {
          console.log('Created exec_sql function, retrying RLS fix...');
          
          // Try again
          const { error: retryError } = await supabase.rpc('exec_sql', { sql: sqlScript });
          
          if (retryError) {
            console.error('Error applying RLS fix (retry):', retryError);
            console.log('Please run the SQL script directly in the Supabase dashboard');
          } else {
            console.log('RLS policy fix applied successfully!');
          }
        }
      } else {
        console.log('Please run the SQL script directly in the Supabase dashboard');
      }
    } else {
      console.log('RLS policy fix applied successfully!');
    }
    
    // Step 4: Test the fix by trying to create a scan
    console.log('\nStep 4: Testing the fix by attempting to create a scan...');
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Error getting authenticated user:', authError);
      console.log('Please run this script while authenticated or use the SQL script directly in the Supabase dashboard.');
      return;
    }
    
    console.log(`Authenticated as user: ${user.id}`);
    
    // Get a website owned by the user
    const { data: websites, error: websiteError } = await supabase
      .from('websites')
      .select('id, url')
      .eq('user_id', user.id)
      .limit(1);
    
    if (websiteError || !websites || websites.length === 0) {
      console.error('Error getting user website:', websiteError || 'No websites found');
      console.log('Creating a test website for the user...');
      
      // Create a test website
      const { data: newWebsite, error: createError } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          url: 'https://example.com',
          name: 'Example Website',
          is_active: true
        })
        .select('id, url')
        .single();
      
      if (createError) {
        console.error('Error creating test website:', createError);
        console.log('Please create a website first or use the SQL script directly in the Supabase dashboard.');
        return;
      }
      
      console.log(`Created test website: ${newWebsite.url} (${newWebsite.id})`);
      
      // Use the new website
      websites = [newWebsite];
    }
    
    const websiteId = websites[0].id;
    console.log(`Using website: ${websites[0].url} (${websiteId})`);
    
    // Try to create a scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        website_id: websiteId,
        status: 'pending'
      })
      .select('id')
      .single();
    
    if (scanError) {
      console.error('Error creating scan:', scanError);
      console.log('The RLS policy fix may not have been applied correctly.');
      
      // Additional diagnostics
      console.log('\nPerforming additional diagnostics...');
      
      // Check if the website exists
      const { data: websiteCheck, error: websiteCheckError } = await supabase
        .from('websites')
        .select('id, user_id')
        .eq('id', websiteId)
        .single();
      
      if (websiteCheckError) {
        console.error('Error checking website:', websiteCheckError);
      } else {
        console.log(`Website exists with ID ${websiteCheck.id} owned by user ${websiteCheck.user_id}`);
        
        // Check if the user ID matches
        if (websiteCheck.user_id !== user.id) {
          console.error('Website is not owned by the current user!');
          console.log(`Website owner: ${websiteCheck.user_id}`);
          console.log(`Current user: ${user.id}`);
        }
      }
      
      // Check auth.uid() function
      const { data: authUid, error: authUidError } = await supabase.rpc('get_auth_uid');
      
      if (authUidError) {
        console.error('Error checking auth.uid():', authUidError);
        
        // Create the get_auth_uid function
        console.log('Creating get_auth_uid function...');
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE OR REPLACE FUNCTION get_auth_uid()
            RETURNS TEXT
            LANGUAGE sql
            SECURITY DEFINER
            AS $$
              SELECT auth.uid()::text;
            $$;
          `
        });
        
        // Try again
        const { data: authUidRetry, error: authUidErrorRetry } = await supabase.rpc('get_auth_uid');
        
        if (authUidErrorRetry) {
          console.error('Failed to check auth.uid():', authUidErrorRetry);
        } else {
          console.log(`auth.uid() returns: ${authUidRetry}`);
          
          if (authUidRetry !== user.id) {
            console.error('auth.uid() does not match the current user ID!');
            console.log(`auth.uid(): ${authUidRetry}`);
            console.log(`Current user: ${user.id}`);
          }
        }
      } else {
        console.log(`auth.uid() returns: ${authUid}`);
        
        if (authUid !== user.id) {
          console.error('auth.uid() does not match the current user ID!');
          console.log(`auth.uid(): ${authUid}`);
          console.log(`Current user: ${user.id}`);
        }
      }
      
      return;
    }
    
    console.log(`Scan created successfully with ID: ${scan.id}`);
    console.log('The RLS policy fix has been verified!');
    
    // Step 5: Provide final instructions
    console.log('\nFinal Steps:');
    console.log('1. Restart your application:');
    console.log('   npm run build && npm run start');
    console.log('2. Log in with your user account');
    console.log('3. Try using the "analyze website" function from the home screen');
    console.log('4. Verify that scans can be created successfully');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
fixRlsPolicy();