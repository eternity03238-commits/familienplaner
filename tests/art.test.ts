import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ART } from "../apps/web/lib/art/manifest.ts";
import { artUrl } from "../apps/web/lib/art/paths.ts";

test("art manifest declares 3 scenes x 2 crops x 2 formats = 12 decorative files", () => {
  const files = Object.values(ART).flatMap(a => [a.mobile.avif, a.mobile.webp, a.wide.avif, a.wide.webp]);
  assert.equal(new Set(files).size, 12);
  assert.ok(Object.values(ART).every(a => a.decorative === true));
});
test("artUrl only accepts the known file names (no path traversal, no untrusted names)", () => {
  for (const a of Object.values(ART)) for (const f of [a.mobile.avif, a.wide.webp]) assert.match(artUrl(f), /\/art\/v3\/[a-z-]+\.(avif|webp)$/);
  for (const bad of ["../secret.webp", "observatory-dusk-wide.png", "x.avif", "observatory-dusk-wide.avif?x", "/etc/passwd"]) assert.throws(() => artUrl(bad));
});
test("art CSS does not collide with existing component classes", () => {
  const art = readFileSync(new URL("../apps/web/app/art-v3.css", import.meta.url), "utf8");
  assert.doesNotMatch(art, /\.fo-scene\b/, ".fo-scene is used by the design-system catalogue");
});
test("Command (parent view) gets no landscape art", () => {
  const cmd = readFileSync(new URL("../apps/web/components/command/CommandToday.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(cmd, /SceneHero|art-v3/);
});

test("dusk and night share exactly the same observatory architecture (only light changes)", () => {
  const shapes = (name: string) => {
    const svg = readFileSync(new URL(`../apps/web/public/art/v3/${name}.svg`, import.meta.url), "utf8");
    const g = svg.match(/<g id="observatory">[\s\S]*?<\/g>/)?.[0] ?? "";
    return [...g.matchAll(/\s(?:d|x|y|cx|cy|r|rx|ry|width|height|transform)="([^"]+)"/g)].map(m => m[1]);
  };
  const dusk = shapes("observatory-dusk");
  assert.ok(dusk.length > 20, "observatory group present");
  assert.deepEqual(shapes("observatory-night"), dusk);
});
test("art CSS keeps small text on scenes white and the parent view untouched", () => {
  const art = readFileSync(new URL("../apps/web/app/art-v3.css", import.meta.url), "utf8");
  assert.match(art, /\.fo-art-enabled \.fo-eyebrow\{color:#FFFFFF\}/);
  assert.match(art, /\.fo-art--observatory\{--fo-art-focus:100% 55%\}/, "phone crop keeps the observatory in frame");
});
