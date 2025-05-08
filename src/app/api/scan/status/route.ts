import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getScanJobStatus } from '@/services/queueService';
import { supabase, supabaseServiceRole } from '@/lib/supabase';

// Force dynamic rendering for this route since it uses request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if we're in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    const isTestingBypass = request.headers.get('x-testing-bypass') === 'true';
    
    // Get the scan ID from the URL
    const url = new URL(request.url);
    const scanId = url.searchParams.get('id');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }
    
    // TESTING BYPASS: Return mock data for scan status in testing mode
    if (isTestingBypass) {
      if (isTestingMode) {
        console.log('Bypassing database lookup for scan status API (testing mode)');
      } else {
        console.error('Attempted to use testing bypass in production mode');
        return NextResponse.json(
          { error: 'Testing bypass not allowed in production mode' },
          { status: 403 }
        );
      }
      
      // Return mock scan status data
      return NextResponse.json({
        success: true,
        data: {
          id: scanId,
          status: 'completed',
          progress: 100,
          error: null,
          completed_at: new Date().toISOString(),
        },
      });
    }
    
    // PRODUCTION MODE: Normal authentication flow
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user has access to this scan
    const { data: scan, error: scanError } = await supabaseServiceRole
      .from('scans')
      .select('id, status, error, completed_at, website_id, websites(user_id)')
      .eq('id', scanId)
      .single();

    // Handle mock scan IDs that don't exist in the database
    if (scanError || !scan) {
      // Check if we're in testing mode (without bypass header)
      if (isTestingMode) {
        console.log('Scan not found in database, returning mock data (testing mode)');
        
        // Return mock scan status data
        return NextResponse.json({
          success: true,
          data: {
            id: scanId,
            status: 'completed',
            progress: 100,
            error: null,
            completed_at: new Date().toISOString(),
          },
        });
      } else {
        // In production mode, return 404
        return NextResponse.json(
          { error: 'Scan not found' },
          { status: 404 }
        );
      }
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
      await supabaseServiceRole
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
    
    // Log detailed error information for debugging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Extract error message with fallback
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // Determine if this is a client error (4xx) or server error (5xx)
    const statusCode = errorMessage.includes('not found') ? 404 :
                      errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('required') ? 400 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
