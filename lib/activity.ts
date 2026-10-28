/**
 * Student activity records (sessions, rounds, answers) shown in the Teacher Dashboard.
 * Guests: stored only in this browser. Accounts: also saved to Supabase (student_sessions).
 */
import { supabase } from "@/lib/supabase";
import type { Player, Progress } from "@/types/lewta";

export type GuestRoundRecord = { cityId: string; roundIndex: number; title: string; startedAt: string; finishedAt?: string; passed?: boolean; score?: number; correct?: number; total?: number };
export type StudentSessionRecord = {
  studentType: "Guest" | "Account"; studentId: string; guestId?: string; sessionId: string;
  firstName: string; lastName: string; username: string; promotion?: string;
  sessionStart: string; sessionEnd?: string; citiesVisited: string[]; roundsPlayed: GuestRoundRecord[];
  questionsCompleted: number; questionAttempts: number; correctAnswers: number; incorrectAnswers: number;
  scores: number[]; events: { type: string; at: string; details: Record<string, unknown> }[];
};
export type LegacyGuestSession = Partial<StudentSessionRecord> & { guestId?: string; username?: string; sessionId?: string };

export function mergeLegacyGuestSessions(records: StudentSessionRecord[], legacy: LegacyGuestSession[]): StudentSessionRecord[] {
  const seen = new Set(records.map((r) => r.sessionId));
  for (const item of legacy) {
    const stableId = String(item.sessionId || `legacy-${item.guestId || item.username || "guest"}-${item.sessionStart || "unknown"}`);
    if (seen.has(stableId)) continue;
    records.push({
      studentType: "Guest", studentId: String(item.guestId || item.username || stableId), guestId: item.guestId, sessionId: stableId,
      firstName: String(item.firstName || ""), lastName: String(item.lastName || ""), username: String(item.username || "guest"), promotion: "Guest",
      sessionStart: String(item.sessionStart || new Date().toISOString()), sessionEnd: item.sessionEnd, citiesVisited: item.citiesVisited || [],
      roundsPlayed: item.roundsPlayed || [], questionsCompleted: Number(item.questionsCompleted) || 0, questionAttempts: Number(item.questionAttempts) || 0,
      correctAnswers: Number(item.correctAnswers) || 0, incorrectAnswers: Number(item.incorrectAnswers) || 0, scores: item.scores || [], events: item.events || [],
    });
    seen.add(stableId);
  }
  return records;
}

export function readLocalSessions(): StudentSessionRecord[] {
  try {
    const records = JSON.parse(localStorage.getItem("lewta_student_sessions") || "[]") as StudentSessionRecord[];
    const legacy = JSON.parse(localStorage.getItem("lewta_guest_sessions") || "[]") as LegacyGuestSession[];
    return mergeLegacyGuestSessions(Array.isArray(records) ? records : [], Array.isArray(legacy) ? legacy : []);
  } catch { return []; }
}

async function syncSessionToSupabase(person: Player, row: StudentSessionRecord, progress: Progress | null) {
  if (!supabase || person.storageMode !== "supabase" || !person.authUserId) return;
  try {
    const { error } = await supabase.from("student_sessions").upsert({
      session_id: row.sessionId, user_id: person.authUserId, student_type: "Account",
      first_name: row.firstName, last_name: row.lastName, username: row.username, promotion: row.promotion || "2026",
      session_start: row.sessionStart, session_end: row.sessionEnd || null, cities_visited: row.citiesVisited,
      rounds_played: row.roundsPlayed, questions_completed: row.questionsCompleted, question_attempts: row.questionAttempts,
      correct_answers: row.correctAnswers, incorrect_answers: row.incorrectAnswers, scores: row.scores, events: row.events,
      game_progress: progress ?? {}, updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" });
    if (error) console.warn("LEWTA cloud session sync failed:", error.message);
  } catch (error) {
    console.warn("LEWTA cloud session request failed:", error);
  }
}

/** Records one learning event. It never interrupts the game if storage fails. */
export function recordStudentActivity(person: Player | null, type: string, details: Record<string, unknown> = {}, progress: Progress | null = null) {
  if (!person || !person.username || !person.sessionId || typeof window === "undefined" || person.role === "teacher") return;
  try {
    const records = readLocalSessions();
    const now = new Date().toISOString();
    const studentType = person.role === "guest" ? "Guest" : "Account";
    const studentId = studentType === "Guest" ? (person.guestId || person.id) : person.username.toLowerCase();
    let row = records.find((r) => r.sessionId === person.sessionId);
    if (!row) {
      row = { studentType, studentId, guestId: studentType === "Guest" ? person.guestId : undefined, sessionId: person.sessionId,
        firstName: person.firstName, lastName: person.lastName, username: person.username, promotion: person.promotion,
        sessionStart: now, citiesVisited: [], roundsPlayed: [], questionsCompleted: 0, questionAttempts: 0, correctAnswers: 0, incorrectAnswers: 0, scores: [], events: [] };
      records.push(row);
    }
    row.firstName = person.firstName; row.lastName = person.lastName; row.username = person.username; row.promotion = person.promotion;
    if (type === "session-end") row.sessionEnd = now;
    if (type === "city-visit" && typeof details.cityId === "string" && !row.citiesVisited.includes(details.cityId)) row.citiesVisited.push(details.cityId);
    if (type === "game-start" && typeof details.cityId === "string" && typeof details.roundIndex === "number") {
      const open = row.roundsPlayed.some((r) => r.cityId === details.cityId && r.roundIndex === details.roundIndex && !r.finishedAt);
      if (!open) row.roundsPlayed.push({ cityId: details.cityId, roundIndex: details.roundIndex, title: String(details.title || "Mission"), startedAt: now });
    }
    if (type === "answer") {
      row.questionAttempts += 1;
      if (details.correct === true) row.correctAnswers += 1; else row.incorrectAnswers += 1;
      if (details.completed === true) row.questionsCompleted += 1;
    }
    if (type === "game-finish" && typeof details.cityId === "string" && typeof details.roundIndex === "number") {
      let round = [...row.roundsPlayed].reverse().find((r) => r.cityId === details.cityId && r.roundIndex === details.roundIndex && !r.finishedAt);
      if (!round) { round = { cityId: details.cityId, roundIndex: details.roundIndex, title: String(details.title || "Mission"), startedAt: now }; row.roundsPlayed.push(round); }
      round.finishedAt = now; round.passed = details.passed === true; round.score = Number(details.score) || 0; round.correct = Number(details.correct) || 0; round.total = Number(details.total) || 0;
      row.scores.push(Number(details.score) || 0);
    }
    row.events.push({ type, at: now, details });
    if (row.events.length > 300) row.events = row.events.slice(-300);
    localStorage.setItem("lewta_student_sessions", JSON.stringify(records));
    if (person.storageMode === "supabase") void syncSessionToSupabase(person, row, progress);
  } catch { /* Activity reporting must never interrupt gameplay. */ }
}
