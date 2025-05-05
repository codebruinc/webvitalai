import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendAlertNotifications } from './alertService';

interface ProcessAlertsResult {
  processed: number;
  sent: number;
}

/**
 * Process alerts for all websites
 * This function is called by the cron job to check for triggered alerts
 * and send notifications
 * 
 * @param supabase Supabase client instance
 * @returns Object with counts of processed and sent alerts
 */
export async function processAlerts(supabase: SupabaseClient): Promise<ProcessAlertsResult> {
  console.log('Processing alerts...');
  
  // Get all websites with active alerts
  const { data: websites, error: websitesError } = await supabase
    .from('websites')
    .select('id, user_id')
    .eq('is_active', true);
  
  if (websitesError) {
    console.error('Error fetching websites:', websitesError);
    throw new Error(`Error fetching websites: ${websitesError.message}`);
  }
  
  console.log(`Found ${websites.length} active websites`);
  
  let processedCount = 0;
  let sentCount = 0;
  
  // For each website, get the latest scan
  for (const website of websites) {
    const { data: latestScan, error: scanError } = await supabase
      .from('scans')
      .select('id')
      .eq('website_id', website.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (scanError) {
      console.log(`No completed scans found for website ${website.id}`);
      continue;
    }
    
    // Get unsent alert triggers for this scan
    const { data: triggers, error: triggersError } = await supabase
      .from('alert_triggers')
      .select('*')
      .eq('scan_id', latestScan.id)
      .eq('notification_sent', false);
    
    if (triggersError) {
      console.error(`Error fetching alert triggers for scan ${latestScan.id}:`, triggersError);
      continue;
    }
    
    processedCount += triggers.length;
    
    if (triggers.length > 0) {
      // Send notifications for triggered alerts
      await sendAlertNotifications(triggers.map(trigger => ({
        id: trigger.id,
        alertId: trigger.alert_id,
        scanId: trigger.scan_id,
        metricValue: trigger.metric_value,
        triggeredAt: trigger.triggered_at,
        notificationSent: trigger.notification_sent,
      })));
      
      sentCount += triggers.length;
    }
  }
  
  console.log(`Processed ${processedCount} alerts, sent ${sentCount} notifications`);
  
  return {
    processed: processedCount,
    sent: sentCount,
  };
}