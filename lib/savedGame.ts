/**
 * "Continue where you left off": the game a student was playing, saved inside their progress record
 * (localStorage for guests and as an offline copy; Supabase player_progress for accounts — no new tables).
 * Rewards are only given when a mission is finished, so restoring a game can never give XP or gems twice.
 */
import { roundInfo } from "@/lib/gameData";
import type { GameState } from "@/types/lewta";

export type SavedGame = { v: 1; savedAt: string; cityId: string; roundIndex: number; timeLeft: number; game: GameState };
export type ActiveGameSlot = SavedGame | { cleared: true; savedAt: string };

export const isSavedGame = (s: unknown): s is SavedGame => {
  const x = s as SavedGame | null;
  return Boolean(x && typeof x === "object" && x.v === 1 && typeof x.savedAt === "string" && typeof x.cityId === "string"
    && x.game && typeof x.game === "object" && Array.isArray(x.game.pairs) && x.game.pairs.length > 0 && typeof x.game.mode === "string");
};
const isSlot = (s: unknown): s is ActiveGameSlot => isSavedGame(s) || Boolean(s && typeof s === "object" && (s as { cleared?: boolean }).cleared === true && typeof (s as { savedAt?: string }).savedAt === "string");

/** Keeps a valid slot from stored JSON (anything else is ignored). */
export function readSlot(value: unknown): ActiveGameSlot | undefined { return isSlot(value) ? value : undefined; }

/** The newer of two copies wins, so an old device never brings back a finished or replaced game. */
export function newerSlot(a?: ActiveGameSlot, b?: ActiveGameSlot): ActiveGameSlot | undefined {
  if (!a) return b; if (!b) return a;
  return Date.parse(a.savedAt) >= Date.parse(b.savedAt) ? a : b;
}

export function makeSavedGame(cityId: string, game: GameState, timeLeft: number, now = new Date()): SavedGame {
  return { v: 1, savedAt: now.toISOString(), cityId, roundIndex: game.roundIndex, timeLeft, game };
}
export const clearedSlot = (now = new Date()): ActiveGameSlot => ({ cleared: true, savedAt: now.toISOString() });

/** A safe state to continue from: no half-finished click, and paused if the game is timed or animated. */
export function prepareResume(s: SavedGame): { game: GameState; timeLeft: number; paused: boolean } {
  const g = s.game;
  const game: GameState = { ...g, selectedLeft: null, selectedRight: null, mismatch: false, over: false, speed: g.speed || 1, meteors: g.meteors || [] };
  const timed = roundInfo[s.roundIndex]?.time != null;
  return { game, timeLeft: timed ? Math.max(1, s.timeLeft) : 0, paused: timed };
}

/** "Question 7 of 10" / "Pair 4 of 10". */
export function progressLabel(g: GameState): string {
  if (g.mode === "match" || g.mode === "speed") return `Pair ${Math.min(g.matched.length + 1, g.pairs.length)} of ${g.pairs.length}`;
  return `Question ${Math.min(g.questionIndex + 1, g.pairs.length)} of ${g.pairs.length}`;
}
