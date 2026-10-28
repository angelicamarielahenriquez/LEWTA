/**
 * Server-only: decides whether a signed-in Supabase account is the teacher.
 *
 * Teacher access is never decided in the browser. Each teacher request sends the user's
 * Supabase access token; the server checks it with Supabase and then requires EITHER
 *   - the verified e-mail to be listed in TEACHER_EMAILS (server environment variable), OR
 *   - profiles.role = 'teacher' (students cannot change this column: RLS only lets them read their profile).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TeacherCheck =
  | { ok: true; userId: string; email: string; admin: SupabaseClient }
  | { ok: false; status: number; error: string; configured: boolean };

export function adminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // Server-only key. Never use a NEXT_PUBLIC_ prefix for this value.
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function teacherEmails(): string[] {
  return (process.env.TEACHER_EMAILS || "").split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function checkTeacher(authorization: string | null): Promise<TeacherCheck> {
  const admin = adminClient();
  if (!admin) return { ok: false, status: 503, configured: false, error: "Teacher access needs SUPABASE_SECRET_KEY on the server." };
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return { ok: false, status: 401, configured: true, error: "Sign in with your teacher account first." };
  const { data, error } = await admin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) {
    console.warn("[teacher-access] token rejected by Supabase:", error?.status, error?.message);
    return { ok: false, status: 401, configured: true, error: "Your sign-in expired. Please log in again." };
  }
  const email = String(user.email || "").toLowerCase();
  const verified = Boolean(user.email_confirmed_at || user.confirmed_at);
  let teacher = verified && email !== "" && teacherEmails().includes(email);
  if (!teacher) {
    const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) console.warn("[teacher-access] profile lookup failed:", profileError.message);
    teacher = profile?.role === "teacher";
  }
  if (!teacher) console.warn("[teacher-access] not a teacher:", { listed: teacherEmails().length, emailListed: teacherEmails().includes(email), verified });
  if (!teacher) return { ok: false, status: 403, configured: true, error: "This account does not have teacher access." };
  return { ok: true, userId: user.id, email, admin };
}

export function noStoreJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0" } });
}
