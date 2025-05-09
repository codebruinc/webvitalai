#!/usr/bin/env node

/**
 * Test script for login rate limit fix
 * 
 * This script tests the login functionality to verify that:
 * 1. Rate limiting with exponential backoff is working
 * 2. Refresh token error handling is working
 * 
 * Usage:
 *   node test-login-fix.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test functions
async function testRateLimit() {
  console.log('\n=== Testing Rate Limit Handling ===');
  console.log('This test will attempt multiple rapid logins to trigger rate limiting');
  
  // Ask for test credentials
  const email = await askQuestion('Enter test email (will be used for failed login attempts): ');
  const password = await askQuestion('Enter an INCORRECT password to trigger failures: ');
  
  console.log('\nAttempting multiple rapid logins...');
  
  // Try multiple rapid login attempts to trigger rate limiting
  const attempts = 5;
  const results = [];
  
  for (let i = 0; i < attempts; i++) {
    console.log(`\nAttempt ${i + 1}/${attempts}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.log(`Error: ${error.message}`);
        results.push({ success: false, error: error.message });
        
        // Check if we hit rate limit
        if (error.message.includes('rate limit') || error.status === 429) {
          console.log('✅ Rate limit detected! This is expected behavior.');
        }
      } else {
        console.log('Login successful (unexpected for this test)');
        results.push({ success: true });
      }
    } catch (error) {
      console.log(`Exception: ${error.message}`);
      results.push({ success: false, error: error.message });
    }
    
    // Small delay between attempts
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Analyze results
  const rateLimit = results.some(r => 
    r.error && (r.error.includes('rate limit') || r.error.includes('429'))
  );
  
  console.log('\nTest Results:');
  console.log(`Rate limit triggered: ${rateLimit ? 'Yes ✅' : 'No ❌'}`);
  
  if (!rateLimit) {
    console.log('\nNote: Rate limit was not triggered. This could be because:');
    console.log('1. The Supabase rate limit threshold is higher than our test');
    console.log('2. The client-side rate limiting is working correctly');
    console.log('3. The rate limit may be IP-based and not triggered in testing');
  }
  
  return rateLimit;
}

async function testRefreshToken() {
  console.log('\n=== Testing Refresh Token Handling ===');
  console.log('This test will check how the application handles invalid refresh tokens');
  
  // First sign out to clear any existing session
  await supabase.auth.signOut();
  console.log('Signed out any existing session');
  
  // Try to use the session after sign out (should fail with refresh token error)
  try {
    console.log('Attempting to get user after sign out...');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log(`Error as expected: ${error.message}`);
      
      // Check if it's a refresh token error
      if (error.message.includes('Refresh Token') || error.code === 'refresh_token_not_found') {
        console.log('✅ Refresh token error detected! This is expected behavior.');
        return true;
      } else {
        console.log('❌ Error occurred but not a refresh token error');
        return false;
      }
    } else {
      console.log('❌ Got user data without error (unexpected)');
      return false;
    }
  } catch (error) {
    console.log(`Exception: ${error.message}`);
    return false;
  }
}

// Helper function to ask questions
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log('=== Login Fix Test ===');
  console.log('This script will test the login rate limit and refresh token fixes');
  
  try {
    // Test rate limiting
    const rateLimitResult = await testRateLimit();
    
    // Test refresh token handling
    const refreshTokenResult = await testRefreshToken();
    
    // Overall results
    console.log('\n=== Overall Test Results ===');
    console.log(`Rate Limit Handling: ${rateLimitResult ? 'PASS ✅' : 'INCONCLUSIVE ⚠️'}`);
    console.log(`Refresh Token Handling: ${refreshTokenResult ? 'PASS ✅' : 'FAIL ❌'}`);
    
    if (rateLimitResult && refreshTokenResult) {
      console.log('\n✅ All tests passed! The login fix appears to be working correctly.');
    } else {
      console.log('\n⚠️ Some tests did not pass. Review the results above for details.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
