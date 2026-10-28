import { NextRequest, NextResponse } from "next/server";
import { checkTeacher, teacherEmails } from "@/lib/server/teacherAccess";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come from Supabase JSON columns */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

type DbSession = {
  session_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  promotion: string;
  session_start: string;
  session_end: string | null;
  cities_visited: string[] | null;
  rounds_played: unknown[] | null;
  questions_completed: number | null;
  question_attempts: number | null;
  correct_answers: number | null;
  incorrect_answers: number | null;
  scores: number[] | null;
  events: unknown[] | null;
  game_progress: Record<string, unknown> | null;
};

export async function GET(request: NextRequest) {
  // Every request is re-checked: only the verified teacher account can read class data.
  const check = await checkTeacher(request.headers.get("authorization"));
  if (!check.ok) return json({ configured: check.configured, error: check.error }, check.status);
  const admin = check.admin;
  const hidden = new Set(teacherEmails());

  try {
    const [profilesResult, progressResult, sessionsResult] = await Promise.all([
      admin.from("profiles").select("id,email,first_name,last_name,username,promotion,role").order("last_name", { ascending: true }),
      admin.from("player_progress").select("user_id,progress,updated_at"),
      admin.from("student_sessions").select("session_id,user_id,first_name,last_name,username,promotion,session_start,session_end,cities_visited,rounds_played,questions_completed,question_attempts,correct_answers,incorrect_answers,scores,events,game_progress,updated_at").order("session_start", { ascending: false }),
    ]);

    const failed = [profilesResult.error, progressResult.error, sessionsResult.error].find(Boolean);
    if (failed) {
      return json({ configured: true, error: `Could not read LEWTA student data. Run supabase/schema.sql and check the server secret key. ${failed?.message || ""}` }, 500);
    }

    const progressByUser = new Map<string, Record<string, any>>();
    for (const row of progressResult.data || []) progressByUser.set(row.user_id, (row.progress || {}) as Record<string, any>);
    const sessionRows = (sessionsResult.data || []) as unknown as DbSession[];
    const profiles = (profilesResult.data || []).filter((profile) => profile.role !== "teacher" && profile.id !== check.userId && !hidden.has(String(profile.email || "").toLowerCase()));

    const students = profiles.map((profile) => {
      const gameProgress = progressByUser.get(profile.id) || {};
      const rows = sessionRows.filter((session) => session.user_id === profile.id);
      const sessions = rows.map((session) => ({
        studentType: "Account",
        studentId: profile.id,
        sessionId: session.session_id,
        firstName: session.first_name || profile.first_name,
        lastName: session.last_name || profile.last_name,
        username: session.username || profile.username,
        promotion: session.promotion || profile.promotion,
        sessionStart: session.session_start,
        sessionEnd: session.session_end,
        citiesVisited: session.cities_visited || [],
        roundsPlayed: session.rounds_played || [],
        questionsCompleted: Number(session.questions_completed) || 0,
        questionAttempts: Number(session.question_attempts) || 0,
        correctAnswers: Number(session.correct_answers) || 0,
        incorrectAnswers: Number(session.incorrect_answers) || 0,
        scores: session.scores || [],
        events: session.events || [],
      }));
      const roundsPlayed = sessions.flatMap((session: any) => session.roundsPlayed || []);
      const citiesVisited = Array.from(new Set(sessions.flatMap((session: any) => session.citiesVisited || [])));
      const sortedStarts = sessions.map((session: any) => session.sessionStart).filter(Boolean).sort();
      const sortedEnds = sessions.map((session: any) => session.sessionEnd).filter(Boolean).sort();
      return {
        recordKey: `supabase:${profile.id}`,
        student_type: "Account",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || profile.email?.split("@")[0] || "student",
        promotion: profile.promotion || "2026",
        xp: Number(gameProgress.xp) || 0,
        gems: Number(gameProgress.gems) || 0,
        streak: Number(gameProgress.streak) || 0,
        game_progress: gameProgress,
        sessions,
        roundsPlayed,
        citiesVisited,
        questionAttempts: sessions.reduce((sum: number, session: any) => sum + session.questionAttempts, 0),
        questionsCompleted: sessions.reduce((sum: number, session: any) => sum + session.questionsCompleted, 0),
        correctAnswers: sessions.reduce((sum: number, session: any) => sum + session.correctAnswers, 0),
        incorrectAnswers: sessions.reduce((sum: number, session: any) => sum + session.incorrectAnswers, 0),
        scores: sessions.flatMap((session: any) => session.scores || []),
        sessionStart: sortedStarts[0] || null,
        sessionEnd: sortedEnds.at(-1) || null,
        events: sessions.flatMap((session: any) => session.events || []),
      };
    });

    // Optional: visitor comments from the welcome screen. This table exists only if
    // supabase/optional_visitor_comments.sql was run; otherwise comments stay empty.
    const commentsResult = await admin.from("visitor_comments").select("id,name,message,created_at").order("created_at", { ascending: false }).limit(200);
    const comments = commentsResult.error ? null : commentsResult.data;

    return json({ configured: true, students, comments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected Supabase server error.";
    return json({ configured: true, error: `Teacher data could not be loaded. ${message}` }, 500);
  }
}
