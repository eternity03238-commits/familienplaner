/**
 * Verifies the approved V3 illustrations before they are enabled (docs/design/V3_ASSET_INSTALL.md step 4).
 * Checks: exactly the 12 expected files from lib/art/manifest.ts, SHA-256 equals ASSET_MANIFEST.json,
 * real AVIF/WebP container signatures, pixel dimensions (WebP), no embedded text metadata with personal data,
 * and size budgets from VISUAL_WORLD_V3_PLAN.md (reported, budget overruns are warnings).
 * Usage: node --experimental-strip-types scripts/art/verify-assets.ts [ASSET_MANIFEST.json]
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ART } from "../../apps/web/lib/art/manifest.ts";

const ROOT = new URL("../../", import.meta.url).pathname;
const DIR = join(ROOT, "apps/web/public/art/v3");
const manifestPath = process.argv[2] ?? (existsSync(join(DIR, "assets-manifest.json")) ? join(DIR, "assets-manifest.json") : join(DIR, "ASSET_MANIFEST.json"));
const problems: string[] = [];
const warnings: string[] = [];

const expected = Object.values(ART).flatMap(a => [
  { file: a.mobile.avif, w: a.mobile.width, h: a.mobile.height, kind: "mobile" }, { file: a.mobile.webp, w: a.mobile.width, h: a.mobile.height, kind: "mobile" },
  { file: a.wide.avif, w: a.wide.width, h: a.wide.height, kind: "wide" }, { file: a.wide.webp, w: a.wide.width, h: a.wide.height, kind: "wide" }
]);
if (expected.length !== 12) problems.push(`code manifest lists ${expected.length} files, expected 12`);
if (!existsSync(DIR)) { console.error(`missing directory ${DIR}`); process.exit(1); }
if (!existsSync(manifestPath)) problems.push(`ASSET_MANIFEST.json not found at ${manifestPath}`);

const present = readdirSync(DIR).filter(f => /\.(avif|webp)$/.test(f));
for (const f of present) if (!expected.some(e => e.file === f)) problems.push(`unexpected image file ${f}`);

// Accept common manifest shapes: { files: [{ path|file|name, sha256, bytes? }] } or { "<file>": "<sha>" | { sha256 } }
type Entry = { name: string; sha256: string; bytes?: number };
const entries: Entry[] = [];
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  const list = Array.isArray((m as { files?: unknown }).files) ? (m as { files: Record<string, unknown>[] }).files
    : Array.isArray((m as { assets?: unknown }).assets) ? (m as { assets: Record<string, unknown>[] }).assets
    : Array.isArray(m) ? (m as Record<string, unknown>[]) : null;
  if (list) for (const e of list) entries.push({ name: String(e.path ?? e.file ?? e.name ?? "").split("/").pop() ?? "", sha256: String(e.sha256 ?? e.sha ?? "").toLowerCase(), bytes: typeof e.bytes === "number" ? e.bytes : typeof e.size === "number" ? (e.size as number) : undefined });
  else for (const [k, v] of Object.entries(m as Record<string, unknown>)) entries.push({ name: k.split("/").pop() ?? k, sha256: String(typeof v === "string" ? v : (v as { sha256?: string }).sha256 ?? "").toLowerCase() });
}

function webpSize(b: Buffer): { w: number; h: number } | null {
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") { const bits = b.readUInt32LE(21); return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }; }
  return null;
}
function avifSize(b: Buffer): { w: number; h: number } | null {
  const i = b.indexOf("ispe");
  return i > 0 ? { w: b.readUInt32BE(i + 8), h: b.readUInt32BE(i + 12) } : null;
}

// Provenance: every master named in the manifest must be the committed original with the same hash.
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, "utf8")) as { masters?: { path: string; sha256: string }[] };
  if (!m.masters?.length) problems.push("manifest lists no original masters (provenance missing)");
  for (const master of m.masters ?? []) {
    const mp = join(ROOT, master.path);
    if (!existsSync(mp)) { problems.push(`original master missing: ${master.path}`); continue; }
    if (createHash("sha256").update(readFileSync(mp)).digest("hex") !== master.sha256) problems.push(`original master changed: ${master.path}`);
  }
}

let total = 0;
for (const e of expected) {
  const p = join(DIR, e.file);
  if (!existsSync(p)) { problems.push(`missing ${e.file}`); continue; }
  const b = readFileSync(p);
  total += b.length;
  const sha = createHash("sha256").update(b).digest("hex");
  const m = entries.find(x => x.name === e.file);
  if (!m) problems.push(`${e.file} not listed in ASSET_MANIFEST.json`);
  else if (m.sha256 !== sha) problems.push(`${e.file} SHA-256 mismatch (manifest ${m.sha256.slice(0, 12)}…, file ${sha.slice(0, 12)}…)`);
  const isAvif = b.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(b.toString("ascii", 8, 12));
  const isWebp = b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
  if (e.file.endsWith(".avif") && !isAvif) problems.push(`${e.file} is not an AVIF container`);
  if (e.file.endsWith(".webp") && !isWebp) problems.push(`${e.file} is not a WebP container`);
  const dim = isWebp ? webpSize(b) : isAvif ? avifSize(b) : null;
  if (!dim) warnings.push(`${e.file}: dimensions not readable`);
  else if (dim.w !== e.w || dim.h !== e.h) problems.push(`${e.file} is ${dim.w}×${dim.h}, manifest.ts expects ${e.w}×${e.h}`);
  const text = b.toString("latin1");
  if (/<x:xmpmeta|GPSLatitude|exif:GPS/i.test(text)) warnings.push(`${e.file} contains XMP/GPS metadata — strip before publishing`);
  if (/@[a-z0-9-]+\.[a-z]{2,}/i.test(text.replace(/[^\x20-\x7e]/g, " ").match(/[\x20-\x7e]{12,}/g)?.join(" ") ?? "")) warnings.push(`${e.file} contains an e-mail-like string in metadata`);
  const kb = Math.round(b.length / 1024);
  const budget = e.kind === "mobile" ? 95 : 160;
  if (kb > budget) warnings.push(`${e.file} ${kb} KB exceeds budget ${budget} KB`);
  console.log(`${e.file.padEnd(34)} ${String(kb).padStart(4)} KB  ${dim ? `${dim.w}×${dim.h}` : "?"}  sha ${sha.slice(0, 12)}…`);
}
console.log(`total ${Math.round(total / 1024)} KB for ${present.length} files`);
for (const w of warnings) console.log(`warning: ${w}`);
if (problems.length) { for (const p of problems) console.error(`ERROR: ${p}`); process.exit(1); }
console.log("art assets ok");
