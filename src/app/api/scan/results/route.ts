import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getScanResult } from '@/services/scanService';
// Import the mockScanUrls map
import { mockScanUrls } from '@/services/scanService';

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
    
    // TESTING BYPASS: Return mock data for scan results in testing mode
    if (isTestingMode && isTestingBypass) {
      console.log('TESTING MODE: Bypassing database lookup for scan results API');
      
      // Get the URL from the mockScanUrls map or use a default
      const url = mockScanUrls.get(scanId) || 'https://example.com';
      console.log('TESTING MODE: Using URL for mock scan results:', url);
      
      // Return mock scan results data
      const mockScanResult = {
        id: scanId,
        url: url,
        status: 'completed',
        performance: {
          score: 85,
          metrics: {
            'First Contentful Paint': { value: 1.2, unit: 's' },
            'Largest Contentful Paint': { value: 2.5, unit: 's' },
            'Total Blocking Time': { value: 150, unit: 'ms' },
            'Cumulative Layout Shift': { value: 0.05 }
          }
        },
        accessibility: {
          score: 92,
          issues: [
            { title: 'Images must have alternate text', description: 'Provide alt text for images', severity: 'medium' }
          ]
        },
        seo: {
          score: 88,
          issues: [
            { title: 'Document does not have a meta description', description: 'Add a meta description', severity: 'medium' }
          ]
        },
        bestPractices: {
          score: 90,
          issues: []
        },
        security: {
          score: 75,
          grade: 'B',
          issues: [
            { title: 'Missing Content-Security-Policy header', description: 'Add CSP header', severity: 'high' }
          ]
        },
        recommendations: [
          {
            issueId: 'rec-1',
            description: 'Optimize images to improve load time',
            priority: 'high',
            implementationDetails: 'Use WebP format and compress images',
            impact: 8,
            effort: 3,
            priorityScore: 8.5
          },
          {
            issueId: 'rec-2',
            description: 'Add alt text to all images',
            priority: 'medium',
            implementationDetails: 'Ensure all <img> tags have descriptive alt attributes',
            impact: 6,
            effort: 2,
            priorityScore: 7.0
          }
        ]
      };
      
      return NextResponse.json({
        success: true,
        data: mockScanResult,
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
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, website_id, websites(user_id)')
      .eq('id', scanId)
      .single();

    // Handle mock scan IDs that don't exist in the database
    if (scanError || !scan) {
      // Check if we're in testing mode (without bypass header)
      if (isTestingMode) {
        console.log('TESTING MODE: Scan not found in database, returning mock data');
        
        // Get the URL from the mockScanUrls map or use a default
        const url = mockScanUrls.get(scanId) || 'https://example.com';
        console.log('TESTING MODE: Using URL for mock scan results:', url);
        
        // Return mock scan results data (same as above)
        const mockScanResult = {
          id: scanId,
          url: url,
          status: 'completed',
          performance: {
            score: 85,
            metrics: {
              'First Contentful Paint': { value: 1.2, unit: 's' },
              'Largest Contentful Paint': { value: 2.5, unit: 's' },
              'Total Blocking Time': { value: 150, unit: 'ms' },
              'Cumulative Layout Shift': { value: 0.05 }
            }
          },
          accessibility: {
            score: 92,
            issues: [
              { title: 'Images must have alternate text', description: 'Provide alt text for images', severity: 'medium' }
            ]
          },
          seo: {
            score: 88,
            issues: [
              { title: 'Document does not have a meta description', description: 'Add a meta description', severity: 'medium' }
            ]
          },
          bestPractices: {
            score: 90,
            issues: []
          },
          security: {
            score: 75,
            grade: 'B',
            issues: [
              { title: 'Missing Content-Security-Policy header', description: 'Add CSP header', severity: 'high' }
            ]
          },
          recommendations: [
            {
              issueId: 'rec-1',
              description: 'Optimize images to improve load time',
              priority: 'high',
              implementationDetails: 'Use WebP format and compress images',
              impact: 8,
              effort: 3,
              priorityScore: 8.5
            },
            {
              issueId: 'rec-2',
              description: 'Add alt text to all images',
              priority: 'medium',
              implementationDetails: 'Ensure all <img> tags have descriptive alt attributes',
              impact: 6,
              effort: 2,
              priorityScore: 7.0
            }
          ]
        };
        
        return NextResponse.json({
          success: true,
          data: mockScanResult,
          isPremium: true,
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