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

/**
 * Asks Supabase (public endpoint) whether "Sign in with Google" is switched on for this project.
 * The Google button is only shown when it is, so students never see a button that fails.
 */
export async function isGoogleSignInEnabled(): Promise<boolean> {
  return (await authSettings()).google;
}

/** Public sign-in settings: is Google on, and are new accounts confirmed automatically (no e-mail needed)? */
export async function authSettings(): Promise<{ google: boolean; autoConfirm: boolean }> {
  if (!isSupabaseConfigured) return { google: false, autoConfirm: false };
  try {
    const r = await fetch(`${projectUrl}/auth/v1/settings`, { headers: { apikey: publishableKey }, cache: "no-store" });
    if (!r.ok) return { google: false, autoConfirm: false };
    const settings = (await r.json()) as { external?: { google?: boolean }; mailer_autoconfirm?: boolean };
    return { google: settings.external?.google === true, autoConfirm: settings.mailer_autoconfirm === true };
  } catch {
    return { google: false, autoConfirm: false };
  }
}
