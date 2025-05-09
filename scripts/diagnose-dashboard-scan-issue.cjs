// scripts/diagnose-dashboard-scan-issue.cjs
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://kittwppxvfbvwyyklwrn.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHR3cHB4dmZidnd5eWtsd3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM1MTA2MCwiZXhwIjoyMDYxOTI3MDYwfQ.xMpqh49iPpe5tnbgeX9H5tt6MKszqCfDsqoVhwo1FzI';

console.log('Using Supabase URL:', supabaseUrl);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  // Add required headers to prevent 406 errors
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

/**
 * Diagnose the dashboard scan issue by comparing website IDs in the dashboard with scan data
 */
async function diagnoseDashboardScanIssue() {
  console.log('Starting dashboard scan issue diagnosis...');
  
  try {
    // Step 1: Get all websites
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, url, name, user_id')
      .order('created_at', { ascending: false });
      
    if (websitesError) {
      console.error('❌ Error fetching websites:', websitesError);
      return;
    }
    
    console.log(`Found ${websites.length} websites in the database`);
    
    // Step 2: For each website, check if there are scans
    for (const website of websites) {
      console.log(`\nChecking website: ${website.name} (${website.url})`);
      console.log(`- Website ID: ${website.id}`);
      console.log(`- User ID: ${website.user_id}`);
      
      // Get scans for this website
      const { data: scans, error: scansError } = await supabase
        .from('scans')
        .select('id, status, created_at')
        .eq('website_id', website.id)
        .order('created_at', { ascending: false });
        
      if (scansError) {
        console.error(`❌ Error fetching scans for website ${website.id}:`, scansError);
        continue;
      }
      
      if (!scans || scans.length === 0) {
        console.log(`- No scans found for this website`);
        continue;
      }
      
      console.log(`- Found ${scans.length} scans for this website`);
      
      // Show details of the most recent scan
      const latestScan = scans[0];
      console.log(`- Latest scan: ${latestScan.id}`);
      console.log(`  - Status: ${latestScan.status}`);
      console.log(`  - Created: ${new Date(latestScan.created_at).toLocaleString()}`);
      
      // If the scan is completed, check for metrics
      if (latestScan.status === 'completed') {
        const { data: metrics, error: metricsError } = await supabase
          .from('metrics')
          .select('name, value')
          .eq('scan_id', latestScan.id)
          .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);
          
        if (metricsError) {
          console.error(`❌ Error fetching metrics for scan ${latestScan.id}:`, metricsError);
          continue;
        }
        
        if (!metrics || metrics.length === 0) {
          console.log(`  - No metrics found for this scan`);
          continue;
        }
        
        console.log(`  - Found ${metrics.length} metrics for this scan`);
        metrics.forEach(metric => {
          console.log(`    - ${metric.name}: ${metric.value}`);
        });
      }
    }
    
    // Step 3: Check for any website ID mismatches
    console.log('\n=== Checking for Website ID Mismatches ===');
    
    const { data: scans, error: scansError } = await supabase
      .from('scans')
      .select('id, website_id, status, created_at')
      .order('created_at', { ascending: false });
      
    if (scansError) {
      console.error('❌ Error fetching all scans:', scansError);
      return;
    }
    
    console.log(`Found ${scans.length} total scans in the database`);
    
    // Create a set of all website IDs
    const websiteIds = new Set(websites.map(website => website.id));
    
    // Check for scans with website IDs that don't match any website
    const orphanedScans = scans.filter(scan => !websiteIds.has(scan.website_id));
    
    if (orphanedScans.length > 0) {
      console.log(`\n⚠️ Found ${orphanedScans.length} scans with website IDs that don't match any website`);
      orphanedScans.forEach(scan => {
        console.log(`- Scan ID: ${scan.id}`);
        console.log(`  - Website ID: ${scan.website_id} (NOT FOUND IN WEBSITES TABLE)`);
        console.log(`  - Status: ${scan.status}`);
        console.log(`  - Created: ${new Date(scan.created_at).toLocaleString()}`);
      });
    } else {
      console.log('✅ All scans have valid website IDs');
    }
    
    // Step 4: Check for any user ID mismatches
    console.log('\n=== Checking for User ID Mismatches ===');
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users in the database`);
    
    // Create a set of all user IDs
    const userIds = new Set(users.map(user => user.id));
    
    // Check for websites with user IDs that don't match any user
    const orphanedWebsites = websites.filter(website => !userIds.has(website.user_id));
    
    if (orphanedWebsites.length > 0) {
      console.log(`\n⚠️ Found ${orphanedWebsites.length} websites with user IDs that don't match any user`);
      orphanedWebsites.forEach(website => {
        console.log(`- Website: ${website.name} (${website.url})`);
        console.log(`  - Website ID: ${website.id}`);
        console.log(`  - User ID: ${website.user_id} (NOT FOUND IN USERS TABLE)`);
      });
    } else {
      console.log('✅ All websites have valid user IDs');
    }
    
    console.log('\n=== Diagnosis Complete ===');
    console.log('Check the logs above for any issues that might be causing the dashboard scan display problem.');
    
  } catch (err) {
    console.error('❌ Unexpected error in diagnoseDashboardScanIssue:', err);
  }
}

// Run the diagnosis
diagnoseDashboardScanIssue().catch(err => {
  console.error('Script failed with error:', err);
  process.exit(1);
});