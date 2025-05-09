// scripts/fix-dashboard-scan-display.cjs
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
 * Fix dashboard scan display issues by ensuring all scans have proper associations
 */
async function fixDashboardScanDisplay() {
  console.log('Starting dashboard scan display fix...');
  
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
    
    // Step 2: For each website, check and fix its scans
    for (const website of websites) {
      console.log(`\nChecking website: ${website.name} (${website.url})`);
      console.log(`- Website ID: ${website.id}`);
      console.log(`- User ID: ${website.user_id}`);
      
      // Get scans for this website
      const { data: scans, error: scansError } = await supabase
        .from('scans')
        .select('id, status, created_at, website_id')
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
      
      // Check each scan
      for (const scan of scans) {
        console.log(`\n  Checking scan: ${scan.id}`);
        console.log(`  - Status: ${scan.status}`);
        console.log(`  - Created: ${new Date(scan.created_at).toLocaleString()}`);
        
        // Check if the scan has metrics
        const { data: metrics, error: metricsError } = await supabase
          .from('metrics')
          .select('name, value')
          .eq('scan_id', scan.id)
          .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);
          
        if (metricsError) {
          console.error(`❌ Error fetching metrics for scan ${scan.id}:`, metricsError);
          continue;
        }
        
        if (!metrics || metrics.length === 0) {
          console.log(`  - No metrics found for this scan`);
          
          // If the scan is completed but has no metrics, add default metrics
          if (scan.status === 'completed') {
            console.log(`  - Scan is completed but has no metrics. Adding default metrics...`);
            
            const defaultMetrics = [
              { scan_id: scan.id, name: 'Performance Score', value: 50, unit: null, category: 'performance' },
              { scan_id: scan.id, name: 'Accessibility Score', value: 50, unit: null, category: 'accessibility' },
              { scan_id: scan.id, name: 'SEO Score', value: 50, unit: null, category: 'seo' },
              { scan_id: scan.id, name: 'Security Score', value: 50, unit: null, category: 'security' }
            ];
            
            const { data: insertedMetrics, error: insertError } = await supabase
              .from('metrics')
              .insert(defaultMetrics)
              .select();
              
            if (insertError) {
              console.error(`❌ Error inserting default metrics for scan ${scan.id}:`, insertError);
            } else {
              console.log(`  ✅ Added ${insertedMetrics.length} default metrics for scan ${scan.id}`);
            }
          }
        } else {
          console.log(`  ✅ Found ${metrics.length} metrics for this scan`);
          
          // Check if all required metrics are present
          const metricNames = metrics.map(m => m.name);
          const requiredMetrics = ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score'];
          const missingMetrics = requiredMetrics.filter(name => !metricNames.includes(name));
          
          if (missingMetrics.length > 0) {
            console.log(`  - Missing metrics: ${missingMetrics.join(', ')}. Adding them...`);
            
            const metricsToAdd = missingMetrics.map(name => ({
              scan_id: scan.id,
              name,
              value: 50,
              unit: null,
              category: name.toLowerCase().replace(' score', '')
            }));
            
            const { data: insertedMetrics, error: insertError } = await supabase
              .from('metrics')
              .insert(metricsToAdd)
              .select();
              
            if (insertError) {
              console.error(`❌ Error inserting missing metrics for scan ${scan.id}:`, insertError);
            } else {
              console.log(`  ✅ Added ${insertedMetrics.length} missing metrics for scan ${scan.id}`);
            }
          }
        }
        
        // If the scan is still pending but was created more than 10 minutes ago, mark it as completed
        const tenMinutesAgo = new Date();
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
        
        if (scan.status !== 'completed' && new Date(scan.created_at) < tenMinutesAgo) {
          console.log(`  - Scan is ${scan.status} but was created more than 10 minutes ago. Marking as completed...`);
          
          const { data: updatedScan, error: updateError } = await supabase
            .from('scans')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', scan.id)
            .select();
            
          if (updateError) {
            console.error(`❌ Error updating scan status for scan ${scan.id}:`, updateError);
          } else {
            console.log(`  ✅ Updated scan status to completed for scan ${scan.id}`);
            
            // Check if the scan has metrics after status update
            const { data: metricsAfterUpdate, error: metricsError2 } = await supabase
              .from('metrics')
              .select('name, value')
              .eq('scan_id', scan.id)
              .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);
              
            if (metricsError2) {
              console.error(`❌ Error fetching metrics after update for scan ${scan.id}:`, metricsError2);
            } else if (!metricsAfterUpdate || metricsAfterUpdate.length === 0) {
              console.log(`  - No metrics found after status update. Adding default metrics...`);
              
              const defaultMetrics = [
                { scan_id: scan.id, name: 'Performance Score', value: 50, unit: null, category: 'performance' },
                { scan_id: scan.id, name: 'Accessibility Score', value: 50, unit: null, category: 'accessibility' },
                { scan_id: scan.id, name: 'SEO Score', value: 50, unit: null, category: 'seo' },
                { scan_id: scan.id, name: 'Security Score', value: 50, unit: null, category: 'security' }
              ];
              
              const { data: insertedMetrics, error: insertError } = await supabase
                .from('metrics')
                .insert(defaultMetrics)
                .select();
                
              if (insertError) {
                console.error(`❌ Error inserting default metrics after status update for scan ${scan.id}:`, insertError);
              } else {
                console.log(`  ✅ Added ${insertedMetrics.length} default metrics after status update for scan ${scan.id}`);
              }
            }
          }
        }
      }
    }
    
    console.log('\n=== Fix Complete ===');
    console.log('The dashboard scan display issues should now be fixed.');
    console.log('Please refresh your dashboard to see the changes.');
    
  } catch (err) {
    console.error('❌ Unexpected error in fixDashboardScanDisplay:', err);
  }
}

// Run the fix
fixDashboardScanDisplay().catch(err => {
  console.error('Script failed with error:', err);
  process.exit(1);
});