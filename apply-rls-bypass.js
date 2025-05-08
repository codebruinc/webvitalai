/**
 * This script applies the RLS bypass solution for the WebVitalAI application
 * It creates a database function that can bypass RLS when creating scans
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRlsBypass() {
  console.log('Applying RLS bypass solution...');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-scan-bypass-rls.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      
      // If exec_sql function doesn't exist, try direct SQL execution
      console.log('Trying direct SQL execution...');
      
      // Split the SQL into statements
      const statements = sql
        .replace(/BEGIN;|COMMIT;/g, '')
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('Error executing statement:', error);
          console.log('Statement:', statement);
          
          // Try one more approach - using the REST API directly
          try {
            console.log('Trying REST API for SQL execution...');
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'apikey': supabaseServiceRoleKey
              },
              body: JSON.stringify({ sql: statement })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('REST API error:', errorData);
              throw new Error(`REST API error: ${JSON.stringify(errorData)}`);
            }
            
            console.log('REST API execution successful');
          } catch (restError) {
            console.error('REST API execution failed:', restError);
          }
        } else {
          console.log('Statement executed successfully');
        }
      }
    } else {
      console.log('SQL executed successfully');
    }

    // Verify the function was created
    console.log('Verifying function creation...');
    
    // Try to call the function with a test UUID
    const testUuid = '00000000-0000-0000-0000-000000000000';
    const { data: testResult, error: testError } = await supabase.rpc(
      'create_scan_bypass_rls',
      { website_id_param: testUuid }
    );
    
    if (testError) {
      console.error('Function verification failed:', testError);
      console.log('The function may not have been created correctly.');
      console.log('Please check the Supabase SQL editor for errors.');
    } else {
      console.log('Function verified successfully:', testResult);
      console.log('RLS bypass solution applied successfully!');
    }
    
  } catch (error) {
    console.error('Error applying RLS bypass:', error);
    process.exit(1);
  }
}

// Run the function
applyRlsBypass().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});