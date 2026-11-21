import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "apps/web/public/art/v3");
for (const name of ["observatory-dusk", "observatory-night", "volcano-expedition"]) {
  test(`GitHub-native artwork ${name} exists and is a safe scalable SVG`, () => {
    const path = resolve(dir, `${name}.svg`);
    assert.equal(existsSync(path), true);
    const svg = readFileSync(path, "utf8");
    assert.match(svg, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 1440 810"/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|onload=|(?:xlink:)?href\s*=\s*["\x27](?:https?:|\/\/)/i);
    assert.ok(Buffer.byteLength(svg, "utf8") < 35_000, "SVG asset size budget");
  });
}
