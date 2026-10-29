import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultProgress, mergeProgress, migrateLegacyProgress, applyMissionComplete } from "@/lib/progress";
import { clearedSlot, isSavedGame, makeSavedGame, prepareResume, progressLabel } from "@/lib/savedGame";
import { buildRoundPairs } from "@/lib/questions";
import type { GameState } from "@/types/lewta";

const game = (questionIndex: number): GameState => ({
  mode: "context", roundIndex: 2, pairs: buildRoundPairs("new-york", 2, []), matched: [], leftCards: [], rightCards: [], selectedLeft: 3, selectedRight: 4, mismatch: true,
  questionIndex, options: [], input: "", answered: false, answerCorrect: null, chosenValue: "", removed: [], hearts: 3, mistakes: 1,
  correctAnswers: questionIndex - 1, elapsed: 0, total: 10, meteors: [], waveDone: false, over: false, points: 0, speed: 1,
});

test("a saved game survives storage and resumes on the same question", () => {
  const saved = makeSavedGame("new-york", game(6), 0, new Date("2026-10-29T10:00:00Z"));
  const p = migrateLegacyProgress(JSON.parse(JSON.stringify({ ...defaultProgress(), activeGame: saved })));
  assert.ok(isSavedGame(p.activeGame));
  const r = prepareResume(p.activeGame as never);
  assert.equal(r.game.questionIndex, 6);
  assert.equal(progressLabel(r.game), "Question 7 of 10");
  assert.equal(r.game.selectedLeft, null, "no half-finished click is restored");
  assert.equal(r.paused, false, "untimed games continue directly");
  const timed = prepareResume(makeSavedGame("new-york", { ...game(3), mode: "boss", roundIndex: 4 }, 300));
  assert.equal(timed.paused, true, "timed games come back paused");
  assert.equal(timed.timeLeft, 300);
});

test("the newer copy wins: an old device never brings back an older or finished game", () => {
  const older = { ...defaultProgress(), updatedAt: "2026-10-29T10:00:00Z", activeGame: makeSavedGame("new-york", game(2), 0, new Date("2026-10-29T10:00:00Z")) };
  const newer = { ...defaultProgress(), updatedAt: "2026-10-29T10:05:00Z", activeGame: makeSavedGame("new-york", game(7), 0, new Date("2026-10-29T10:05:00Z")) };
  assert.equal((mergeProgress(older, newer).activeGame as ReturnType<typeof makeSavedGame>).game.questionIndex, 7);
  assert.equal((mergeProgress(newer, older).activeGame as ReturnType<typeof makeSavedGame>).game.questionIndex, 7);
  const finished = { ...defaultProgress(), updatedAt: "2026-10-29T10:09:00Z", activeGame: clearedSlot(new Date("2026-10-29T10:09:00Z")) };
  assert.equal(isSavedGame(mergeProgress(newer, finished).activeGame), false, "a finished game stays finished");
});

test("restoring cannot give first-time rewards twice", () => {
  const first = applyMissionComplete(defaultProgress(), "new-york", 0);
  const again = applyMissionComplete(first.progress, "new-york", 0);
  assert.equal(first.replay, false);
  assert.equal(again.replay, true, "finishing the same mission again only gives the small replay bonus");
  assert.equal(again.gemsEarned, 0);
});
