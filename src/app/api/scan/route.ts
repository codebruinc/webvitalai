import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { initiateScan } from '@/services/scanService';
import { queueScan } from '@/services/queueService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Initiate the scan
    const scanId = await initiateScan(url, session.user.id);
    
    // Queue the scan for processing
    await queueScan(scanId);

    // Return the scan ID
    return NextResponse.json({
      success: true,
      message: 'Scan initiated',
      data: {
        scan_id: scanId,
      },
    });
  } catch (error: any) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve scan results
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the scan ID from the URL
    const url = new URL(request.url);
    const scanId = url.searchParams.get('id');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Verify the user has access to this scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, status, error, completed_at, website_id, websites(user_id)')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the website
    const websiteUserId = (scan.websites as any).user_id;
    
    if (websiteUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Return the scan status
    return NextResponse.json({
      success: true,
      data: {
        id: scan.id,
        status: scan.status,
        error: scan.error,
        completed_at: scan.completed_at,
        website_id: scan.website_id,
      },
    });
  } catch (error: any) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}