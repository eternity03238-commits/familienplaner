/**
 * Approved ORIGINAL illustrations (owner commit 364c307 on main, assets/images/*.png, 1536×1024),
 * copied byte-identical to docs/design/art-v3/originals/ and exported by `npm run art:export`.
 * Phone: square crop that keeps the whole dome (full-bleed hero). Desktop/project: full 3:2 frame.
 */
export type SceneName = "observatory" | "volcano";
export type SceneTime = "dusk" | "night";
export type ArtVariant = {
  key: string;
  master: string;
  mobile: { avif: string; webp: string; width: number; height: number };
  wide: { avif: string; webp: string; width: number; height: number };
  decorative: true;
};
const variant = (key: string, master: string, mobile: [number, number], wide: [number, number]): ArtVariant => ({
  key, master, decorative: true,
  mobile: { avif: `${key}-mobile.avif`, webp: `${key}-mobile.webp`, width: mobile[0], height: mobile[1] },
  wide: { avif: `${key}-wide.avif`, webp: `${key}-wide.webp`, width: wide[0], height: wide[1] }
});
export const ART: Record<string, ArtVariant> = {
  "observatory-dusk": variant("observatory-dusk", "sternwarte-im-abendlicht.png", [1024, 1024], [1440, 960]),
  "observatory-night": variant("observatory-night", "sternwarte-unter-dem-mond.png", [1024, 1024], [1440, 960]),
  "volcano-expedition": variant("volcano-expedition", "vulkan-forschungsstation.png", [1170, 780], [1440, 960])
};
