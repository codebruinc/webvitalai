import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Get the URL from the request
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Create a Supabase client with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables on server');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('Server: Fetching websites and scans for user:', userId);

    // Fetch websites for the user
    const { data: websitesData, error: websitesError } = await supabase
      .from('websites')
      .select('id, url, name, description, is_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (websitesError) {
      console.error('Server: Error fetching websites:', websitesError);
      return NextResponse.json({ error: websitesError.message }, { status: 500 });
    }

    if (!websitesData || websitesData.length === 0) {
      console.log('Server: No websites found for user:', userId);
      return NextResponse.json({ data: [] });
    }

    console.log(`Server: Found ${websitesData.length} websites for user ${userId}`);

    // Get all website IDs
    const websiteIds = websitesData.map(website => website.id);

    // Fetch the latest scan for each website
    const { data: scansData, error: scansError } = await supabase
      .from('scans')
      .select('id, status, created_at, website_id')
      .in('website_id', websiteIds)
      .order('created_at', { ascending: false });

    if (scansError) {
      console.error('Server: Error fetching scans:', scansError);
      return NextResponse.json({ error: scansError.message }, { status: 500 });
    }

    console.log(`Server: Fetched ${scansData?.length || 0} scans for ${websiteIds.length} websites`);

    // Group scans by website_id and get the latest scan for each website
    const latestScansByWebsite: Record<string, any> = {};
    if (scansData) {
      scansData.forEach((scan: any) => {
        const websiteId = scan.website_id as string;
        if (!latestScansByWebsite[websiteId] || new Date(scan.created_at) > new Date(latestScansByWebsite[websiteId].created_at)) {
          latestScansByWebsite[websiteId] = scan;
        }
      });
    }

    // Get all scan IDs for completed scans
    const completedScanIds = Object.values(latestScansByWebsite)
      .filter((scan: any) => scan.status === 'completed')
      .map((scan: any) => scan.id);

    // Fetch metrics for all completed scans in one query
    let metricsData: any[] = [];
    if (completedScanIds.length > 0) {
      const { data: metrics, error: metricsError } = await supabase
        .from('metrics')
        .select('scan_id, name, value')
        .in('scan_id', completedScanIds)
        .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);

      if (metricsError) {
        console.error('Server: Error fetching metrics:', metricsError);
        return NextResponse.json({ error: metricsError.message }, { status: 500 });
      }

      metricsData = metrics || [];
      console.log(`Server: Fetched ${metricsData.length} metrics for ${completedScanIds.length} completed scans`);
    }

    // Create a map of scan ID to metrics
    const metricsMap: Record<string, any> = {};
    metricsData.forEach((metric: any) => {
      const scanId = metric.scan_id as string;
      if (!metricsMap[scanId]) {
        metricsMap[scanId] = {};
      }

      // Convert metric names to the expected property names
      if (metric.name === 'Performance Score') {
        metricsMap[scanId].performance_score = metric.value;
      } else if (metric.name === 'Accessibility Score') {
        metricsMap[scanId].accessibility_score = metric.value;
      } else if (metric.name === 'SEO Score') {
        metricsMap[scanId].seo_score = metric.value;
      } else if (metric.name === 'Security Score') {
        metricsMap[scanId].security_score = metric.value;
      }
    });

    // Combine websites with their latest scans and metrics
    const websitesWithScans = websitesData.map((website: any) => {
      const latestScan = latestScansByWebsite[website.id];
      let latest_scan = undefined;

      if (latestScan) {
        const scanId = latestScan.id;
        const metrics = metricsMap[scanId] || {};

        latest_scan = {
          id: scanId,
          status: latestScan.status,
          created_at: latestScan.created_at,
          performance_score: metrics.performance_score,
          accessibility_score: metrics.accessibility_score,
          seo_score: metrics.seo_score,
          security_score: metrics.security_score
        };
      }

      return {
        ...website,
        latest_scan
      };
    });

    return NextResponse.json({ data: websitesWithScans });
  } catch (error: any) {
    console.error('Server: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
