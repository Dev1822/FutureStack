import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Database features will be unavailable.');
}

/**
 * Frontend Supabase client (using anon key)
 * 
 * NOTE: This client is not currently used in the application since all API calls
 * go through the backend Express server. It's preserved for potential future use cases:
 * - Real-time subscriptions (Supabase Realtime)
 * - Direct file storage access (Supabase Storage)
 * - Client-side caching with Supabase
 * 
 * If none of these features are needed, consider removing this file to reduce bundle size.
 */
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
