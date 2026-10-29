import { test } from "node:test";
import assert from "node:assert/strict";
import { cityDecks, playOrder, roundInfo } from "@/lib/gameData";
import { buildRoundPairs, createQuestionOptions, createStableQuestionOptions, equivalentAnswers, normalizeAnswer, sentenceParts } from "@/lib/questions";

test("every world has 80 pairs and 960 unique IDs in total", () => {
  const ids = new Set<number>();
  for (const c of playOrder) { assert.equal(cityDecks[c].length, 80, c); cityDecks[c].forEach((p) => ids.add(p.id)); }
  assert.equal(ids.size, 960);
});

test("every sentence contains its target word exactly once and has no duplicate", () => {
  const seen = new Set<string>();
  for (const c of playOrder) for (const p of cityDecks[c]) {
    assert.ok(sentenceParts(p), `${p.deckId}: target "${p.a}" not found`);
    const esc = p.a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = (p.example.match(new RegExp(`(^|[^A-Za-z0-9])${esc}(?=$|[^A-Za-z0-9])`, "gi")) || []).length;
    assert.equal(count, 1, `${p.deckId}`);
    const key = p.example.toLowerCase();
    assert.ok(!seen.has(key), `duplicate sentence ${p.deckId}`); seen.add(key);
  }
});

test("multiple-choice and Review Rush options never contain a second correct synonym", () => {
  let checked = 0;
  for (const c of playOrder) {
    const deck = cityDecks[c];
    for (const p of deck) {
      const ok = equivalentAnswers(p, deck);
      for (let k = 0; k < 3; k++) {
        const opts = createQuestionOptions(p, deck);
        assert.equal(opts.filter((o) => o.correct).length, 1);
        for (const o of opts) if (!o.correct) assert.ok(!ok.has(normalizeAnswer(o.value)), `${p.deckId}: "${o.value}" is also correct`);
        assert.equal(new Set(opts.map((o) => normalizeAnswer(o.value))).size, opts.length);
        checked++;
      }
      const stable = createStableQuestionOptions(p, deck);
      assert.equal(stable.filter((o) => o.correct).length, 1);
    }
  }
  assert.ok(checked > 2800);
});

test("Learn & Match, Speed Match, Context Match and Review Rush rounds have ten distinct meanings", () => {
  for (const c of playOrder) for (let r = 0; r < 4; r++) {
    const pairs = buildRoundPairs(c, r, []);
    assert.equal(pairs.length, 10);
    const groups = pairs.map((p) => [...equivalentAnswers(p, cityDecks[c])].sort().join("|"));
    assert.equal(new Set(groups).size, 10, `${c} round ${r + 1}`);
  }
});

test("Context Match answers are short enough to type (one or two words)", () => {
  for (const c of playOrder) for (const p of buildRoundPairs(c, 2, [])) assert.ok(p.b.split(/\s+/).length <= 2, `${p.deckId}: ${p.b}`);
});

test("Business City Boss uses 50 different questions from the city words; New York starts with the 11 curated ones", () => {
  for (const c of playOrder) {
    const pairs = buildRoundPairs(c, 4, []);
    assert.equal(pairs.length, 50, c);
    assert.equal(new Set(pairs.map((p) => p.id)).size, 50, `${c}: no repeated question`);
  }
  const ny = buildRoundPairs("new-york", 4, []);
  assert.equal(ny.filter((p) => p.businessQuestion).length, 11);
  for (const p of ny.filter((x) => x.businessQuestion)) assert.equal(createQuestionOptions(p, cityDecks["new-york"]).filter((o) => o.correct).length, 1);
  assert.equal(roundInfo[4].mode, "boss");
});

test("Review Rush mixes up to five missed words with its own ten", () => {
  const deck = cityDecks["london"];
  const missed = deck.slice(0, 8).map((p) => p.id);
  const pairs = buildRoundPairs("london", 3, missed);
  assert.equal(pairs.length, 10);
  assert.ok(pairs.filter((p) => missed.includes(p.id)).length <= 5);
});
