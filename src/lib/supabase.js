import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Supabase client for REALTIME SUBSCRIPTIONS ONLY.
 * 
 * NOTE: All CRUD operations (create, read, update, delete) should go through
 * the backend API (opportunityService) which handles authentication via Clerk JWT.
 * 
 * This client uses the anon key and is only used for:
 * - StatusBoard.jsx realtime subscription (listens for postgres_changes)
 * 
 * The client will be null if environment variables are not set.
 */
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 10 } }
    })
    : null;

// Export a flag to check if realtime is available
export const isRealtimeAvailable = supabase !== null;
