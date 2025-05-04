import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getScanJobStatus } from '@/services/queueService';

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

    // If the scan is already completed or failed, return its status
    if (scan.status === 'completed' || scan.status === 'failed') {
      return NextResponse.json({
        success: true,
        data: {
          id: scan.id,
          status: scan.status,
          progress: 100,
          error: scan.error,
          completed_at: scan.completed_at,
        },
      });
    }

    // Get the job status from the queue
    const jobStatus = await getScanJobStatus(scanId);

    // Map the job status to the scan status
    let scanStatus = scan.status;
    
    if (jobStatus.status === 'active') {
      scanStatus = 'in-progress';
    } else if (jobStatus.status === 'completed') {
      scanStatus = 'completed';
    } else if (jobStatus.status === 'failed') {
      scanStatus = 'failed';
    }

    // Update the scan status in the database if it has changed
    if (scanStatus !== scan.status) {
      await supabase
        .from('scans')
        .update({
          status: scanStatus,
          error: jobStatus.error,
          completed_at: scanStatus === 'completed' || scanStatus === 'failed' ? new Date().toISOString() : null,
        })
        .eq('id', scanId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: scan.id,
        status: scanStatus,
        progress: jobStatus.progress,
        error: jobStatus.error,
        completed_at: scan.completed_at,
      },
    });
  } catch (error: any) {
    console.error('Scan status API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}