import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase renamed the browser-safe key from `anon` to `publishable`.
 * Support both environment variable names so the app works with either
 * generation of Supabase dashboard configuration.
 */
function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function hasSupabase() {
  const { url, key } = supabaseConfig();
  return Boolean(url && key);
}

export function supabaseBrowser() {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
