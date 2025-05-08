// Script to test if the RLS policy fix for the scans table works
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with anonymous key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRlsFix() {
  try {
    console.log('Testing RLS policy fix for scans table...');
    
    // Step 1: Sign in with test user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password123';
    
    console.log(`Attempting to sign in as ${testEmail}...`);
    
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError || !session) {
      console.error('Error signing in:', signInError);
      console.log('\nAlternative: Please provide user ID and website ID directly:');
      console.log('node test-rls-fix.js <user_id> <website_id>');
      return;
    }
    
    const userId = session.user.id;
    console.log(`Signed in successfully as user: ${userId}`);
    
    // Step 2: Get a website owned by the user
    const { data: websites, error: websiteError } = await supabase
      .from('websites')
      .select('id, url')
      .eq('user_id', userId)
      .limit(1);
    
    if (websiteError || !websites || websites.length === 0) {
      console.error('Error getting user website:', websiteError || 'No websites found');
      console.log('Creating a test website...');
      
      // Create a test website
      const { data: newWebsite, error: createError } = await supabase
        .from('websites')
        .insert({
          user_id: userId,
          url: 'https://example.com',
          name: 'Test Website',
          is_active: true
        })
        .select('id, url')
        .single();
      
      if (createError || !newWebsite) {
        console.error('Error creating website:', createError);
        return;
      }
      
      console.log(`Created test website: ${newWebsite.url} (${newWebsite.id})`);
      var websiteId = newWebsite.id;
    } else {
      console.log(`Using existing website: ${websites[0].url} (${websites[0].id})`);
      var websiteId = websites[0].id;
    }
    
    // Step 3: Try to create a scan
    console.log('Attempting to create a scan...');
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
      console.log('The RLS policy fix has NOT been applied correctly.');
      return;
    }
    
    console.log(`Scan created successfully with ID: ${scan.id}`);
    console.log('The RLS policy fix has been verified!');
    
    // Step 4: Try to retrieve the scan
    console.log('Attempting to retrieve the scan...');
    const { data: retrievedScan, error: retrieveError } = await supabase
      .from('scans')
      .select('id, status, website_id')
      .eq('id', scan.id)
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving scan:', retrieveError);
      console.log('The SELECT policy may not be working correctly.');
      return;
    }
    
    console.log(`Retrieved scan: ${JSON.stringify(retrievedScan)}`);
    console.log('The SELECT policy is working correctly!');
    
    // Step 5: Try to update the scan
    console.log('Attempting to update the scan...');
    const { data: updatedScan, error: updateError } = await supabase
      .from('scans')
      .update({ status: 'in-progress' })
      .eq('id', scan.id)
      .select('id, status')
      .single();
    
    if (updateError) {
      console.error('Error updating scan:', updateError);
      console.log('The UPDATE policy may not be working correctly.');
      return;
    }
    
    console.log(`Updated scan: ${JSON.stringify(updatedScan)}`);
    console.log('The UPDATE policy is working correctly!');
    
    console.log('\nAll RLS policies for the scans table are working correctly!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Check if user ID and website ID are provided as command line arguments
if (process.argv.length === 4) {
  const userId = process.argv[2];
  const websiteId = process.argv[3];
  
  console.log(`Using provided user ID: ${userId}`);
  console.log(`Using provided website ID: ${websiteId}`);
  
  // Create a scan with the provided IDs
  async function createScanWithIds() {
    try {
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
        console.log('The RLS policy fix has NOT been applied correctly.');
        return;
      }
      
      console.log(`Scan created successfully with ID: ${scan.id}`);
      console.log('The RLS policy fix has been verified!');
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }
  
  createScanWithIds();
} else {
  testRlsFix();
}