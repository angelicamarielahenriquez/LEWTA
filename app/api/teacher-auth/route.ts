import { NextRequest, NextResponse } from "next/server";
import { checkTeacher } from "@/lib/server/teacherAccess";
import { TEACHER_COOKIE, TEACHER_SESSION_SECONDS, createTeacherToken, dashboardPassword, safeEqual, validTeacherToken } from "@/lib/server/teacherSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}
function cookie(res: NextResponse, value: string, expires: Date) {
  res.cookies.set({ name: TEACHER_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", expires, maxAge: value ? TEACHER_SESSION_SECONDS : 0 });
  return res;
}

/** Is Teacher Mode open? Only for the teacher's account AND a valid password session. */
export async function GET(request: NextRequest) {
  const check = await checkTeacher(request.headers.get("authorization"));
  const configured = Boolean(dashboardPassword());
  if (!check.ok) return reply({ configured: configured && check.configured, account: false, teacher: false, error: check.error }, check.status === 503 ? 503 : 200);
  const unlocked = validTeacherToken(request.cookies.get(TEACHER_COOKIE)?.value, check.userId);
  return reply({ configured, account: true, teacher: unlocked });
}

/** Unlock: teacher account + dashboard password. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) { try { if (new URL(origin).host !== request.nextUrl.host) return reply({ teacher: false, error: "Invalid request origin." }, 403); } catch { return reply({ teacher: false, error: "Invalid request origin." }, 403); } }
  if (!dashboardPassword()) return reply({ configured: false, teacher: false, error: "The teacher password is not set on the server yet (TEACHER_DASHBOARD_PASSWORD in Vercel)." }, 503);
  const check = await checkTeacher(request.headers.get("authorization"));
  if (!check.ok) return reply({ configured: true, account: false, teacher: false, error: check.error }, check.status === 503 ? 503 : 403);
  let password = "";
  try { const body = await request.json() as { password?: unknown }; password = typeof body.password === "string" ? body.password : ""; } catch { /* empty body */ }
  if (!password || !safeEqual(password, dashboardPassword())) return reply({ configured: true, account: true, teacher: false, error: "That teacher password is not correct." }, 401);
  const token = createTeacherToken(check.userId);
  return cookie(reply({ configured: true, account: true, teacher: true }), token.value, token.expires);
}

/** Lock the dashboard again. */
export async function DELETE() {
  return cookie(reply({ teacher: false }), "", new Date(0));
}
