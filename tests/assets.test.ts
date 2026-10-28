import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AUDIO, IMAGES, accessoryImage, alienImage, cityIcon, cityMusic, cityStamp, missionImage } from "@/lib/assets";
import { accessories, aliens, playOrder } from "@/lib/gameData";

const root = process.env.LEWTA_ROOT || process.cwd();
const exists = (p: string) => existsSync(join(root, "public", p));
const flat = (o: unknown): string[] => typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(flat) : o && typeof o === "object" ? Object.values(o).flatMap(flat) : [];

test("every image and sound used by the app exists", () => {
  const paths = [...flat(IMAGES), ...flat(AUDIO), ...playOrder.flatMap((c) => [cityIcon(c), cityStamp(c), cityMusic(c)]),
    ...aliens.map((a) => alienImage(a.id)), ...accessories.map((a) => accessoryImage(a.image)),
    ...[0, 1, 2, 3, 4].flatMap((i) => (["continue", "completed", "locked"] as const).map((s) => missionImage(i, s)))];
  const missing = paths.filter((p) => !exists(p));
  assert.deepEqual(missing, []);
});

test("all 26 accessory images are used and all IDs are unique", () => {
  const files = readdirSync(join(root, "public/images/accessories")).map((f) => f.replace(/\.png$/, ""));
  assert.equal(files.length, 26);
  assert.deepEqual([...new Set(accessories.map((a) => a.image))].sort(), files.sort());
  assert.equal(new Set(accessories.map((a) => a.id)).size, accessories.length);
});

test("every image path written in the source code exists", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const files = ["app", "components", "lib"].flatMap((d) => walk(join(root, d))).filter((f) => /\.(tsx?|css)$/.test(f));
  const bad: string[] = [];
  for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/["'(](\/(?:images|audio)\/[^"'`)$]+\.(?:png|mp3))/g)) if (!exists(m[1])) bad.push(`${f}: ${m[1]}`);
  assert.deepEqual(bad, []);
});
