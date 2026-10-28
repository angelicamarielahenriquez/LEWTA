import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "lewta_teacher_session";
const SESSION_SECONDS = 6 * 60 * 60;

type TeacherConfig = { password: string; secret: string };

function getConfig(): TeacherConfig | null {
  const password = process.env.TEACHER_DASHBOARD_PASSWORD || "";
  const secret = process.env.TEACHER_DASHBOARD_SECRET || "";
  // Require a dedicated secret; do not fall back to a hard-coded or public value.
  if (!password || secret.length < 32) return null;
  return { password, secret };
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signExpiry(expiry: string, secret: string): string {
  return createHmac("sha256", secret).update(`lewta-teacher:${expiry}`).digest("hex");
}

function isAuthenticated(request: NextRequest, secret: string): boolean {
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const separator = value.indexOf(".");
  if (separator < 1) return false;
  const expiry = value.slice(0, separator);
  const suppliedSignature = value.slice(separator + 1);
  if (!/^\d{10,}$/.test(expiry) || Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(suppliedSignature, signExpiry(expiry, secret));
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  if (!config) {
    return noStore(NextResponse.json({ configured: false, authenticated: false }));
  }
  return noStore(NextResponse.json({ configured: true, authenticated: isAuthenticated(request, config.secret) }));
}

export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!config) {
    return noStore(NextResponse.json({
      configured: false,
      authenticated: false,
      error: "Teacher access is not configured. Add TEACHER_DASHBOARD_PASSWORD and a 32+ character TEACHER_DASHBOARD_SECRET in the deployment environment.",
    }, { status: 503 }));
  }

  // Reject cross-origin login submissions where an Origin header is present.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return noStore(NextResponse.json({ configured: true, authenticated: false, error: "Invalid request origin." }, { status: 403 }));
      }
    } catch {
      return noStore(NextResponse.json({ configured: true, authenticated: false, error: "Invalid request origin." }, { status: 403 }));
    }
  }

  let body: { password?: unknown } = {};
  try {
    body = await request.json() as { password?: unknown };
  } catch {
    return noStore(NextResponse.json({ configured: true, authenticated: false, error: "Enter the teacher password." }, { status: 400 }));
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!constantTimeEqual(password, config.password)) {
    return noStore(NextResponse.json({ configured: true, authenticated: false, error: "That teacher password is not correct." }, { status: 401 }));
  }

  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const token = `${expiry}.${signExpiry(expiry, config.secret)}`;
  const response = noStore(NextResponse.json({ configured: true, authenticated: true }));
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
    expires: new Date(Number(expiry) * 1000),
  });
  return response;
}

export async function DELETE() {
  const response = noStore(NextResponse.json({ configured: Boolean(getConfig()), authenticated: false }));
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
