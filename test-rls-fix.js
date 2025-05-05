/**
 * Test script for the row-level security policy fix in initiateScan
 * This directly tests the initiateScan function with different clients
 */
const { createClient } = require('@supabase/supabase-js');
const { initiateScan } = require('./src/services/scanService');

// Test configuration
const testUrl = 'https://example.com';

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
  
  try {
    // Step 1: Sign in with test user
    console.log('Please enter test user credentials:');
    
    // For simplicity, we'll hardcode a test user
    // In a real scenario, you would prompt for these or use environment variables
    const email = 'test@example.com';
    const password = 'testpassword123';
    
    console.log(`Signing in with user: ${email}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('Authentication successful');
    
    // Step 2: Get the user ID
    const userId = authData.user.id;
    console.log(`User ID: ${userId}`);
    
    // Step 3: Test initiateScan with authenticated client
    console.log('\nTesting initiateScan with authenticated client...');
    try {
      const scanId = await initiateScan(testUrl, userId, supabase);
      console.log('✅ Test passed: Scan initiated successfully with authenticated client');
      console.log(`Scan ID: ${scanId}`);
    } catch (error) {
      console.error('❌ Test failed with authenticated client:', error.message);
      if (error.message.includes('row-level security policy')) {
        console.log('The row-level security policy error is still occurring with authenticated client.');
      }
    }
    
    // Step 4: Test initiateScan with global client (should use default parameter)
    console.log('\nTesting initiateScan with global client (default parameter)...');
    try {
      const scanId = await initiateScan(testUrl, userId);
      console.log('✅ Test passed: Scan initiated successfully with global client');
      console.log(`Scan ID: ${scanId}`);
    } catch (error) {
      console.error('❌ Test failed with global client:', error.message);
      if (error.message.includes('row-level security policy')) {
        console.log('The row-level security policy error is still occurring with global client.');
      }
    }
    
    console.log('\nTest summary:');
    console.log('If both tests passed: The fix works correctly for both client types.');
    console.log('If only authenticated client test passed: The fix works, but requires an authenticated client.');
    console.log('If both tests failed: The fix is not working, further investigation needed.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();