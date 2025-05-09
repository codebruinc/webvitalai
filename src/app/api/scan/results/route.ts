import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getScanResults } from '@/services/scanService';
// Import the mockScanUrls map
import { mockScanUrls } from '@/services/scanService';
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
    console.log('Scan results API called with scanId:', scanId);

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the scan ID has a "default-" prefix, which is not a valid UUID
    // This check is now handled by getScanResults, so we don't need to return an error here
    if (scanId.startsWith('default-')) {
      console.warn(`Warning: Scan ID has default- prefix: ${scanId}`);
    }
    
    // TESTING BYPASS: Return mock data for scan results in testing mode
    if (isTestingMode && isTestingBypass) {
      console.log('Bypassing database lookup for scan results API (testing mode)');
      
      // Use the getScanResult function which now handles mock scan IDs
      console.log('Testing mode: Fetching scan results for scanId:', scanId);
      const scanResult = await getScanResults(scanId);
      console.log('Testing mode: Scan result returned:', scanResult ? 'Found' : 'Not found');
      
      if (!scanResult) {
        console.error('Testing mode: Scan result not found for scanId:', scanId);
        return NextResponse.json(
          { error: 'Scan result not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: scanResult,
        isPremium: true,
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
      .select('id, website_id, websites(user_id)')
      .eq('id', scanId)
      .single();

    // Handle mock scan IDs that don't exist in the database
    if (scanError || !scan) {
      // Check if we're in testing mode (without bypass header)
      if (isTestingMode) {
        console.log('Scan not found in database, checking for mock scan (testing mode)');
        
        // Use the getScanResult function which now handles mock scan IDs
        const scanResult = await getScanResults(scanId);
        
        if (scanResult) {
          console.log('Found mock scan data (testing mode)');
          return NextResponse.json({
            success: true,
            data: scanResult,
            isPremium: true,
          });
        } else {
          console.log('No mock scan data found (testing mode)');
        }
      }
      
      // In production mode or if no mock data found, return 404
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

    // Get the scan result
    console.log('Production mode: Fetching scan results for scanId:', scanId);
    const scanResult = await getScanResults(scanId);
    console.log('Production mode: Scan result returned:', scanResult ? 'Found' : 'Not found');

    if (!scanResult) {
      console.error('Production mode: Scan result not found for scanId:', scanId);
      return NextResponse.json(
        { error: 'Scan result not found' },
        { status: 404 }
      );
    }

    // Check if the user has a premium subscription
    const { data: subscription } = await supabaseServiceRole
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    const isPremium = subscription && subscription.plan_type === 'premium';

    // Filter the results based on the user's subscription
    if (!isPremium) {
      // Free tier users only get high-level scores
      const filteredResult = {
        id: scanResult.id,
        url: scanResult.url,
        status: scanResult.status,
        error: scanResult.error,
        performance: scanResult.performance ? { score: scanResult.performance.score } : undefined,
        accessibility: scanResult.accessibility ? { score: scanResult.accessibility.score } : undefined,
        seo: scanResult.seo ? { score: scanResult.seo.score } : undefined,
        bestPractices: scanResult.bestPractices ? { score: scanResult.bestPractices.score } : undefined,
        security: scanResult.security ? { score: scanResult.security.score, grade: scanResult.security.grade } : undefined,
      };

      return NextResponse.json({
        success: true,
        data: filteredResult,
        isPremium: false,
      });
    }

    // Premium users get detailed results
    return NextResponse.json({
      success: true,
      data: scanResult,
      isPremium: true,
    });
  } catch (error: any) {
    console.error('Scan results API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
