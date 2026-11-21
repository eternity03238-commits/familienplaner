/** Art approved 2026-11-21. Binary exports are distributed in FamilyOS-Visual-World-V3-Assets.zip. */
export type SceneName = "observatory" | "volcano";
export type SceneTime = "dusk" | "night";
export type ArtVariant = {
  key: string;
  master: string;
  mobile: { avif: string; webp: string; width: number; height: number };
  wide: { avif: string; webp: string; width: number; height: number };
  decorative: true;
};
export const ART: Record<string,ArtVariant> = {
  "observatory-dusk": {
    key:"observatory-dusk",master:"futuristische_sternwarte_im_abendlicht.png",
    mobile:{avif:"observatory-dusk-mobile.avif",webp:"observatory-dusk-mobile.webp",width:960,height:720},
    wide:{avif:"observatory-dusk-wide.avif",webp:"observatory-dusk-wide.webp",width:1440,height:810},decorative:true
  },
  "observatory-night": {
    key:"observatory-night",master:"moderne_sternwarte_unter_dem_mond.png",
    mobile:{avif:"observatory-night-mobile.avif",webp:"observatory-night-mobile.webp",width:960,height:720},
    wide:{avif:"observatory-night-wide.avif",webp:"observatory-night-wide.webp",width:1440,height:810},decorative:true
  },
  "volcano-expedition": {
    key:"volcano-expedition",master:"dämmernde_vulkan_forschungsstation_mit_lavaglühen.png",
    mobile:{avif:"volcano-expedition-mobile.avif",webp:"volcano-expedition-mobile.webp",width:960,height:720},
    wide:{avif:"volcano-expedition-wide.avif",webp:"volcano-expedition-wide.webp",width:1440,height:960},decorative:true
  }
};
