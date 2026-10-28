/**
 * Server-only: the Teacher Dashboard password step.
 *
 * Teacher Mode needs BOTH:
 *   1. the teacher's own signed-in account (checked in teacherAccess.ts), and
 *   2. the dashboard password (TEACHER_DASHBOARD_PASSWORD, stored only in the server environment).
 * After both pass, the server sets an HttpOnly cookie, signed for that account only, valid for 6 hours.
 * The password is never stored in the code or sent back to the browser.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const TEACHER_COOKIE = "lewta_teacher_session";
export const TEACHER_SESSION_SECONDS = 6 * 60 * 60;

export function dashboardPassword(): string { return process.env.TEACHER_DASHBOARD_PASSWORD || ""; }

function signingKey(): string {
  // Changing the password (or the optional secret) automatically signs out every open teacher session.
  return `${process.env.TEACHER_DASHBOARD_SECRET || ""}|${dashboardPassword()}|lewta-teacher-v2`;
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8"); const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const sign = (userId: string, expiry: string) => createHmac("sha256", signingKey()).update(`${userId}:${expiry}`).digest("hex");

export function createTeacherToken(userId: string, now = Date.now()): { value: string; expires: Date } {
  const expiry = String(Math.floor(now / 1000) + TEACHER_SESSION_SECONDS);
  return { value: `${expiry}.${sign(userId, expiry)}`, expires: new Date(Number(expiry) * 1000) };
}

export function validTeacherToken(value: string | undefined, userId: string, now = Date.now()): boolean {
  if (!value || !dashboardPassword()) return false;
  const dot = value.indexOf(".");
  if (dot < 1) return false;
  const expiry = value.slice(0, dot); const signature = value.slice(dot + 1);
  if (!/^\d{10,}$/.test(expiry) || Number(expiry) <= Math.floor(now / 1000)) return false;
  return safeEqual(signature, sign(userId, expiry));
}
