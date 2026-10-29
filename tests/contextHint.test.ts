import { test } from "node:test";
import assert from "node:assert/strict";
import { cityDecks, playOrder } from "@/lib/gameData";
import { contextHint, normalizeAnswer } from "@/lib/questions";

const has = (text: string, word: string) => new RegExp(`(^|[^a-z])${normalizeAnswer(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(text.toLowerCase());

test("Context Match hints never show the answer or the hidden word, in every city", () => {
  let synonymHints = 0; let total = 0;
  for (const city of playOrder) {
    for (const pair of cityDecks[city]) {
      const hint = contextHint(pair); total++;
      assert.ok(!has(hint, pair.b), `${city}: hint shows the answer “${pair.b}”: ${hint}`);
      assert.ok(!has(hint, pair.a), `${city}: hint shows the hidden word “${pair.a}”: ${hint}`);
      if (hint.startsWith("Think of a synonym")) synonymHints++;
    }
  }
  assert.ok(synonymHints / total > 0.6, `most hints use another synonym (${synonymHints}/${total})`);
});

test("hint example: emphasize → stress uses another synonym", () => {
  const pair = cityDecks["new-york"].find((p) => p.a === "emphasize")!;
  assert.match(contextHint(pair), /Think of a synonym for “highlight”/);
});
