import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** WCAG 2.2 contrast of the semantic token pairs actually used by the UI, light and dark. */
const css = readFileSync(new URL("../apps/web/app/tokens.css", import.meta.url), "utf8");
function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `selector ${selector} missing`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
}
const light = block(":root {");
const dark = block(':root[data-theme="dark"]');
const resolve = (t: Record<string, string>, k: string) => t[k] ?? light[k] ?? ({ "fo-bg": light["fo-chalk"], "fo-text": light["fo-ink"], "fo-primary": light["fo-blue"], "fo-progress": light["fo-volt"], "fo-on-progress": light["fo-ink"], "fo-surface-inverse": light["fo-ink"], "fo-text-inverse": light["fo-chalk"], "fo-study": light["fo-violet"], "fo-border-strong": light["fo-graphite"], "fo-focus": light["fo-blue"], "fo-child-a": light["fo-blue"], "fo-child-b": light["fo-ink"] } as Record<string, string>)[k];
const lum = (hex: string) => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum]
const TEXT = 4.5, UI = 3;
const pairs: [string, string, number][] = [
  ["fo-text", "fo-bg", TEXT], ["fo-text", "fo-surface", TEXT], ["fo-text-muted", "fo-bg", TEXT], ["fo-text-muted", "fo-surface", TEXT],
  ["fo-text-muted", "fo-surface-muted", TEXT], ["fo-primary", "fo-bg", TEXT], ["fo-primary", "fo-surface", TEXT],
  ["fo-on-primary", "fo-primary", TEXT], ["fo-on-progress", "fo-progress", TEXT], ["fo-text-inverse", "fo-surface-inverse", TEXT],
  ["fo-text-inverse-muted", "fo-surface-inverse", TEXT], ["fo-study-text", "fo-surface", TEXT], ["fo-text", "fo-study-tint", TEXT],
  ["fo-success", "fo-bg", TEXT], ["fo-warning", "fo-surface", TEXT], ["fo-text", "fo-warning-tint", TEXT], ["fo-danger", "fo-surface", TEXT],
  ["fo-child-a", "fo-surface", TEXT], ["fo-border-strong", "fo-surface", UI], ["fo-focus", "fo-bg", UI], ["fo-study", "fo-surface", UI]
];

for (const [name, tokens] of [["light", light], ["dark", dark]] as const) {
  test(`token contrast (${name})`, () => {
    for (const [fg, bg, min] of pairs) {
      const a = resolve(tokens, fg), b = resolve(tokens, bg);
      assert.ok(a && b, `${name}: unresolved ${fg} / ${bg}`);
      const r = ratio(a, b);
      assert.ok(r >= min, `${name}: ${fg} ${a} on ${bg} ${b} = ${r.toFixed(2)}:1 < ${min}:1`);
    }
  });
}
test("volt is never used as a text colour and graphite never for muted text", () => {
  const styles = readFileSync(new URL("../apps/web/app/styles.css", import.meta.url), "utf8");
  assert.doesNotMatch(styles, /(^|[^-])color:\s*var\(--fo-(progress|volt)\)/m);
  assert.notEqual(light["fo-text-muted"], light["fo-graphite"]);
});
test("dark override and prefers-color-scheme block stay in sync", () => {
  const start = css.indexOf("@media (prefers-color-scheme: dark)");
  const body = css.slice(css.indexOf("{", css.indexOf(":root:not", start)) + 1, css.indexOf("}", css.indexOf(":root:not", start)));
  const media = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  assert.deepEqual(media, dark);
});
