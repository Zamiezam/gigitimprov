import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// FIX: The old code used VITE_SUPABASE_PUBLISHABLE_KEY which is a non-standard name.
// Supabase's own CLI and all official docs use VITE_SUPABASE_ANON_KEY.
// We fall back to the old name so existing deployments don't break immediately.
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// FIX: Fail loudly during development if env vars are missing instead of
// producing a cryptic "invalid URL" error deep inside a fetch call.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[GigIT] Supabase config missing. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);