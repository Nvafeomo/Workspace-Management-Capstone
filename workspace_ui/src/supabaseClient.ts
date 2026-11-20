// Shared Supabase client for the app; src/lib/supabase.ts re-exports it.
import { createClient } from '@supabase/supabase-js'

// Env vars match .env.example. VITE_SUPABASE_ANON_KEY, if set, takes precedence over
// VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env. Create workspace_ui/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
