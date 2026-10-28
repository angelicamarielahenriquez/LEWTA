import { NextRequest } from "next/server";
import { checkTeacher, noStoreJson } from "@/lib/server/teacherAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Is the signed-in account the teacher?
 * The browser sends its Supabase access token; the answer comes only from the server.
 */
export async function GET(request: NextRequest) {
  const check = await checkTeacher(request.headers.get("authorization"));
  if (!check.ok) return noStoreJson({ configured: check.configured, teacher: false, error: check.error }, check.status === 503 ? 503 : 200);
  return noStoreJson({ configured: true, teacher: true });
}
