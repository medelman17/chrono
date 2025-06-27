import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side usage
// This uses the service role key for full access if available
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  // Use service role key if available, otherwise use anon key
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseKey) {
    throw new Error('Missing Supabase key');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'case-documents',
} as const;