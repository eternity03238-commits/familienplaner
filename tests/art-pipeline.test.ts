import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { cropRect, wouldUpscale } from "../scripts/art/crop-math.ts";
import { ART } from "../apps/web/lib/art/manifest.ts";

test("crop keeps target aspect and stays inside the master", () => {
  const r = cropRect(1536, 1024, { x: 0.3, y: 0.12, w: 0.7 }, 960, 720);
  assert.equal(Math.round((r.width / r.height) * 100) / 100, Math.round((960 / 720) * 100) / 100);
  assert.ok(r.left >= 0 && r.top >= 0 && r.left + r.width <= 1536 && r.top + r.height <= 1024);
  const wide = cropRect(1536, 1024, { x: 0, y: "center", w: 1 }, 1440, 810);
  assert.equal(wide.width, 1536);
  assert.equal(wide.top, Math.round((1024 - wide.height) / 2));
});
test("crop clamps at the right and bottom edges and rejects nonsense", () => {
  const r = cropRect(1000, 600, { x: 0.9, y: 0.9, w: 0.5 }, 400, 300);
  assert.equal(r.left + r.width, 1000);
  assert.equal(r.top + r.height, 600);
  assert.throws(() => cropRect(1000, 600, { x: 0, y: 0, w: 0 }, 400, 300));
  assert.throws(() => cropRect(1000, 600, { x: 0, y: 0, w: 1 }, 0, 300));
});
test("pipeline refuses to upscale originals (detail would blur)", () => {
  assert.equal(wouldUpscale({ left: 0, top: 0, width: 800, height: 600 }, 960), true);
  assert.equal(wouldUpscale({ left: 0, top: 0, width: 1075, height: 806 }, 960), false);
});
test("crop config covers exactly the three approved originals and matches the code manifest sizes", () => {
  const cfg = JSON.parse(readFileSync(new URL("../docs/design/art-v3/crops.json", import.meta.url), "utf8")) as Record<string, { master: string; mobile: { width: number; height: number }; wide: { width: number; height: number } }>;
  const scenes = Object.keys(cfg).filter(k => !k.startsWith("$")).sort();
  assert.deepEqual(scenes, Object.keys(ART).sort());
  for (const k of scenes) {
    assert.match(cfg[k].master, /\.png$/);
    assert.deepEqual([cfg[k].mobile.width, cfg[k].mobile.height], [ART[k].mobile.width, ART[k].mobile.height]);
    assert.deepEqual([cfg[k].wide.width, cfg[k].wide.height], [ART[k].wide.width, ART[k].wide.height]);
    assert.equal(cfg[k].master, ART[k].master, "crop config and code manifest name the same original");
  }
});
test("honest status: raster art stays off unless all 12 derived files and the originals are committed", () => {
  const dir = new URL("../apps/web/public/art/v3/", import.meta.url);
  const all12 = Object.values(ART).flatMap(a => [a.mobile.avif, a.mobile.webp, a.wide.avif, a.wide.webp]).every(f => existsSync(new URL(f, dir)));
  const wf = readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  if (!all12) assert.doesNotMatch(wf, /NEXT_PUBLIC_FAMILYOS_V3_ART:\s*"?1/, "workflow must not enable raster art without the files");
});
