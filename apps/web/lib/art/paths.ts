/** Asset paths must respect GitHub Pages' project basePath. Never interpolate untrusted filenames. */
const BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
const SAFE = /^(observatory-(dusk|night)|volcano-expedition)-(mobile|wide)\.(avif|webp)$/;
export function artUrl(file: string): string {
  if (!SAFE.test(file)) throw new Error("Unrecognized FamilyOS art asset: " + file);
  return BASE + "/art/v3/" + file;
}
export const ART_ENABLED = process.env.NEXT_PUBLIC_FAMILYOS_V3_ART === "1";
