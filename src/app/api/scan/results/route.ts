import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getScanResult } from '@/services/scanService';

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
      .select('id, website_id, websites(user_id)')
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

    // Get the scan result
    const scanResult = await getScanResult(scanId);

    if (!scanResult) {
      return NextResponse.json(
        { error: 'Scan result not found' },
        { status: 404 }
      );
    }

    // Check if the user has a premium subscription
    const { data: subscription } = await supabase
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