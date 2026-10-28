import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMissionComplete, defaultProgress, describeRecovery, mergeProgress, migrateLegacyProgress, nextStreak, reconcileProgress } from "@/lib/progress";
import { aliens, playOrder, roundInfo } from "@/lib/gameData";

const day = (s: string) => new Date(`${s}T12:00:00`);

test("first completion gives full XP and gems; replay gives 20% XP and no gems", () => {
  let p = defaultProgress();
  const first = applyMissionComplete(p, "new-york", 0, day("2026-10-01"));
  assert.equal(first.xpEarned, roundInfo[0].reward);
  assert.equal(first.gemsEarned, roundInfo[0].gemReward);
  assert.equal(first.progress.gems, 20 + roundInfo[0].gemReward);
  p = first.progress;
  const again = applyMissionComplete(p, "new-york", 0, day("2026-10-01"));
  assert.equal(again.replay, true);
  assert.equal(again.xpEarned, 20);
  assert.equal(again.gemsEarned, 0);
});

test("completing all five missions unlocks the next city, its alien and the city reward exactly once", () => {
  let p = defaultProgress();
  let last;
  for (let i = 0; i < 5; i++) { last = applyMissionComplete(p, "panama-city", i, day("2026-10-01")); p = last.progress; }
  assert.ok(last);
  assert.equal(last.newCityId, "london");
  assert.equal(last.newAlienId, "luna");
  assert.equal(last.newAccessoryId, "explorer-pack");
  assert.ok(p.unlockedAliens.includes("luna"));
  const replay = applyMissionComplete(p, "panama-city", 4, day("2026-10-01"));
  assert.equal(replay.newAlienId, undefined);
  assert.equal(replay.newCityId, undefined);
  assert.equal(replay.progress.unlockedAliens.filter((a) => a === "luna").length, 1);
});

test("old saves with completed cities but missing aliens are repaired without extra XP or gems", () => {
  const old = { xp: 900, gems: 33, streak: 2, unlockedCities: ["new-york"], completedRounds: { "new-york": [0, 1, 2, 3, 4], "panama-city": [0, 1, 2, 3, 4], london: [0, 1] },
    unlockedAliens: ["ziggy"], unlockedAccessories: ["starter-cap"], selectedAlien: "ziggy", equippedAccessory: "starter-cap" };
  const fixed = migrateLegacyProgress(old);
  assert.deepEqual(fixed.unlockedAliens, ["ziggy", "luna"]);
  assert.ok(fixed.unlockedCities.includes("panama-city") && fixed.unlockedCities.includes("london"));
  assert.ok(!fixed.unlockedCities.includes("tokyo"));
  assert.ok(fixed.unlockedAccessories.includes("cool-glasses") && fixed.unlockedAccessories.includes("explorer-pack"));
  assert.equal(fixed.xp, 900);
  assert.equal(fixed.gems, 33);
  const report = describeRecovery(old, fixed);
  assert.deepEqual(report.aliens, ["luna"]);
});

test("the real Supabase record shape (no updatedAt) loads safely", () => {
  const cloud = { xp: 1500, gems: 40, streak: 1, lastActiveDay: "2026-10-27", completedRounds: { "new-york": [0, 1, 2, 3, 4], "panama-city": [0, 1, 2, 3] },
    unlockedCities: ["new-york", "panama-city"], unlockedAliens: ["ziggy"], unlockedAccessories: ["starter-cap", "cool-glasses"], selectedAlien: "ziggy",
    equippedAccessory: "cool-glasses", masteredPairIds: {}, missedPairIds: {}, masteryCounts: {} };
  const p = migrateLegacyProgress(cloud);
  assert.deepEqual(p.unlockedAliens, ["ziggy"]); // New York's alien is Ziggy; Luna needs Panama City complete
  assert.equal(p.xp, 1500);
  assert.deepEqual(p.completedRounds["panama-city"], [0, 1, 2, 3]);
});

test("merging an older device never removes newer achievements", () => {
  const older = migrateLegacyProgress({ xp: 100, gems: 22, completedRounds: { "new-york": [0] }, updatedAt: "2026-10-01T10:00:00Z" });
  const newer = migrateLegacyProgress({ xp: 600, gems: 15, completedRounds: { "new-york": [0, 1, 2] }, unlockedAccessories: ["starter-cap", "cool-glasses"], updatedAt: "2026-10-02T10:00:00Z" });
  for (const merged of [mergeProgress(older, newer), mergeProgress(newer, older)]) {
    assert.deepEqual(merged.completedRounds["new-york"], [0, 1, 2]);
    assert.equal(merged.xp, 600);
    assert.equal(merged.gems, 15); // gem balance comes from the newest copy (purchases are respected)
    assert.ok(merged.unlockedAccessories.includes("cool-glasses"));
  }
  const otherDevice = migrateLegacyProgress({ xp: 300, completedRounds: { "new-york": [0, 3] }, updatedAt: "2026-09-01T00:00:00Z" });
  assert.deepEqual(mergeProgress(newer, otherDevice).completedRounds["new-york"], [0, 1, 2, 3]);
});

test("streak grows on consecutive days and restarts after a missed day", () => {
  const p = { ...defaultProgress(), streak: 4, lastActiveDay: "2026-10-09" };
  assert.equal(nextStreak(p, day("2026-10-10")).streak, 5);
  assert.equal(nextStreak(p, day("2026-10-09")).streak, 4);
  assert.equal(nextStreak(p, day("2026-10-12")).streak, 1);
});

test("selected alien and accessory always point to owned items", () => {
  const { progress } = reconcileProgress({ ...defaultProgress(), selectedAlien: "blue", equippedAccessory: "magic-hat" });
  assert.equal(progress.selectedAlien, "ziggy");
  assert.equal(progress.equippedAccessory, "starter-cap");
});

test("every city has exactly one alien and twelve aliens exist (including Blue)", () => {
  assert.equal(aliens.length, 12);
  for (const c of playOrder) assert.equal(aliens.filter((a) => a.unlockCity === c).length, 1);
  assert.ok(aliens.some((a) => a.id === "blue" && a.unlockCity === "rio-de-janeiro"));
});
