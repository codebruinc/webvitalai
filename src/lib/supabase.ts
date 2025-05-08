import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a standard client for server-side usage with anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// Create a service role client that bypasses RLS
// If service role key is not available, fall back to admin client
export const supabaseServiceRole = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseAdmin;

// For client components - this creates a fresh client for each request
export const supabase = typeof window !== 'undefined'
  ? createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    })
  : supabaseAdmin;

// Log which clients are available
console.log('Supabase clients initialized:', {
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  hasAnonKey: !!supabaseAnonKey,
  supabaseUrl: supabaseUrl,
  clientType: typeof window !== 'undefined' ? 'client-component' : 'server',
  serviceRoleClientType: supabaseServiceRoleKey ? 'service-role' : 'admin-fallback'
});

// Warning if service role key is missing
if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Using admin client as fallback. Some operations requiring service role permissions may fail.');
}