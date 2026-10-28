/**
 * Student progress rules: defaults, safe repair of old saves, merging progress from
 * two devices, and the rewards for finishing a mission.
 *
 * Safety principles
 * - Nothing a student has earned is ever removed by these functions.
 * - Repairing old saves restores aliens, destinations and city rewards that the student's
 *   completed missions prove they earned, WITHOUT adding XP or gems.
 */
import { accessories, aliens, cityRewardAccessory, playOrder, replayXp, roundInfo } from "@/lib/gameData";
import type { Progress } from "@/types/lewta";

export const defaultProgress = (): Progress => ({
  xp: 0, gems: 20, streak: 0, unlockedCities: ["new-york"], completedRounds: {}, missedPairIds: {}, masteredPairIds: {},
  masteryCounts: {}, selectedAlien: "ziggy", unlockedAliens: ["ziggy"], equippedAccessory: "starter-cap",
  unlockedAccessories: ["starter-cap"], lastActiveDay: "", bio: "",
});

const uniq = <T,>(list: T[]) => Array.from(new Set(list));
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const numList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isFinite(x)) : []);
const recordOf = <T,>(v: unknown, map: (x: unknown) => T): Record<string, T> => {
  const out: Record<string, T> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = map(x);
  return out;
};

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const isCityComplete = (p: Progress, cityId: string) => [0, 1, 2, 3, 4].every((i) => (p.completedRounds[cityId] || []).includes(i));

export type RecoveryReport = { aliens: string[]; cities: string[]; accessories: string[] };

/**
 * Makes saved progress consistent with the missions the student has really completed.
 * Returns what had to be restored so the app can tell the student.
 */
export function reconcileProgress(input: Progress): { progress: Progress; recovered: RecoveryReport } {
  const p: Progress = { ...input };
  const recovered: RecoveryReport = { aliens: [], cities: [], accessories: [] };
  const validCity = new Set(playOrder);
  const rounds: Record<string, number[]> = {};
  for (const [city, list] of Object.entries(p.completedRounds || {})) {
    if (!validCity.has(city)) continue;
    rounds[city] = uniq(list.filter((i) => Number.isInteger(i) && i >= 0 && i < roundInfo.length)).sort((x, y) => x - y);
  }
  p.completedRounds = rounds;
  const unlockedCities = new Set(p.unlockedCities.filter((c) => validCity.has(c)));
  const unlockedAliens = new Set(p.unlockedAliens.filter((a) => aliens.some((x) => x.id === a)));
  const owned = new Set(p.unlockedAccessories.filter((a) => accessories.some((x) => x.id === a)));
  unlockedCities.add("new-york"); unlockedAliens.add("ziggy"); owned.add("starter-cap");
  playOrder.forEach((cityId, index) => {
    const played = (rounds[cityId] || []).length > 0;
    if (played && !unlockedCities.has(cityId)) { unlockedCities.add(cityId); recovered.cities.push(cityId); }
    if (!isCityComplete(p, cityId)) return;
    const next = playOrder[index + 1];
    if (next && !unlockedCities.has(next)) { unlockedCities.add(next); recovered.cities.push(next); }
    const alien = aliens.find((a) => a.unlockCity === cityId);
    if (alien && !unlockedAliens.has(alien.id)) { unlockedAliens.add(alien.id); recovered.aliens.push(alien.id); }
    const reward = cityRewardAccessory(cityId);
    if (reward && !owned.has(reward.id)) { owned.add(reward.id); recovered.accessories.push(reward.id); }
  });
  p.unlockedCities = playOrder.filter((c) => unlockedCities.has(c));
  p.unlockedAliens = aliens.map((a) => a.id).filter((a) => unlockedAliens.has(a));
  p.unlockedAccessories = accessories.map((a) => a.id).filter((a) => owned.has(a));
  if (!p.unlockedAliens.includes(p.selectedAlien)) p.selectedAlien = "ziggy";
  if (!p.unlockedAccessories.includes(p.equippedAccessory)) p.equippedAccessory = "starter-cap";
  return { progress: p, recovered };
}

/** Reads any saved progress (old or new format) without losing information. */
export function migrateLegacyProgress(value: unknown): Progress {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const d = defaultProgress();
  const p: Progress = {
    xp: num(v.xp, d.xp),
    gems: num(v.gems, d.gems),
    streak: num(v.streak, d.streak),
    unlockedCities: strList(v.unlockedCities).length ? strList(v.unlockedCities) : d.unlockedCities,
    completedRounds: recordOf(v.completedRounds, numList),
    missedPairIds: recordOf(v.missedPairIds, numList),
    masteredPairIds: recordOf(v.masteredPairIds, numList),
    masteryCounts: recordOf(v.masteryCounts, (x) => recordOf(x, (n) => num(n))),
    selectedAlien: typeof v.selectedAlien === "string" ? v.selectedAlien : d.selectedAlien,
    unlockedAliens: strList(v.unlockedAliens).length ? strList(v.unlockedAliens) : d.unlockedAliens,
    equippedAccessory: typeof v.equippedAccessory === "string" ? v.equippedAccessory : d.equippedAccessory,
    unlockedAccessories: strList(v.unlockedAccessories).length ? strList(v.unlockedAccessories) : d.unlockedAccessories,
    lastActiveDay: typeof v.lastActiveDay === "string" ? v.lastActiveDay : "",
    bio: typeof v.bio === "string" ? v.bio.slice(0, 250) : "",
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : undefined,
  };
  return reconcileProgress(p).progress;
}

