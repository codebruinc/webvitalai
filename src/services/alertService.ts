import { supabase } from '@/lib/supabase';

export interface Alert {
  id: string;
  userId: string;
  websiteId: string;
  metricName: string;
  threshold: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
}

export interface AlertTrigger {
  id: string;
  alertId: string;
  scanId: string;
  metricValue: number;
  triggeredAt: string;
  notificationSent: boolean;
}

/**
 * Create a new alert
 * @param userId The user ID
 * @param websiteId The website ID
 * @param metricName The metric name
 * @param threshold The threshold value
 * @param condition The condition ('above' or 'below')
 * @returns The created alert
 */
export async function createAlert(
  userId: string,
  websiteId: string,
  metricName: string,
  threshold: number,
  condition: 'above' | 'below'
): Promise<Alert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      website_id: websiteId,
      metric_name: metricName,
      threshold,
      condition,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    websiteId: data.website_id,
    metricName: data.metric_name,
    threshold: data.threshold,
    condition: data.condition,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

/**
 * Get alerts for a user
 * @param userId The user ID
 * @returns Array of alerts
 */
export async function getUserAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*, websites(url, name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user alerts:', error);
    return [];
  }

  return data.map(alert => ({
    id: alert.id,
    userId: alert.user_id,
    websiteId: alert.website_id,
    metricName: alert.metric_name,
    threshold: alert.threshold,
    condition: alert.condition,
    isActive: alert.is_active,
    createdAt: alert.created_at,
    websiteUrl: (alert.websites as any).url,
    websiteName: (alert.websites as any).name,
  }));
}

/**
 * Update an alert
 * @param alertId The alert ID
 * @param updates The updates to apply
 * @returns Whether the update was successful
 */
export async function updateAlert(
  alertId: string,
  updates: {
    threshold?: number;
    condition?: 'above' | 'below';
    isActive?: boolean;
  }
): Promise<boolean> {
  const updateData: Record<string, any> = {};
  
  if (updates.threshold !== undefined) updateData.threshold = updates.threshold;
  if (updates.condition !== undefined) updateData.condition = updates.condition;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { error } = await supabase
    .from('alerts')
    .update(updateData)
    .eq('id', alertId);

  if (error) {
    console.error('Error updating alert:', error);
    return false;
  }

  return true;
}

/**
 * Delete an alert
 * @param alertId The alert ID
 * @returns Whether the deletion was successful
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    console.error('Error deleting alert:', error);
    return false;
  }

  return true;
}

/**
 * Check alerts for a scan
 * @param scanId The scan ID
 * @returns Array of triggered alerts
 */
export async function checkAlertsForScan(scanId: string): Promise<AlertTrigger[]> {
  // Get the scan
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('id, website_id, websites(user_id)')
    .eq('id', scanId)
    .single();

  if (scanError || !scan) {
    console.error('Error fetching scan:', scanError);
    return [];
  }

  const websiteId = scan.website_id;
  const userId = (scan.websites as any).user_id;

  // Get metrics for the scan
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('name, value, unit, category')
    .eq('scan_id', scanId);

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return [];
  }

  // Get active alerts for the website
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .eq('website_id', websiteId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (alertsError) {
    console.error('Error fetching alerts:', alertsError);
    return [];
  }

  // Check if any alerts are triggered
  const triggeredAlerts: AlertTrigger[] = [];

  for (const alert of alerts) {
    const metric = metrics.find(m => m.name === alert.metric_name);
    
    if (metric) {
      let isTriggered = false;
      
      if (alert.condition === 'above' && metric.value > alert.threshold) {
        isTriggered = true;
      } else if (alert.condition === 'below' && metric.value < alert.threshold) {
        isTriggered = true;
      }
      
      if (isTriggered) {
        // Record the alert trigger
        const { data: trigger, error: triggerError } = await supabase
          .from('alert_triggers')
          .insert({
            alert_id: alert.id,
            scan_id: scanId,
            metric_value: metric.value,
            notification_sent: false,
          })
          .select('*')
          .single();
        
        if (triggerError) {
          console.error('Error recording alert trigger:', triggerError);
        } else {
          triggeredAlerts.push({
            id: trigger.id,
            alertId: trigger.alert_id,
            scanId: trigger.scan_id,
            metricValue: trigger.metric_value,
            triggeredAt: trigger.triggered_at,
            notificationSent: trigger.notification_sent,
          });
        }
      }
    }
  }

  return triggeredAlerts;
}

/**
 * Send notifications for triggered alerts
 * @param triggeredAlerts Array of triggered alerts
 */
export async function sendAlertNotifications(triggeredAlerts: AlertTrigger[]): Promise<void> {
  for (const trigger of triggeredAlerts) {
    // Get alert details
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*, websites(url, name), users(email, name)')
      .eq('id', trigger.alertId)
      .single();

    if (alertError) {
      console.error('Error fetching alert details:', alertError);
      continue;
    }

    // In a real implementation, you would send an email or push notification here
    console.log(`Alert triggered for ${(alert.websites as any).url}: ${alert.metric_name} is ${trigger.metricValue} which is ${alert.condition} threshold ${alert.threshold}`);
    
    // For now, we'll just mark the notification as sent
    const { error: updateError } = await supabase
      .from('alert_triggers')
      .update({ notification_sent: true })
      .eq('id', trigger.id);
    
    if (updateError) {
      console.error('Error updating alert trigger:', updateError);
    }
  }
}

/**
 * Get recent alert triggers for a user
 * @param userId The user ID
 * @param limit The maximum number of triggers to return
 * @returns Array of recent alert triggers
 */
export async function getRecentAlertTriggers(userId: string, limit = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('alert_triggers')
    .select(`
      *,
      alerts(
        metric_name,
        threshold,
        condition,
        websites(url, name)
      ),
      scans(completed_at)
    `)
    .eq('alerts.user_id', userId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching alert triggers:', error);
    return [];
  }

  return data.map(trigger => ({
    id: trigger.id,
    alertId: trigger.alert_id,
    scanId: trigger.scan_id,
    metricValue: trigger.metric_value,
    triggeredAt: trigger.triggered_at,
    notificationSent: trigger.notification_sent,
    metricName: trigger.alerts.metric_name,
    threshold: trigger.alerts.threshold,
    condition: trigger.alerts.condition,
    websiteUrl: trigger.alerts.websites.url,
    websiteName: trigger.alerts.websites.name,
    scanDate: trigger.scans.completed_at,
  }));
}