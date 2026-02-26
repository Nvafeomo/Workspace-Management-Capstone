// Connect to supabase database
import { createClient, SupabaseClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
//console.log(import.meta.env.VITE_SUPABASE_URL); used for debugging
//console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseKey);
