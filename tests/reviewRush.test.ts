import { test } from "node:test";
import assert from "node:assert/strict";
import { RUSH_LANES, createMeteors, hitMeteor, stepMeteors, waveOutcome } from "@/lib/reviewRush";

const options = [
  { value: "finish", pairId: 1, correct: true },
  { value: "cancel", pairId: 1, correct: false },
  { value: "delay", pairId: 1, correct: false },
  { value: "repair", pairId: 1, correct: false },
];
const fall = (meteors: ReturnType<typeof createMeteors>, seconds: number) => {
  let m = meteors; let missed = 0;
  for (let t = 0; t < seconds; t += 0.04) { const s = stepMeteors(m, 0.04); m = s.meteors; missed += s.missed; }
  return { meteors: m, missed };
};

test("Review Rush creates 4 meteors in 4 different lanes, staggered above the play area", () => {
  const m = createMeteors(options);
  assert.equal(m.length, 4);
  assert.equal(new Set(m.map((x) => x.lane)).size, 4);
  assert.equal(new Set(m.map((x) => x.y)).size, 4);
  assert.ok(m.every((x) => x.y < 0 && x.status === "falling"));
  assert.ok(RUSH_LANES.every((left) => left >= 0 && left + 22 <= 100), "meteors stay inside the play area");
});

test("meteors really fall over time", () => {
  const m = createMeteors(options);
  const later = stepMeteors(m, 1).meteors;
  later.forEach((x, i) => assert.ok(x.y > m[i].y));
});

test("destroying the 3 wrong meteors and letting the correct one land is a success", () => {
  let m = fall(createMeteors(options), 6).meteors.map((x) => ({ ...x, y: Math.max(x.y, 10) }));
  for (const w of m.filter((x) => !x.correct)) { const h = hitMeteor(m, w.id); assert.equal(h.kind, "destroyed"); m = h.meteors; }
  assert.equal(waveOutcome(m), "pending");
  const end = fall(m, 20);
  assert.equal(end.missed, 0);
  assert.equal(waveOutcome(end.meteors), "success");
});

test("a wrong meteor that reaches the ground is counted as missed (costs a life)", () => {
  const end = fall(createMeteors(options), 20);
  assert.equal(end.missed, 3);
  assert.equal(waveOutcome(end.meteors), "failed");
});

test("clicking the correct synonym loses it and fails the word", () => {
  let m = fall(createMeteors(options), 6).meteors.map((x) => ({ ...x, y: Math.max(x.y, 10) }));
  const right = m.find((x) => x.correct)!;
  const h = hitMeteor(m, right.id);
  assert.equal(h.kind, "lost");
  m = h.meteors;
  for (const w of m.filter((x) => !x.correct)) m = hitMeteor(m, w.id).meteors;
  assert.equal(waveOutcome(m), "failed");
  assert.equal(hitMeteor(m, right.id).kind, null, "a meteor can only be hit once");
});
