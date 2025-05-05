import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import scanQueue from '@/services/queueService';

/**
 * Health check endpoint for monitoring
 * Checks the status of the application, database, and Redis
 */
export async function GET() {
  interface ServiceStatus {
    status: string;
    message?: string;
  }

  const healthStatus: {
    status: string;
    timestamp: string;
    version: string;
    environment: string | undefined;
    services: {
      api: ServiceStatus;
      database: ServiceStatus;
      redis: ServiceStatus;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV,
    services: {
      api: { status: 'ok' },
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    },
  };

  // Check database connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      healthStatus.services.database = {
        status: 'error',
        message: error.message,
      };
      healthStatus.status = 'degraded';
    } else {
      healthStatus.services.database = { status: 'ok' };
    }
  } catch (error: any) {
    healthStatus.services.database = {
      status: 'error',
      message: error.message,
    };
    healthStatus.status = 'degraded';
  }

  // Check Redis connection
  try {
    if (!scanQueue) {
      healthStatus.services.redis = {
        status: 'error',
        message: 'Queue not initialized',
      };
      healthStatus.status = 'degraded';
    } else {
      const queueStatus = await scanQueue.client.ping();
      
      if (queueStatus === 'PONG') {
        healthStatus.services.redis = { status: 'ok' };
      } else {
        healthStatus.services.redis = {
          status: 'error',
          message: 'Redis ping failed',
        };
        healthStatus.status = 'degraded';
      }
    }
  } catch (error: any) {
    healthStatus.services.redis = {
      status: 'error',
      message: error.message,
    };
    healthStatus.status = 'degraded';
  }

  // Return health status with appropriate status code
  return NextResponse.json(
    healthStatus,
    { status: healthStatus.status === 'ok' ? 200 : 503 }
  );
}