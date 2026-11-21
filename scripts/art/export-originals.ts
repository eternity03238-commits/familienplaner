/**
 * Original-art export pipeline (docs/design/CLAUDE_ORIGINAL_ART_IMPLEMENTATION.md §3).
 * Input : the APPROVED original PNG masters committed to docs/design/art-v3/originals/ (never generated here).
 * Output: 12 files in apps/web/public/art/v3/ (3 scenes × mobile/wide × AVIF/WebP) + assets-manifest.json
 *         with names, pixel sizes, bytes, SHA-256, source master + its SHA-256 and crop rectangle.
 * Only crops, resizes and compresses. No colour grading, no generative steps. Refuses to upscale.
 * Usage: node --experimental-strip-types scripts/art/export-originals.ts [--originals DIR] [--out DIR]
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { cropRect, wouldUpscale, type CropSpec } from "./crop-math.ts";

const ROOT = new URL("../../", import.meta.url).pathname;
const arg = (name: string, def: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
const ORIGINALS = arg("--originals", join(ROOT, "docs/design/art-v3/originals"));
const OUT = arg("--out", join(ROOT, "apps/web/public/art/v3"));
const config = JSON.parse(readFileSync(join(ROOT, "docs/design/art-v3/crops.json"), "utf8")) as Record<string, unknown>;
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

type Variant = { width: number; height: number; crop: CropSpec };
type Scene = { master: string; mobile: Variant; wide: Variant };

const missing = Object.entries(config).filter(([k]) => !k.startsWith("$")).map(([, v]) => (v as Scene).master).filter(m => !existsSync(join(ORIGINALS, m)));
if (missing.length) {
  console.error(`Blocked: original master file(s) not in the repository:\n  ${missing.join("\n  ")}\nExpected in ${ORIGINALS}. Nothing was exported.`);
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
const masters: Record<string, unknown>[] = [];
const files: Record<string, unknown>[] = [];
for (const [key, raw] of Object.entries(config)) {
  if (key.startsWith("$")) continue;
  const scene = raw as Scene;
  const masterPath = join(ORIGINALS, scene.master);
  const masterBuf = readFileSync(masterPath);
  const meta = await sharp(masterBuf).metadata();
  if (meta.format !== "png") throw new Error(`${scene.master} is ${meta.format}, expected the original PNG`);
  const mw = meta.width!, mh = meta.height!;
  masters.push({ path: `docs/design/art-v3/originals/${scene.master}`, sha256: sha(masterBuf), bytes: masterBuf.length, width: mw, height: mh, kind: "original" });
  for (const variant of ["mobile", "wide"] as const) {
    const v = scene[variant];
    const rect = cropRect(mw, mh, v.crop, v.width, v.height);
    if (wouldUpscale(rect, v.width)) throw new Error(`${key}/${variant}: crop ${rect.width}px is narrower than target ${v.width}px — would upscale the original`);
    const base = sharp(masterBuf).extract(rect).resize(v.width, v.height, { fit: "fill", kernel: "lanczos3" }).withMetadata({}).keepIccProfile();
    for (const fmt of ["avif", "webp"] as const) {
      const buf = fmt === "avif" ? await base.clone().avif({ quality: 60, effort: 7, chromaSubsampling: "4:4:4" }).toBuffer()
                                 : await base.clone().webp({ quality: 82, effort: 6, smartSubsample: true }).toBuffer();
      const name = `${key}-${variant}.${fmt}`;
      writeFileSync(join(OUT, name), buf);
      files.push({ path: `apps/web/public/art/v3/${name}`, sha256: sha(buf), bytes: buf.length, width: v.width, height: v.height,
        kind: "derived-crop", source: scene.master, sourceSha256: sha(masterBuf), crop: rect, approval: "pending-visual-review" });
      console.log(`${name.padEnd(34)} ${String(Math.round(buf.length / 1024)).padStart(4)} KB  from ${rect.width}×${rect.height}@(${rect.left},${rect.top})`);
    }
  }
}
writeFileSync(join(OUT, "assets-manifest.json"), JSON.stringify({ generated: new Date().toISOString(), masters, files }, null, 2) + "\n");
console.log(`wrote ${files.length} files + assets-manifest.json`);
