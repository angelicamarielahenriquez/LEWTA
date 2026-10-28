/** Builds the Teacher Dashboard rows from Supabase (accounts) and this browser (guests). */
import { isSupabaseConfigured } from "@/lib/supabase";
import { readLocalSessions, type StudentSessionRecord } from "@/lib/activity";
import { readLocalComments, type VisitorComment } from "@/lib/comments";

export type TeacherRow = {
  recordKey: string; student_type: string; first_name: string; last_name: string; username: string; promotion: string;
  xp: number; gems: number; streak: number; game_progress: Record<string, unknown> & { unlockedCities?: string[]; completedRounds?: Record<string, number[]> };
  sessions: StudentSessionRecord[]; roundsPlayed: StudentSessionRecord["roundsPlayed"]; citiesVisited: string[];
  questionAttempts: number; questionsCompleted: number; correctAnswers: number; incorrectAnswers: number;
  sessionStart: string | null; sessionEnd: string | null;
};

function summarize(sessions: StudentSessionRecord[]) {
  return {
    sessions,
    roundsPlayed: sessions.flatMap((s) => s.roundsPlayed || []),
    citiesVisited: Array.from(new Set(sessions.flatMap((s) => s.citiesVisited || []))),
    questionAttempts: sessions.reduce((n, s) => n + (s.questionAttempts || 0), 0),
    questionsCompleted: sessions.reduce((n, s) => n + (s.questionsCompleted || 0), 0),
    correctAnswers: sessions.reduce((n, s) => n + (s.correctAnswers || 0), 0),
    incorrectAnswers: sessions.reduce((n, s) => n + (s.incorrectAnswers || 0), 0),
    sessionStart: sessions.map((s) => s.sessionStart).sort()[0] || null,
    sessionEnd: sessions.map((s) => s.sessionEnd).filter((x): x is string => Boolean(x)).sort().at(-1) || null,
  };
}
const readJson = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || "{}") as Record<string, unknown>; } catch { return {}; } };

export async function loadTeacherData(): Promise<{ rows: TeacherRow[]; comments: VisitorComment[]; notice?: string }> {
  const sessions = readLocalSessions();
  const accounts = readJson("lewta_accounts") as Record<string, { username?: string; firstName?: string; lastName?: string; promotion?: string }>;
  const legacyRows: TeacherRow[] = Object.values(accounts).map((a) => {
    const username = String(a.username || "").toLowerCase();
    const saved = readJson(`lewta_progress_${username}`);
    const mine = sessions.filter((s) => s.studentType === "Account" && s.username.toLowerCase() === username);
    return { recordKey: `student:${username}`, student_type: "Account", first_name: a.firstName || "", last_name: a.lastName || "", username: a.username || "", promotion: a.promotion || "",
      xp: Number(saved.xp) || 0, gems: Number(saved.gems) || 0, streak: Number(saved.streak) || 0, game_progress: saved, ...summarize(mine) };
  });
  const groups = new Map<string, StudentSessionRecord[]>();
  for (const s of sessions.filter((x) => x.studentType === "Guest")) {
    const key = s.guestId || s.studentId || s.sessionId; groups.set(key, [...(groups.get(key) || []), s]);
  }
  const guestRows: TeacherRow[] = Array.from(groups.entries()).map(([key, list]) => {
    const latest = [...list].sort((x, y) => y.sessionStart.localeCompare(x.sessionStart))[0];
    const saved = readJson(`lewta_progress_${latest.username.toLowerCase()}`);
    return { recordKey: `guest:${key}`, student_type: "Guest", first_name: latest.firstName, last_name: latest.lastName, username: latest.username, promotion: "Guest",
      xp: Number(saved.xp) || 0, gems: Number(saved.gems) || 0, streak: Number(saved.streak) || 0, game_progress: saved, ...summarize(list) };
  });
  let rows = [...legacyRows, ...guestRows];
  let comments = readLocalComments();
  let notice: string | undefined;
  if (isSupabaseConfigured) {
    try {
      const response = await fetch("/api/teacher-data", { method: "GET", cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.configured && Array.isArray(result.students)) {
        rows = [...(result.students as TeacherRow[]), ...guestRows];
        if (Array.isArray(result.comments)) comments = [...result.comments.map((c: { name: string; message: string; created_at: string }) => ({ name: c.name, message: c.message, date: c.created_at })), ...comments];
      } else if (response.status === 401) { rows = guestRows; notice = "Teacher session expired. Unlock the Teacher Dashboard again to load cloud student records."; }
      else { rows = guestRows; notice = result.error || "Supabase class reporting is not configured yet. Local guest records are still available."; }
    } catch { rows = guestRows; notice = "Could not reach Supabase class reporting. Local guest records are still available."; }
  }
  rows.sort((x, y) => String(x.last_name || "").localeCompare(String(y.last_name || "")));
  return { rows, comments, notice };
}
