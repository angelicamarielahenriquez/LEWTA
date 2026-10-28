/**
 * Review Rush: falling meteors as real game state.
 *
 * Positions are kept in the game state and advanced by a game loop (see app/page.tsx).
 * y is a percentage of the play area: 0 = meteor touching the top, 100 = touching the ground.
 * Negative y means the meteor is still above the play area (staggered start).
 */
import type { GameOption } from "@/types/lewta";

export type MeteorStatus = "falling" | "destroyed" | "landed" | "missed" | "lost";
export type Meteor = { id: string; value: string; correct: boolean; lane: number; y: number; speed: number; status: MeteorStatus };
export type WaveOutcome = "pending" | "success" | "failed";

/** Left edge of each lane (percent). Meteors are 22% wide, so they never leave the play area. */
export const RUSH_LANES = [1.5, 26.5, 51.5, 76.5];
export const RUSH_GROUND = 100;
/** Seconds for the whole Review Rush (10 words). Meteors are the real pressure; this is a safety limit. */
export const RUSH_TIME_LIMIT = 180;

export function createMeteors(options: GameOption[], random: () => number = Math.random): Meteor[] {
  const lanes = [...RUSH_LANES.keys()].sort(() => random() - 0.5);
  const order = [...options.keys()].sort(() => random() - 0.5); // which meteor starts first
  return options.map((o, i) => ({
    id: `${o.pairId}-${i}-${o.value}`,
    value: o.value,
    correct: o.correct,
    lane: lanes[i % lanes.length],
    y: -12 - order.indexOf(i) * 24, // staggered starting heights
    speed: 12 + random() * 5, // 12–17 % of the play area per second
    status: "falling" as const,
  }));
}

/** Moves every falling meteor. Meteors that reach the ground become "landed" (correct) or "missed" (wrong). */
export function stepMeteors(meteors: Meteor[], dtSeconds: number): { meteors: Meteor[]; missed: number; landed: number } {
  let missed = 0; let landed = 0;
  const next = meteors.map((m) => {
    if (m.status !== "falling") return m;
    const y = m.y + m.speed * dtSeconds;
    if (y < RUSH_GROUND) return { ...m, y };
    if (m.correct) { landed++; return { ...m, y: RUSH_GROUND, status: "landed" as const }; }
    missed++; return { ...m, y: RUSH_GROUND, status: "missed" as const };
  });
  return { meteors: next, missed, landed };
}

/** A click on a meteor. Wrong meteor → destroyed. Correct synonym → lost (costs a life). */
export function hitMeteor(meteors: Meteor[], id: string): { meteors: Meteor[]; kind: "destroyed" | "lost" | null } {
  const target = meteors.find((m) => m.id === id);
  if (!target || target.status !== "falling" || target.y < -2) return { meteors, kind: null };
  const kind = target.correct ? "lost" as const : "destroyed" as const;
  return { meteors: meteors.map((m) => (m.id === id ? { ...m, status: kind } : m)), kind };
}

/** Success only when every wrong meteor was destroyed AND the correct synonym reached the ground. */
export function waveOutcome(meteors: Meteor[]): WaveOutcome {
  if (meteors.some((m) => m.status === "falling")) {
    // Already lost? (correct synonym clicked or a wrong meteor landed) — the wave still finishes falling.
    return "pending";
  }
  const wrongCleared = meteors.filter((m) => !m.correct).every((m) => m.status === "destroyed");
  const correctLanded = meteors.some((m) => m.correct && m.status === "landed");
  return wrongCleared && correctLanded ? "success" : "failed";
}

export const destroyedCount = (meteors: Meteor[]) => meteors.filter((m) => !m.correct && m.status === "destroyed").length;
export const wrongCount = (meteors: Meteor[]) => meteors.filter((m) => !m.correct).length;
