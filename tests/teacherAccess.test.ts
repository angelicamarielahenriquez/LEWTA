import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTeacher } from "@/lib/server/teacherAccess";

// Fake Supabase server: two accounts, one is the teacher.
const users: Record<string, { id: string; email: string; email_confirmed_at: string | null; role: string }> = {
  "teacher-token": { id: "t1", email: "teacher@example.com", email_confirmed_at: "2026-10-01T00:00:00Z", role: "student" },
  "student-token": { id: "s1", email: "student@example.com", email_confirmed_at: "2026-10-01T00:00:00Z", role: "student" },
  "unverified-token": { id: "u1", email: "teacher2@example.com", email_confirmed_at: null, role: "student" },
  "role-token": { id: "r1", email: "other@example.com", email_confirmed_at: "2026-10-01T00:00:00Z", role: "teacher" },
};
const realFetch = globalThis.fetch;
function install() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unit.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "server-secret-for-tests";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-key-for-tests";
  process.env.TEACHER_EMAILS = "Teacher@Example.com, teacher2@example.com";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    if (url.pathname === "/auth/v1/user") {
      const token = (headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const u = users[token];
      if (!u) return json({ code: 401, msg: "invalid JWT" }, 401);
      return json({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: u.email_confirmed_at, app_metadata: {}, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" });
    }
    if (url.pathname === "/rest/v1/profiles") {
      const id = (url.searchParams.get("id") || "").replace(/^eq\./, "");
      const u = Object.values(users).find((x) => x.id === id);
      return json(u ? [{ role: u.role }] : []);
    }
    return json({ error: "not found" }, 404);
  }) as typeof fetch;
}

test("teacher access: only the verified teacher account is accepted", async () => {
  install();
  try {
    const teacher = await checkTeacher("Bearer teacher-token");
    assert.equal(teacher.ok, true, "TEACHER_EMAILS account (case-insensitive) is the teacher");
    const student = await checkTeacher("Bearer student-token");
    assert.equal(student.ok, false); if (!student.ok) assert.equal(student.status, 403, "students are refused");
    const unverified = await checkTeacher("Bearer unverified-token");
    assert.equal(unverified.ok, false, "an unverified e-mail is never trusted");
    const byRole = await checkTeacher("Bearer role-token");
    assert.equal(byRole.ok, true, "profiles.role = teacher also works");
    const noToken = await checkTeacher(null);
    assert.equal(noToken.ok, false); if (!noToken.ok) assert.equal(noToken.status, 401);
    const fake = await checkTeacher("Bearer made-up");
    assert.equal(fake.ok, false); if (!fake.ok) assert.equal(fake.status, 401, "a fake token is refused");
  } finally { globalThis.fetch = realFetch; }
});