const time = (p: Progress) => (p.updatedAt ? Date.parse(p.updatedAt) || 0 : 0);

/**
 * Combines two copies of the same student's progress (for example: this device and the cloud).
 * Earned things are added together (never lost). Choices like the selected alien and the gem
 * balance come from the most recently changed copy.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const [newer, older] = time(a) >= time(b) ? [a, b] : [b, a];
  const unionRecord = (x: Record<string, number[]>, y: Record<string, number[]>) => {
    const out: Record<string, number[]> = {};
    for (const k of uniq([...Object.keys(x), ...Object.keys(y)])) out[k] = uniq([...(x[k] || []), ...(y[k] || [])]).sort((m, n) => m - n);
    return out;
  };
  const mastered = unionRecord(newer.masteredPairIds, older.masteredPairIds);
  const missed: Record<string, number[]> = {};
  for (const [k, ids] of Object.entries(newer.missedPairIds)) missed[k] = ids.filter((id) => !(mastered[k] || []).includes(id));
  const latestDay = newer.lastActiveDay >= older.lastActiveDay ? newer : older;
  const merged: Progress = {
    ...newer,
    xp: Math.max(newer.xp, older.xp),
    gems: newer.gems,
    streak: newer.lastActiveDay === older.lastActiveDay ? Math.max(newer.streak, older.streak) : latestDay.streak,
    lastActiveDay: latestDay.lastActiveDay,
    unlockedCities: uniq([...newer.unlockedCities, ...older.unlockedCities]),
    completedRounds: unionRecord(newer.completedRounds, older.completedRounds),
    masteredPairIds: mastered,
    missedPairIds: missed,
    unlockedAliens: uniq([...newer.unlockedAliens, ...older.unlockedAliens]),
    unlockedAccessories: uniq([...newer.unlockedAccessories, ...older.unlockedAccessories]),
    bio: newer.bio ?? older.bio ?? "",
    updatedAt: newer.updatedAt || older.updatedAt,
  };
  return reconcileProgress(merged).progress;
}

/** Streak: +1 if the last active day was yesterday, back to 1 after a missed day. */
export function nextStreak(p: Progress, today = new Date()) {
  const todayKey = dateKey(today);
  if (p.lastActiveDay === todayKey) return { streak: Math.max(1, p.streak), lastActiveDay: todayKey };
  const y = new Date(today); y.setDate(y.getDate() - 1);
  return { streak: p.lastActiveDay === dateKey(y) ? p.streak + 1 : 1, lastActiveDay: todayKey };
}

export type CompletionResult = {
  progress: Progress; xpEarned: number; gemsEarned: number; replay: boolean; cityComplete: boolean;
  newCityId?: string; newAlienId?: string; newAccessoryId?: string;
};

/** Rewards for finishing a mission (original LEWTA amounts). */
export function applyMissionComplete(prev: Progress, cityId: string, roundIndex: number, today = new Date()): CompletionResult {
  const replay = (prev.completedRounds[cityId] || []).includes(roundIndex);
  const info = roundInfo[roundIndex];
  const xpEarned = replay ? replayXp(roundIndex) : info.reward;
  const gemsEarned = replay ? 0 : info.gemReward;
  const { streak, lastActiveDay } = nextStreak(prev, today);
  const base: Progress = {
    ...prev, xp: prev.xp + xpEarned, gems: prev.gems + gemsEarned, streak, lastActiveDay,
    completedRounds: { ...prev.completedRounds, [cityId]: uniq([...(prev.completedRounds[cityId] || []), roundIndex]).sort((x, y) => x - y) },
  };
  const before = { cities: new Set(prev.unlockedCities), aliens: new Set(prev.unlockedAliens), acc: new Set(prev.unlockedAccessories) };
  const progress = reconcileProgress(base).progress;
  const cityComplete = isCityComplete(progress, cityId);
  const next = playOrder[playOrder.indexOf(cityId) + 1];
  const alien = aliens.find((x) => x.unlockCity === cityId);
  const reward = cityRewardAccessory(cityId);
  return {
    progress, xpEarned, gemsEarned, replay, cityComplete,
    newCityId: next && progress.unlockedCities.includes(next) && !before.cities.has(next) ? next : undefined,
    newAlienId: alien && progress.unlockedAliens.includes(alien.id) && !before.aliens.has(alien.id) ? alien.id : undefined,
    newAccessoryId: reward && progress.unlockedAccessories.includes(reward.id) && !before.acc.has(reward.id) ? reward.id : undefined,
  };
}

export const levelOf = (xp: number) => Math.max(1, Math.floor(xp / 500) + 1);

/** Lists rewards present in `after` but missing from an old saved copy (used for the "restored" message). */
export function describeRecovery(before: unknown, after: Progress): RecoveryReport {
  const b = (before && typeof before === "object" ? before : {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const had = { aliens: new Set(list(b.unlockedAliens)), cities: new Set(list(b.unlockedCities)), acc: new Set(list(b.unlockedAccessories)) };
  if (!before) return { aliens: [], cities: [], accessories: [] };
  return {
    aliens: after.unlockedAliens.filter((x) => x !== "ziggy" && !had.aliens.has(x)),
    cities: after.unlockedCities.filter((x) => x !== "new-york" && !had.cities.has(x)),
    accessories: after.unlockedAccessories.filter((x) => x !== "starter-cap" && !had.acc.has(x)),
  };
}
