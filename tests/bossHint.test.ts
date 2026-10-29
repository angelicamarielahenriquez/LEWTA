import { test } from "node:test";
import assert from "node:assert/strict";
import { playOrder } from "@/lib/gameData";
import { bossHint, buildRoundPairs, createQuestionOptions, normalizeAnswer } from "@/lib/questions";
import { cityDecks } from "@/lib/gameData";

const shows = (text: string, word: string) => new RegExp(`(^|[^a-z])${normalizeAnswer(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(text.toLowerCase());

test("Business City Boss hints never reveal the answer, any choice, the hidden word, or a letter", () => {
  let total = 0; const kinds: Record<string, number> = {};
  for (const city of playOrder) {
    for (let run = 0; run < 3; run++) {
      for (const pair of buildRoundPairs(city, 4, [])) {
        const options = createQuestionOptions(pair, cityDecks[city]);
        const hint = bossHint(pair, options); total++;
        for (const o of options) assert.ok(!shows(hint, o.value), `${city}: hint shows choice “${o.value}”: ${hint}`);
        assert.ok(!shows(hint, pair.a) && !shows(hint, pair.b), `${city}: hint shows the answer: ${hint}`);
        assert.ok(!/\b(option|letter|answer is)\b/i.test(hint) && !/\b[ABCD]\)/.test(hint), `${city}: hint points to a position: ${hint}`);
        const kind = hint.split(" ").slice(0, 3).join(" "); kinds[kind] = (kinds[kind] || 0) + 1;
      }
    }
  }
  assert.ok(total >= 12 * 80 * 3);
  console.log("boss hint kinds", kinds);
});
