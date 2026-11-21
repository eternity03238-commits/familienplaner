import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** WCAG 2.2 contrast of the Design System V2 token pairs the UI actually uses (dark default, light, parent, tech). */
const css = readFileSync(new URL("../apps/web/app/tokens.css", import.meta.url), "utf8");
function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `selector ${selector} missing`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2].toUpperCase()]));
}
const dark = block(":root {");
const light = { ...dark, ...block('[data-fo-theme="light"] {') };
const parentDark = { ...dark, ...block('[data-fo-role="parent"] {') };
const parentLight = { ...light, ...block('[data-fo-role="parent"][data-fo-theme="light"]') };
const techDark = { ...dark, ...block('[data-fo-look="tech"] {') };
const techLight = { ...light, ...block('[data-fo-look="tech"][data-fo-theme="light"]') };

const lum = (hex: string) => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const TEXT = 4.5, UI = 3;
const surfaces = ["fo-canvas", "fo-surface", "fo-surface-raised"];
const pairs: [string, string, number][] = [
  ...["fo-ink", "fo-ink-muted", "fo-interactive", "fo-success", "fo-warning", "fo-danger", "fo-accent-school", "fo-accent-sport", "fo-accent-family"]
    .flatMap(fg => surfaces.map(bg => [fg, bg, TEXT] as [string, string, number])),
  ["fo-ink-subtle", "fo-canvas", TEXT], ["fo-ink-subtle", "fo-surface", TEXT],
  ["fo-interactive-ink", "fo-interactive", TEXT], ["fo-success-ink", "fo-success", TEXT], ["fo-warning-ink", "fo-warning", TEXT], ["fo-danger-ink", "fo-danger", TEXT],
  ["fo-ink", "fo-interactive-tint", TEXT], ["fo-interactive", "fo-interactive-tint", TEXT], ["fo-ink", "fo-success-tint", TEXT], ["fo-ink", "fo-warning-tint", TEXT],
  ["fo-ink-muted", "fo-warning-tint", TEXT], ["fo-ink-muted", "fo-hatch", TEXT],
  ["fo-focus", "fo-canvas", UI], ["fo-focus", "fo-surface", UI], ["fo-ink-subtle", "fo-surface-raised", UI], ["fo-ink-muted", "fo-surface", UI]
];

for (const [name, t] of Object.entries({ dark, light, parentDark, parentLight, techDark, techLight })) {
  test(`V2 token contrast (${name})`, () => {
    for (const [fg, bg, min] of pairs) {
      const a = t[fg], b = t[bg];
      assert.ok(a && b, `${name}: unresolved ${fg} / ${bg}`);
      const r = ratio(a, b);
      assert.ok(r >= min, `${name}: ${fg} ${a} on ${bg} ${b} = ${r.toFixed(2)}:1 < ${min}:1`);
    }
  });
}

test("V2 base values are adopted unchanged from design/familyos-orbit-wow", () => {
  const v2 = { "fo-canvas": "#0B0E1D", "fo-surface": "#181D33", "fo-ink": "#F7F7FF", "fo-interactive": "#AF8CFF", "fo-success": "#78E0BC", "fo-warning": "#FFCD8C", "fo-focus": "#FFC879" };
  for (const [k, v] of Object.entries(v2)) assert.equal(dark[k], v, k);
  assert.equal(light["fo-interactive"], "#6345B4");
});
test("decorative stroke is never used as text colour or control border", () => {
  assert.ok(ratio(dark["fo-stroke"], dark["fo-surface"]) < UI, "stroke is decorative by design (documented)");
  const styles = readFileSync(new URL("../apps/web/app/styles.css", import.meta.url), "utf8");
  assert.doesNotMatch(styles, /(^|[;{\s])color:\s*var\(--fo-stroke\)/m);
  // controls whose boundary is their only identifier must use a ≥3:1 border (WCAG 1.4.11); week days are identified by their text
  for (const sel of [".fo-task-check {", ".fo-filter__option > span {", ".fo-route__node {", ".fo-button--quiet {"]) {
    const rule = styles.slice(styles.indexOf(sel), styles.indexOf("}", styles.indexOf(sel)));
    assert.ok(rule.length > 0, sel);
    assert.doesNotMatch(rule, /var\(--fo-stroke\)/, sel);
  }
});
test("no hard-coded hex colours in component CSS outside the scenic art blocks", () => {
  const styles = readFileSync(new URL("../apps/web/app/styles.css", import.meta.url), "utf8");
  const lines = styles.split("\n").filter(l => /#[0-9A-Fa-f]{3,6}\b/.test(l));
  const allowed = /fo-hero|fo-project-hero|fo-nextmove__arrow|art:/;
  assert.deepEqual(lines.filter(l => !allowed.test(l)), []);
});
