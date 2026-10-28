import { createClient } from "@supabase/supabase-js";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

/**
 * LEWTA can run in Guest mode without Supabase. Account features activate only
 * when both public Supabase settings are configured.
 */
export const isSupabaseConfigured = Boolean(projectUrl && publishableKey);

/** This client uses only a Supabase publishable/anon key. Never put a secret key here. */
export const supabase = isSupabaseConfigured
  ? createClient(projectUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
