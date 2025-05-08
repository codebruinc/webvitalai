// test-supabase-client.js
// This script tests the Supabase client initialization and makes a simple query

// Import the Supabase clients
import { supabaseAdmin, supabaseServiceRole } from './src/lib/supabase';

async function testSupabaseClient() {
  console.log('Starting Supabase client test...');
  
  try {
    // Determine which client is being used
    const isUsingServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false;
    console.log(`Using client: ${isUsingServiceRole ? 'service-role' : 'admin-fallback'}`);
    
    // Choose the appropriate client for testing
    const client = supabaseServiceRole;
    
    // Make a simple query to verify the client works
    console.log('Attempting to query the database...');
    const { data, error } = await client
      .from('scans')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error querying database:', error);
      return false;
    }
    
    console.log('Query successful!');
    console.log('Sample data:', data);
    
    return true;
  } catch (error) {
    console.error('Unexpected error during test:', error);
    return false;
  }
}

// Run the test
testSupabaseClient()
  .then(success => {
    if (success) {
      console.log('✅ Supabase client test passed!');
      process.exit(0);
    } else {
      console.log('❌ Supabase client test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  });

// For ES modules compatibility
export {};