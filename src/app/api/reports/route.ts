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
    console.log('Server: Fetching scans for user:', userId);

    // Fetch scans with their associated websites
    const { data: scans, error } = await supabase
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

    if (error) {
      console.error('Server: Error fetching scans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!scans || scans.length === 0) {
      console.log('Server: No scans found for user:', userId);
      return NextResponse.json({ data: [] });
    }

    console.log(`Server: Found ${scans.length} scans for user ${userId}`);

    // Get all scan IDs
    const scanIds = scans.map(scan => scan.id);

    // Fetch metrics for all scans in one query
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics')
      .select('scan_id, name, value')
      .in('scan_id', scanIds)
      .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);

    if (metricsError) {
      console.error('Server: Error fetching metrics:', metricsError);
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }

    console.log(`Server: Fetched ${metricsData?.length || 0} metrics for ${scanIds.length} scans`);

    // Create a map of scan ID to metrics
    const metricsMap: Record<string, any> = {};

    if (metricsData) {
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
    }

    // Transform data to match existing component expectations
    const transformedData = scans.map((scan: any) => {
      // Get metrics for this scan
      const scanId = scan.id as string;
      const metrics = metricsMap[scanId] || {};

      // Handle websites data which could be an array or object
      let websiteUrl: string | undefined = undefined;

      if (scan.websites) {
        // If it's an array, take the first element
        if (Array.isArray(scan.websites) && scan.websites.length > 0) {
          websiteUrl = scan.websites[0].url;
        }
        // If it's an object with url property
        else if (typeof scan.websites === 'object' && 'url' in scan.websites) {
          websiteUrl = (scan.websites as { url: string }).url;
        }
      }

      return {
        ...scan,
        // Extract URL from the websites object
        website_url: websiteUrl,
        // Add metrics
        performance_score: metrics.performance_score,
        accessibility_score: metrics.accessibility_score,
        seo_score: metrics.seo_score,
        security_score: metrics.security_score
      };
    });

    return NextResponse.json({ data: transformedData });
  } catch (error: any) {
    console.error('Server: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}