import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'aln_supabase_url',
  SUPABASE_ANON_KEY: 'aln_supabase_anon_key'
};

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL : '') ||
    '';

  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined'
      ? process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env?.VITE_SUPABASE_ANON_KEY ||
        process.env?.SUPABASE_PUBLISHABLE_KEY ||
        process.env?.SUPABASE_ANON_KEY
      : '') ||
    '';

  const storedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
  const storedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '';

  const url = envUrl || storedUrl;
  const anonKey = envKey || storedKey;

  return { url, anonKey };
}

export function setSupabaseCredentials(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  if (anonKey) localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());

  supabaseInstance = null;
  initSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('[SupabaseClient] Initialization error:', err);
    supabaseInstance = null;
    return null;
  }
}

// Initial client instance
export const supabase = initSupabaseClient();
