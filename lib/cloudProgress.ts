/**
 * Saving and loading account progress in Supabase (table: player_progress).
 * No database tables or security rules are changed by this file.
 *
 * Every save first reads the cloud copy and merges it with this device's copy, so an older
 * device can never erase newer progress made on another device.
 */
import { supabase } from "@/lib/supabase";
import { describeRecovery, mergeProgress, migrateLegacyProgress } from "@/lib/progress";
import type { Player, Progress } from "@/types/lewta";

export type SupabaseAuthUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> };

/** Local cache key for an account: tied to the account ID, so two accounts never share a cache. */
export const accountCacheKey = (userId: string) => `lewta_progress_account_${userId}`;
export const localProgressKey = (username: string) => `lewta_progress_${username.toLowerCase()}`;

export function readLocal(key: string): Progress | null {
  try { const raw = localStorage.getItem(key); return raw ? migrateLegacyProgress(JSON.parse(raw)) : null; } catch { return null; }
}
export function writeLocal(key: string, p: Progress) {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* storage full or blocked */ }
}

const sameProgress = (a: Progress, b: Progress) => JSON.stringify({ ...a, updatedAt: "" }) === JSON.stringify({ ...b, updatedAt: "" });

export async function fetchCloudProgress(userId: string): Promise<{ progress: Progress | null; exists: boolean; raw: unknown }> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("player_progress").select("progress").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`LEWTA progress tables are not ready. Run supabase/schema.sql in the Supabase SQL Editor. (${error.message})`);
  return { progress: data?.progress ? migrateLegacyProgress(data.progress) : null, exists: Boolean(data), raw: data?.progress ?? null };
}

/** Read the cloud copy, merge it with ours, write the merged result. Returns what was saved. */
export async function saveCloudProgress(userId: string, local: Progress): Promise<Progress> {
  if (!supabase) return local;
  const { progress: cloud } = await fetchCloudProgress(userId);
  const merged = cloud ? mergeProgress(local, cloud) : local;
  if (cloud && sameProgress(merged, cloud)) return merged; // nothing new to save
  const { error } = await supabase.from("player_progress").upsert(
    { user_id: userId, progress: merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return merged;
}

function namesFrom(user: SupabaseAuthUser) {
  const m = user.user_metadata || {};
  const full = String(m.full_name || m.name || "").trim();
  const [first = "", ...rest] = full.split(/\s+/);
  return {
    firstName: String(m.first_name || m.given_name || first || ""),
    lastName: String(m.last_name || m.family_name || rest.join(" ") || ""),
  };
}

/** Loads the student profile and progress after sign-in, merging any copy saved on this device. */
export async function loadAccount(user: SupabaseAuthUser, opts: { sessionId?: string; legacyLocal?: Progress | null }) {
  if (!supabase) throw new Error("Supabase is not configured. Continue as Guest still works without it.");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("id,email,first_name,last_name,username,promotion,role").eq("id", user.id).maybeSingle();
  if (profileError) throw new Error(`Supabase database setup is incomplete. Run supabase/schema.sql in your Supabase SQL Editor, then try again. (${profileError.message})`);
  if (!profile) throw new Error("Your Supabase account exists, but its LEWTA profile is missing. Run supabase/schema.sql and sign in again.");

  const { progress: cloud, exists, raw } = await fetchCloudProgress(user.id);
  const cached = readLocal(accountCacheKey(user.id));
  let progress = cloud ?? migrateLegacyProgress({});
  for (const extra of [cached, opts.legacyLocal]) if (extra) progress = mergeProgress(progress, extra);
  if (!exists || !cloud || !sameProgress(progress, cloud)) {
    const { error } = await supabase.from("player_progress").upsert({ user_id: user.id, progress, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error(`LEWTA could not save your cloud progress record. (${error.message})`);
  }
  writeLocal(accountCacheKey(user.id), progress);

  const names = namesFrom(user);
  const player: Player = {
    id: user.id, authUserId: user.id, email: String(user.email || profile.email || ""),
    firstName: String(profile.first_name || names.firstName || ""), lastName: String(profile.last_name || names.lastName || ""),
    username: String(profile.username || user.email?.split("@")[0] || `student-${user.id.slice(0, 8)}`),
    promotion: String(profile.promotion || "2026"), role: String(profile.role || "student"),
    sessionId: opts.sessionId || crypto.randomUUID(), storageMode: "supabase",
  };
  return { player, progress, recovered: describeRecovery(raw, progress) };
}
