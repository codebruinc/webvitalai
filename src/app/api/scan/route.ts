// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { initiateScan } from '@/services/scanService';
import { queueScan } from '@/services/queueService';
import { supabaseServiceRole } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Log request details for debugging
    console.log('Scan API: Request received', {
      headers: Object.fromEntries(request.headers),
      method: request.method,
      url: request.url,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        TESTING_MODE: process.env.TESTING_MODE,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    // Check if we're in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    let userId = null;
    
    // TESTING BYPASS: Skip authentication checks when in testing mode
    if (request.headers.get('x-testing-bypass') === 'true') {
      if (isTestingMode) {
        console.log('Bypassing authentication for scan API (testing mode)');
        
        // Use a test user ID
        userId = 'test-user-id';
        console.log('Using test user ID:', userId);
      } else {
        console.error('Attempted to use testing bypass in production mode');
        return NextResponse.json(
          { error: 'Testing bypass not allowed in production mode' },
          { status: 403 }
        );
      }
    } else {
      // PRODUCTION MODE: Normal authentication flow
      // Get the authorization header
      const authHeader = request.headers.get('authorization');
      
      // Check if we have an authorization header (token-based auth)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.split(' ')[1];
        
        // Create a temporary Supabase client with the token for authentication only
        const tempClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        // Get the user from the token
        const { data: { user }, error } = await tempClient.auth.getUser();
        
        if (error || !user) {
          console.error('Token authentication error:', error);
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('Authenticated via token for user:', userId);
      } else {
        // Cookie-based authentication (default for web app)
        const cookieClient = createRouteHandlerClient<Database>({ cookies });
        const { data: { session } } = await cookieClient.auth.getSession();
    
        if (!session) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        userId = session.user.id;
        console.log('Authenticated via cookie for user:', userId);
      }
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

    // Log the scan initiation attempt
    console.log('Scan API: Initiating scan with service role client', {
      url,
      userId,
      isTestingMode,
      authMethod: request.headers.get('authorization') ? 'token' : 'cookie'
    });

    try {
      // Use the service role client directly to bypass RLS
      const scanId = await initiateScan(url, userId, supabaseServiceRole);
      
      // Queue the scan for processing
      await queueScan(scanId);
      
      console.log('Scan API: Scan initiated successfully with service role', { scanId });
      
      // Return the scan ID
      return NextResponse.json({
        success: true,
        message: 'Scan initiated',
        data: {
          scan_id: scanId,
        },
      });
    } catch (error: any) {
      // Log detailed error information
      console.error('Scan API: Failed to create scan with service role client', {
        error: error.message,
        stack: error.stack,
        url: url,
        userId: userId
      });
      
      // Throw the error to be caught by the outer catch block
      throw new Error(`Failed to create scan: ${error.message}`);
    }

    // This code is unreachable due to the try/catch structure above
    // but is kept for TypeScript's control flow analysis
  } catch (error: any) {
    console.error('Scan API error:', error);
    
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
    const statusCode = errorMessage.includes('Invalid URL') ||
                      errorMessage.includes('URL is required') ? 400 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// GET endpoint to retrieve scan results
export async function GET(request: NextRequest) {
  try {
    // Check if we're in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    let userId = null;
    let supabase = null;
    
    // TESTING BYPASS: Skip authentication checks when in testing mode
    if (request.headers.get('x-testing-bypass') === 'true') {
      if (isTestingMode) {
        console.log('Bypassing authentication for scan API GET endpoint (testing mode)');
        
        // Create a Supabase client without authentication
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        
        // Use a real user ID that exists in the database
        // This hardcoded ID comes from test-scan-with-user.js which is known to work
        userId = '8ff0950a-c73d-4efc-8b73-56205b8035e0';
        console.log('Using real test user ID:', userId);
      } else {
        console.error('Attempted to use testing bypass in production mode');
        return NextResponse.json(
          { error: 'Testing bypass not allowed in production mode' },
          { status: 403 }
        );
      }
    } else {
      // PRODUCTION MODE: Normal authentication flow
      // Get the authorization header
      const authHeader = request.headers.get('authorization');
      
      // Check if we have an authorization header (token-based auth)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.split(' ')[1];
        
        // Create a Supabase client with the token
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        // Get the user from the token
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Token authentication error:', error);
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('Authenticated via token for user:', userId);
      } else {
        // Cookie-based authentication (default for web app)
        supabase = createRouteHandlerClient<Database>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();
    
        if (!session) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        userId = session.user.id;
        console.log('Authenticated via cookie for user:', userId);
      }
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

    // Get the scan data
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

    // Check if the testing bypass header is present
    const isTestingBypass = request.headers.get('x-testing-bypass') === 'true';
    
    // TESTING BYPASS: Skip ownership verification in testing mode
    if (!isTestingBypass) {
      // PRODUCTION MODE: Verify the user has access to this scan
      // Check if the user owns the website
      const websiteUserId = (scan.websites as any).user_id;
      
      if (websiteUserId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else {
      if (isTestingMode) {
        console.log('Bypassing ownership verification for scan (testing mode)');
      } else {
        console.error('Attempted to use testing bypass in production mode');
        return NextResponse.json(
          { error: 'Testing bypass not allowed in production mode' },
          { status: 403 }
        );
      }
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
                      errorMessage.includes('Unauthorized') ? 401 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}