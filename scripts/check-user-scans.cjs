#!/usr/bin/env node

/**
 * Check User Scans Script
 * 
 * This script checks if scans are properly associated with a user's UUID in the database.
 * It helps diagnose issues with the reports page not showing any scans.
 * 
 * Usage:
 * node scripts/check-user-scans.cjs [userId]
 * 
 * If userId is not provided, it will use the test user ID: 203c71f3-49f7-450d-85b9-a2ff110facc6
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test user ID - this should match a real user in your database
const TEST_USER_ID = '203c71f3-49f7-450d-85b9-a2ff110facc6';
const userId = process.argv[2] || TEST_USER_ID;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

const supabaseServiceRole = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    })
  : supabase;

async function checkUserScans() {
  console.log(`Checking scans for user ID: ${userId}`);
  console.log('Using service role client:', !!supabaseServiceRoleKey);
  
  try {
    // Step 1: Check if the user exists
    console.log('\n1. Checking if user exists...');
    const { data: userData, error: userError } = await supabaseServiceRole
      .from('users')
      .select('id, email')
      .eq('id', userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!userData || userData.length === 0) {
      console.log(`User with ID ${userId} not found in the database.`);
      return;
    }
    
    console.log(`User found: ${userData[0].email || 'No email'}`);
    
    // Step 2: Check user's websites
    console.log('\n2. Checking user websites...');
    const { data: websitesData, error: websitesError } = await supabaseServiceRole
      .from('websites')
      .select('id, url, created_at')
      .eq('user_id', userId);
    
    if (websitesError) {
      console.error('Error fetching websites:', websitesError);
      return;
    }
    
    if (!websitesData || websitesData.length === 0) {
      console.log(`No websites found for user ${userId}.`);
      console.log('This could be the issue - the user needs to have websites before they can have scans.');
      return;
    }
    
    console.log(`Found ${websitesData.length} websites for user ${userId}:`);
    websitesData.forEach((website, index) => {
      console.log(`  ${index + 1}. ID: ${website.id}, URL: ${website.url}, Created: ${website.created_at}`);
    });
    
    // Step 3: Check scans for each website
    console.log('\n3. Checking scans for each website...');
    let totalScans = 0;
    
    for (const website of websitesData) {
      const { data: scansData, error: scansError } = await supabaseServiceRole
        .from('scans')
        .select('id, created_at, status')
        .eq('website_id', website.id);
      
      if (scansError) {
        console.error(`Error fetching scans for website ${website.id}:`, scansError);
        continue;
      }
      
      console.log(`Website ${website.url} (${website.id}) has ${scansData?.length || 0} scans.`);
      
      if (scansData && scansData.length > 0) {
        scansData.forEach((scan, index) => {
          if (index < 5) { // Show only the first 5 scans to avoid cluttering the output
            console.log(`  - Scan ID: ${scan.id}, Status: ${scan.status}, Created: ${scan.created_at}`);
          }
        });
        
        if (scansData.length > 5) {
          console.log(`  ... and ${scansData.length - 5} more scans.`);
        }
        
        totalScans += scansData.length;
      }
    }
    
    console.log(`\nTotal scans found for user ${userId}: ${totalScans}`);
    
    // Step 4: Try the query used in the reports page
    console.log('\n4. Testing the reports page query...');
    
    // Service role approach
    console.log('\nService role approach:');
    const { data: serviceRoleData, error: serviceRoleError } = await supabaseServiceRole
      .from('scans')
      .select(`
        id,
        created_at,
        status,
        website_id,
        websites!inner(url, user_id)
      `)
      .eq('websites.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (serviceRoleError) {
      console.error('Service role approach failed:', serviceRoleError);
    } else {
      console.log(`Service role approach found ${serviceRoleData?.length || 0} scans.`);
      
      if (serviceRoleData && serviceRoleData.length > 0) {
        serviceRoleData.slice(0, 3).forEach(scan => {
          console.log(`  - Scan ID: ${scan.id}, Website: ${scan.websites?.url || 'Unknown'}, Created: ${scan.created_at}`);
        });
        
        if (serviceRoleData.length > 3) {
          console.log(`  ... and ${serviceRoleData.length - 3} more scans.`);
        }
      }
    }
    
    // Regular client approach
    console.log('\nRegular client approach:');
    const { data: regularClientData, error: regularClientError } = await supabase
      .from('websites')
      .select(`
        url,
        scans(id, created_at, status)
      `)
      .eq('user_id', userId)
      .order('url');
    
    if (regularClientError) {
      console.error('Regular client approach failed:', regularClientError);
    } else {
      console.log(`Regular client approach found ${regularClientData?.length || 0} websites.`);
      
      let scanCount = 0;
      regularClientData?.forEach(website => {
        if (website.scans && Array.isArray(website.scans)) {
          scanCount += website.scans.length;
        }
      });
      
      console.log(`Total scans found with regular client: ${scanCount}`);
      
      if (regularClientData && regularClientData.length > 0 && scanCount > 0) {
        regularClientData.forEach(website => {
          if (website.scans && Array.isArray(website.scans) && website.scans.length > 0) {
            console.log(`  Website ${website.url} has ${website.scans.length} scans.`);
            website.scans.slice(0, 2).forEach(scan => {
              console.log(`    - Scan ID: ${scan.id}, Status: ${scan.status}, Created: ${scan.created_at}`);
            });
            
            if (website.scans.length > 2) {
              console.log(`    ... and ${website.scans.length - 2} more scans.`);
            }
          }
        });
      }
    }
    
    // Step 5: Check RLS policies
    console.log('\n5. Checking RLS policies...');
    
    // Try to fetch scans directly without any joins
    const { data: directScansData, error: directScansError } = await supabaseServiceRole
      .from('scans')
      .select('*')
      .limit(5);
    
    if (directScansError) {
      console.error('Error fetching direct scans:', directScansError);
    } else {
      console.log(`Direct scans query found ${directScansData?.length || 0} scans.`);
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`User ID: ${userId}`);
    console.log(`Websites: ${websitesData?.length || 0}`);
    console.log(`Total Scans: ${totalScans}`);
    console.log(`Service Role Query Scans: ${serviceRoleData?.length || 0}`);
    console.log(`Regular Client Query Scans: ${scanCount || 0}`);
    
    if (totalScans > 0 && (serviceRoleData?.length === 0 && scanCount === 0)) {
      console.log('\nDIAGNOSIS: Scans exist but queries are not returning them. This suggests an issue with the RLS policies or the query structure.');
      console.log('RECOMMENDATION: Check that the SUPABASE_SERVICE_ROLE_KEY is properly set and that RLS policies are correctly configured.');
    } else if (totalScans === 0) {
      console.log('\nDIAGNOSIS: No scans exist for this user. The user needs to run scans before they will appear on the reports page.');
      console.log('RECOMMENDATION: Run some scans for this user and check that they are being properly associated with the user\'s websites.');
    } else if (serviceRoleData?.length > 0 || scanCount > 0) {
      console.log('\nDIAGNOSIS: Scans exist and queries are returning them. The issue might be in the reports page UI or data transformation.');
      console.log('RECOMMENDATION: Check the reports page code for errors in data handling or UI rendering.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUserScans().catch(console.error);