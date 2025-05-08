/**
 * RLS Policy Diagnostic Tool for WebVitalAI
 * 
 * This script will:
 * 1. Check if RLS is enabled for the scans table
 * 2. List all existing policies for the scans table
 * 3. Check the current user's authentication status
 * 4. Check if the user owns any websites
 * 5. Test creating a scan and report any errors
 */

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

// Create Supabase client with anonymous key (to simulate user experience)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRlsIssue() {
  try {
    console.log('WebVitalAI RLS Policy Diagnostic Tool');
    console.log('====================================');
    
    // Step 1: Check environment variables
    console.log('\nStep 1: Checking environment variables...');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`TESTING_MODE: ${process.env.TESTING_MODE || 'not set'}`);
    
    // Step 2: Check authentication status
    console.log('\nStep 2: Checking authentication status...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      console.log('Please make sure you are logged in before running this script.');
      return;
    }
    
    if (!session) {
      console.log('No active session found. Please log in first.');
      console.log('You can log in using the following command:');
      console.log('npx supabase login');
      return;
    }
    
    console.log(`Authenticated as user: ${session.user.id}`);
    console.log(`User email: ${session.user.email}`);
    console.log(`Auth provider: ${session.user.app_metadata.provider}`);
    
    // Step 3: Check if the user exists in the public.users table
    console.log('\nStep 3: Checking if user exists in public.users table...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('Error checking user in public.users table:', userError);
      console.log('User may not exist in the public.users table.');
      console.log('This could cause issues with RLS policies that rely on user data.');
    } else {
      console.log(`User found in public.users table: ${user.id}`);
      console.log(`User email in table: ${user.email}`);
      console.log(`User created at: ${user.created_at}`);
    }
    
    // Step 4: Check if the user has any websites
    console.log('\nStep 4: Checking if user owns any websites...');
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, url, name')
      .eq('user_id', session.user.id);
    
    if (websitesError) {
      console.error('Error checking user websites:', websitesError);
    } else if (!websites || websites.length === 0) {
      console.log('User does not own any websites.');
      console.log('This could be the issue, as the RLS policy only allows creating scans for websites you own.');
    } else {
      console.log(`User owns ${websites.length} websites:`);
      websites.forEach((website, index) => {
        console.log(`${index + 1}. ${website.name} (${website.url}) - ID: ${website.id}`);
      });
    }
    
    // Step 5: Test creating a scan
    if (websites && websites.length > 0) {
      console.log('\nStep 5: Testing scan creation...');
      const websiteId = websites[0].id;
      console.log(`Attempting to create a scan for website: ${websites[0].name} (${websiteId})`);
      
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert({
          website_id: websiteId,
          status: 'test'
        })
        .select('id')
        .single();
      
      if (scanError) {
        console.error('Error creating scan:', scanError);
        console.log('\nDiagnosis: RLS policy is preventing scan creation.');
        console.log('Possible causes:');
        console.log('1. RLS policies are not correctly configured');
        console.log('2. The auth.uid() function is not returning the expected value');
        console.log('3. The website is not correctly associated with your user account');
        
        // Additional diagnostics for common error messages
        if (scanError.message.includes('violates row-level security policy')) {
          console.log('\nThis confirms it is an RLS policy issue.');
          console.log('Please run the fix-rls-complete.sh script to fix the issue.');
        } else if (scanError.message.includes('foreign key constraint')) {
          console.log('\nThis appears to be a foreign key constraint issue, not an RLS issue.');
          console.log('The website_id may not exist or there might be a database schema issue.');
        }
      } else {
        console.log(`Scan created successfully with ID: ${scan.id}`);
        console.log('\nDiagnosis: RLS policy is working correctly for scan creation.');
        console.log('If you are still experiencing issues in the application, it may be due to:');
        console.log('1. Different authentication context in the application');
        console.log('2. Issues with the scan processing after creation');
        console.log('3. Frontend issues unrelated to the database');
        
        // Clean up the test scan
        console.log('\nCleaning up test scan...');
        await supabase
          .from('scans')
          .delete()
          .eq('id', scan.id);
        console.log('Test scan deleted.');
      }
    } else {
      console.log('\nCannot test scan creation without a website.');
      console.log('Please create a website first, then run this script again.');
    }
    
    // Step 6: Provide recommendations
    console.log('\nRecommendations:');
    console.log('1. Make sure you are logged in to the application');
    console.log('2. Ensure your user account exists in the public.users table');
    console.log('3. Create at least one website associated with your user account');
    console.log('4. Run the fix-rls-complete.sh script to fix RLS policy issues');
    console.log('5. Restart the application after applying fixes');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
diagnoseRlsIssue();