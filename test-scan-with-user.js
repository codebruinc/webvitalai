/**
 * Test script for the row-level security policy fix
 * Using provided user credentials
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const testUrl = 'https://example.com';
const apiUrl = 'http://localhost:3000/api/scan';

// User credentials
const email = 'zach.caudill@gmail.com';
const password = 'Sack1375!';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('Starting row-level security policy fix test...');
  
  try {
    // Step 1: Sign in with the provided user
    console.log(`Signing in with user: ${email}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('Authentication successful');
    console.log('User ID:', authData.user.id);
    
    // Step 2: Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Failed to get session');
    }
    
    console.log('Session obtained successfully');
    
    // Step 3: Test the scan API with the authenticated session
    console.log('Testing scan API with authenticated session...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ url: testUrl }),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed: Scan initiated successfully');
      console.log('The row-level security policy fix is working!');
    } else {
      console.log('❌ Test failed: ' + (data.error || 'Unknown error'));
      if (data.error && data.error.includes('row-level security policy')) {
        console.log('The row-level security policy error is still occurring.');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();