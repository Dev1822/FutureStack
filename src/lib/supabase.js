import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Database features will be unavailable.');
}

/**
 * Frontend Supabase client (using anon key)
 * 
 * Used for:
 * - Real-time subscriptions (Supabase Realtime)
 * - Direct file storage access (Supabase Storage)
 * 
 * Note: Realtime uses a permissive SELECT RLS policy.
 * Data security is enforced by the backend API.
 */
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    })
    : null;
