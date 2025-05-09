import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate Supabase URL and keys
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure supabaseUrl is a valid URL
try {
  // Test if the URL is valid by creating a URL object
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

// Default headers for all clients
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Create a standard client for server-side usage with anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: defaultHeaders
  }
});

// Create a service role client that bypasses RLS
// If service role key is not available, fall back to admin client
export const supabaseServiceRole = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: defaultHeaders
      }
    })
  : supabaseAdmin;

// For client components - use a singleton pattern to prevent multiple instances
let clientInstance: any = null;

export const supabase = typeof window !== 'undefined'
  ? (() => {
      if (!clientInstance) {
        clientInstance = createClientComponentClient({
          supabaseUrl,
          supabaseKey: supabaseAnonKey,
          options: {
            global: {
              headers: defaultHeaders
            }
          }
        });
      }
      return clientInstance;
    })()
  : supabaseAdmin;

// Log which clients are available
console.log('Supabase clients initialized:', {
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  hasAnonKey: !!supabaseAnonKey,
  supabaseUrl: supabaseUrl,
  clientType: typeof window !== 'undefined' ? 'client-component' : 'server',
  serviceRoleClientType: supabaseServiceRoleKey ? 'service-role' : 'admin-fallback'
});

// Warning if service role key is missing - only show in server context
if (!supabaseServiceRoleKey && typeof window === 'undefined') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Using admin client as fallback. Some operations requiring service role permissions may fail.');
}
