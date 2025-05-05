import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a standard client for server-side usage
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// For client components - this creates a fresh client for each request
export const supabase = typeof window !== 'undefined'
  ? createClientComponentClient()
  : supabaseAdmin;