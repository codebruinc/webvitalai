// Test script to verify scan results can be viewed on the reports page
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Test data
const TEST_USER_UUID = '203c71f3-49f7-450d-85b9-a2ff110facc6';
const TEST_SCAN_IDS = [
  '18550822-3306-4ea0-bbd2-655a0dd7b30d',
  '1c3129b5-ee5a-4ec5-8958-950add1308c6'
];
const TEST_WEBSITE_IDS = [
  '282d7f05-06d8-4836-8d64-dac53845912c',
  '15f062a7-4114-4a40-840c-63f6a9b5e6f5'
];

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Required environment variables are missing.');
  console.error('Please make sure the following variables are set in your .env file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for testing
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

console.log(`Connected to Supabase at ${SUPABASE_URL}`);

async function testReportsView() {
  console.log('Testing reports page scan results view functionality...');
  
  try {
    // 1. Verify the test user exists
    console.log(`Checking if user ${TEST_USER_UUID} exists...`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', TEST_USER_UUID)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }
    
    if (!userData) {
      console.log(`User ${TEST_USER_UUID} not found. Creating test user...`);
      // Create test user if needed
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: TEST_USER_UUID,
          email: 'test@example.com',
          name: 'Test User'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test user:', createError.message);
        return;
      }
      
      console.log('Test user created successfully.');
    } else {
      console.log('Test user exists:', userData.email);
    }
    
    // 2. Verify the test website IDs exist or create them
    for (const websiteId of TEST_WEBSITE_IDS) {
      console.log(`Checking if website ${websiteId} exists...`);
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();
      
      if (websiteError && websiteError.code !== 'PGRST116') {
        console.error(`Error fetching website ${websiteId}:`, websiteError.message);
        continue;
      }
      
      if (!websiteData) {
        console.log(`Website ${websiteId} not found. Creating test website...`);
        // Create test website if needed
        const { data: newWebsite, error: createError } = await supabase
          .from('websites')
          .insert({
            id: websiteId,
            user_id: TEST_USER_UUID,
            url: `https://example-${websiteId.substring(0, 8)}.com`,
            name: `Test Website ${websiteId.substring(0, 8)}`,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`Error creating test website ${websiteId}:`, createError.message);
          continue;
        }
        
        console.log(`Test website ${websiteId} created successfully.`);
      } else {
        console.log(`Website ${websiteId} exists:`, websiteData.url);
        
        // Ensure the website is associated with our test user
        if (websiteData.user_id !== TEST_USER_UUID) {
          console.log(`Updating website ${websiteId} to associate with test user...`);
          const { error: updateError } = await supabase
            .from('websites')
            .update({ user_id: TEST_USER_UUID })
            .eq('id', websiteId);
          
          if (updateError) {
            console.error(`Error updating website ${websiteId}:`, updateError.message);
            continue;
          }
          
          console.log(`Website ${websiteId} updated successfully.`);
        }
      }
    }
    
    // 3. Verify the test scan IDs exist or create them
    for (let i = 0; i < TEST_SCAN_IDS.length; i++) {
      const scanId = TEST_SCAN_IDS[i];
      const websiteId = TEST_WEBSITE_IDS[i % TEST_WEBSITE_IDS.length]; // Use modulo to cycle through website IDs
      
      console.log(`Checking if scan ${scanId} exists...`);
      const { data: scanData, error: scanError } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single();
      
      if (scanError && scanError.code !== 'PGRST116') {
        console.error(`Error fetching scan ${scanId}:`, scanError.message);
        continue;
      }
      
      if (!scanData) {
        console.log(`Scan ${scanId} not found. Creating test scan...`);
        // Create test scan if needed
        const { data: newScan, error: createError } = await supabase
          .from('scans')
          .insert({
            id: scanId,
            website_id: websiteId,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`Error creating test scan ${scanId}:`, createError.message);
          continue;
        }
        
        console.log(`Test scan ${scanId} created successfully.`);
        
        // Create some test metrics for the scan
        const metrics = [
          { scan_id: scanId, name: 'Performance Score', value: 85, category: 'performance' },
          { scan_id: scanId, name: 'Accessibility Score', value: 92, category: 'accessibility' },
          { scan_id: scanId, name: 'SEO Score', value: 88, category: 'seo' },
          { scan_id: scanId, name: 'Security Score', value: 75, category: 'security' }
        ];
        
        const { error: metricsError } = await supabase
          .from('metrics')
          .insert(metrics);
        
        if (metricsError) {
          console.error(`Error creating metrics for scan ${scanId}:`, metricsError.message);
        } else {
          console.log(`Test metrics for scan ${scanId} created successfully.`);
        }
      } else {
        console.log(`Scan ${scanId} exists with status:`, scanData.status);
        
        // Ensure the scan is associated with our test website
        if (scanData.website_id !== websiteId) {
          console.log(`Updating scan ${scanId} to associate with test website...`);
          const { error: updateError } = await supabase
            .from('scans')
            .update({ website_id: websiteId })
            .eq('id', scanId);
          
          if (updateError) {
            console.error(`Error updating scan ${scanId}:`, updateError.message);
            continue;
          }
          
          console.log(`Scan ${scanId} updated successfully.`);
        }
        
        // Check if metrics exist for this scan
        const { data: metricsData, error: metricsError } = await supabase
          .from('metrics')
          .select('*')
          .eq('scan_id', scanId);
        
        if (metricsError) {
          console.error(`Error fetching metrics for scan ${scanId}:`, metricsError.message);
        } else if (!metricsData || metricsData.length === 0) {
          console.log(`No metrics found for scan ${scanId}. Creating test metrics...`);
          
          // Create some test metrics for the scan
          const metrics = [
            { scan_id: scanId, name: 'Performance Score', value: 85, category: 'performance' },
            { scan_id: scanId, name: 'Accessibility Score', value: 92, category: 'accessibility' },
            { scan_id: scanId, name: 'SEO Score', value: 88, category: 'seo' },
            { scan_id: scanId, name: 'Security Score', value: 75, category: 'security' }
          ];
          
          const { error: createMetricsError } = await supabase
            .from('metrics')
            .insert(metrics);
          
          if (createMetricsError) {
            console.error(`Error creating metrics for scan ${scanId}:`, createMetricsError.message);
          } else {
            console.log(`Test metrics for scan ${scanId} created successfully.`);
          }
        } else {
          console.log(`Found ${metricsData.length} metrics for scan ${scanId}.`);
        }
      }
    }
    
    console.log('\nTest setup completed successfully!');
    console.log('\nTo test the reports page:');
    console.log('1. Log in as the test user (or any user with access to the test scans)');
    console.log('2. Navigate to the reports page');
    console.log('3. Verify that the test scans are listed');
    console.log('4. Click the "View" button for a scan to see its results');
    console.log('\nTest scan IDs:');
    TEST_SCAN_IDS.forEach(id => console.log(`- ${id}`));
    
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

testReportsView();