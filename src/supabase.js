import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Initialize Supabase only when both public env vars are present.
 * Never use the service_role key in frontend code.
 */
function initSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Wedding RSVP] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env and add your Supabase credentials. ' +
        'RSVP and wishes features will not work until this is configured.'
    );
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

const supabase = initSupabase();

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export { supabase };
