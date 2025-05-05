/**
 * Test script for the row-level security policy fix
 * This simulates a user submitting the URL form in the browser
 */
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Test configuration
const testUrl = 'https://example.com';
const apiUrl = 'http://localhost:3000/api/scan';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('Starting row-level security policy fix test...');
  console.log(`Testing URL: ${testUrl}`);
  
  try {
    // Step 1: Sign in with test user
    console.log('Signing in with test user...');
    
    // You'll need to replace these with valid credentials
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      console.error('Missing test user credentials. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.');
      process.exit(1);
    }
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('Authentication successful');
    
    // Step 2: Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Failed to get session');
    }
    
    // Step 3: Make the API request with the session token
    console.log('Initiating scan with authenticated session...');
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