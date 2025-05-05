import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processAlerts } from '@/services/alertProcessor';

/**
 * Cron job endpoint for processing alerts
 * This endpoint is called by Vercel Cron Jobs every 6 hours
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('Authorization');
  
  // In production, you should validate this token against a secret
  // For Vercel Cron Jobs, you can set a secret in the Vercel dashboard
  if (process.env.NODE_ENV === 'production' && 
      (!authHeader || !authHeader.startsWith('Bearer ') || 
       authHeader.split(' ')[1] !== process.env.CRON_SECRET)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Process alerts
    const result = await processAlerts(supabase);
    
    // Return success response
    return NextResponse.json({
      success: true,
      processed: result.processed,
      sent: result.sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error processing alerts:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}