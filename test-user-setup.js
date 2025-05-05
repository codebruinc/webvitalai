/**
 * Test script to set up a test user and verify the fix
 */
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

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

async function setupTestUser() {
  console.log('Setting up test user...');
  
  try {
    // Create a test user with a random email
    const testEmail = `test-${Math.floor(Math.random() * 10000)}@example.com`;
    const testPassword = 'Test123456!';
    
    console.log(`Creating test user with email: ${testEmail}`);
    
    // Sign up the test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      throw new Error(`Failed to sign up test user: ${signUpError.message}`);
    }
    
    console.log('Test user created successfully');
    console.log('User ID:', signUpData.user.id);
    
    // Check if the user exists in the database
    console.log('Checking if user exists in the database...');
    
    // Wait a moment for the user to be created in the database
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sign in with the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }
    
    console.log('Test user signed in successfully');
    
    // Get the authenticated client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Failed to get session');
    }
    
    console.log('Session obtained successfully');
    
    // Test creating a website with the authenticated client
    console.log('Testing website creation with authenticated client...');
    
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: signInData.user.id,
        url: 'https://example.com',
        name: 'Example Website',
        is_active: true,
      })
      .select('id')
      .single();
    
    if (websiteError) {
      console.error('Website creation error:', websiteError);
      throw new Error(`Failed to create website: ${websiteError.message}`);
    }
    
    console.log('Website created successfully with ID:', website.id);
    console.log('The fix is working correctly!');
    
    // Return the test user credentials
    return {
      email: testEmail,
      password: testPassword,
      userId: signInData.user.id,
    };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

// Run the setup
setupTestUser()
  .then(user => {
    console.log('\nTest user setup complete. Use these credentials for testing:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`User ID: ${user.userId}`);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });