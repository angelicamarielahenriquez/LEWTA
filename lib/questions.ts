/**
 * Question helpers shared by the five games.
 * Key safety rule: a multiple-choice or Review Rush question never shows, as a "wrong" option,
 * another synonym that also correctly matches the target word.
 */
import { cityDecks, newYorkBossPairs, roundInfo } from "@/lib/gameData";
import type { GameOption, Pair } from "@/types/lewta";

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

/**
 * Groups words that mean the same thing inside one world.
 * Example: acquire→obtain, acquire→gain and obtain→gain all belong to one group,
 * so "gain" can never appear as a wrong option for "acquire".
 */
const groupCache = new Map<Pair[], Map<string, string>>();
function synonymGroups(source: Pair[]): Map<string, string> {
  const cached = groupCache.get(source);
  if (cached) return cached;
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(x, root);
    return root;
  };
  for (const p of source) parent.set(find(normalizeAnswer(p.a)), find(normalizeAnswer(p.b)));
  const groups = new Map<string, string>();
  for (const p of source) {
    groups.set(normalizeAnswer(p.a), find(normalizeAnswer(p.a)));
    groups.set(normalizeAnswer(p.b), find(normalizeAnswer(p.b)));
  }
  groupCache.set(source, groups);
  return groups;
}

/** Every answer that should count as "the same meaning" as this pair. */
export function equivalentAnswers(pair: Pair, source: Pair[]): Set<string> {
  const groups = synonymGroups(source);
  const root = groups.get(normalizeAnswer(pair.a)) ?? groups.get(normalizeAnswer(pair.b));
  const out = new Set<string>([normalizeAnswer(pair.a), normalizeAnswer(pair.b)]);
  if (!root) return out;
  for (const [word, r] of groups) if (r === root) out.add(word);
  return out;
}

/** Synonyms from the world that are safe to use as wrong options for this pair. */
export function safeDistractors(pair: Pair, source: Pair[]): string[] {
  const blocked = equivalentAnswers(pair, source);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of source) {
    const key = normalizeAnswer(p.b);
    if (blocked.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(p.b);
  }
  return out;
}

export function createQuestionOptions(pair: Pair, source: Pair[], random: () => number = Math.random): GameOption[] {
  // Business City Boss curated prompts carry purpose-written choices.
  if (pair.businessQuestion && pair.choices && pair.choices.length >= 4) {
    const values = shuffle(Array.from(new Set(pair.choices.map((v) => v.trim()).filter(Boolean))), random);
    return values.map((value) => ({ value, pairId: pair.id, correct: normalizeAnswer(value) === normalizeAnswer(pair.b) }));
  }
  const distractors = shuffle(safeDistractors(pair, source), random).slice(0, 3);
  return shuffle([pair.b, ...distractors], random).map((value) => ({ value, pairId: pair.id, correct: value === pair.b }));
}

/** Used by Words to Revisit so the choices never reshuffle during a click. */
export function createStableQuestionOptions(pair: Pair, source: Pair[]): GameOption[] {
  const candidates = safeDistractors(pair, source);
  const score = (value: string) => Array.from(value.toLowerCase()).reduce((sum, ch) => sum + ch.charCodeAt(0), pair.id * 31) % 997;
  candidates.sort((x, y) => score(x) - score(y));
  const distractors = candidates.slice(0, 3);
  const answerIndex = pair.id % 4;
  const values: string[] = [];
  for (let i = 0; i < 4; i++) values.push(i === answerIndex ? pair.b : distractors.shift() || pair.b);
  return values.map((value) => ({ value, pairId: pair.id, correct: value === pair.b }));
}

function locateTarget(pair: Pair) {
  const ex = pair.example || "";
  const escaped = pair.a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|[^A-Za-z0-9])(${escaped})(?=$|[^A-Za-z0-9])`, "i").exec(ex);
  if (!match || match.index === undefined) return null;
  const start = match.index + match[1].length;
  return { ex, start, end: start + match[2].length };
}

/** The sentence split around the blank: [before, after]. */
export function sentenceParts(pair: Pair): { before: string; target: string; after: string } | null {
  const hit = locateTarget(pair);
  if (!hit) return null;
  return { before: hit.ex.slice(0, hit.start), target: hit.ex.slice(hit.start, hit.end), after: hit.ex.slice(hit.end) };
}

/** Which pairs each mission uses. Positions 1–10, 11–20, 21–30, 31–40 and all 80 for the Boss. */
export function buildRoundPairs(cityId: string, roundIndex: number, missedIds: number[], random: () => number = Math.random): Pair[] {
  const deck = cityDecks[cityId] || cityDecks["new-york"];
  const mode = roundInfo[roundIndex].mode;
  let pairs: Pair[];
  if (mode === "boss") {
    if (cityId === "new-york") {
      // Keep 80 questions: the 11 curated prompts first, without repeating their answers.
      const curated = new Set(newYorkBossPairs.map((p) => normalizeAnswer(p.b)));
      const retained = deck.filter((p) => !curated.has(normalizeAnswer(p.a)) && !curated.has(normalizeAnswer(p.b)));
      pairs = [...newYorkBossPairs, ...retained.slice(0, 80 - newYorkBossPairs.length)];
    } else pairs = deck.slice(0, 80);
  } else if (mode === "review") {
    const base = deck.slice(30, 40);
    const missed = missedIds.map((id) => deck.find((p) => p.id === id)).filter((p): p is Pair => Boolean(p));
    // Mix up to five missed words with this round's words (original rule).
    const extra = shuffle(missed.filter((m) => !base.some((p) => p.id === m.id)), random).slice(0, 5);
    pairs = [...extra, ...base.filter((p) => !extra.some((m) => m.id === p.id)).slice(0, 10 - extra.length)];
    if (pairs.length === 0) pairs = base;
  } else {
    pairs = deck.slice(roundIndex * 10, roundIndex * 10 + 10);
  }
  return pairs.length ? pairs : deck.slice(0, 10);
}
