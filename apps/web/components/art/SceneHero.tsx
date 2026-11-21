import { ART, type SceneName, type SceneTime } from "../../lib/art/manifest.ts";
import { ART_ENABLED, artUrl } from "../../lib/art/paths.ts";
import { Observatory } from "../Observatory.tsx";

/**
 * Decorative V3 scene with art-directed responsive mobile crop.
 * When raster assets are not installed (default), render existing approved V2 SVG
 * or leave the project illustration to legacy CSS. No broken public URLs.
 * Set NEXT_PUBLIC_FAMILYOS_V3_ART=1 ONLY once 12 image files are committed.
 */
export function SceneHero({ scene, time="dusk", eager=false }: {
  scene:SceneName;time?:SceneTime;eager?:boolean;
}) {
  if (!ART_ENABLED) return scene==="observatory"?<Observatory world={time}/>:null;
  const key=scene==="volcano"?"volcano-expedition":`observatory-${time}`;
  const art=ART[key];
  return <picture key={key} className="fo-art">
    <source media="(max-width: 640px)" type="image/avif" srcSet={artUrl(art.mobile.avif)}/>
    <source media="(max-width: 640px)" type="image/webp" srcSet={artUrl(art.mobile.webp)}/>
    <source type="image/avif" srcSet={artUrl(art.wide.avif)}/>
    <source type="image/webp" srcSet={artUrl(art.wide.webp)}/>
    <img src={artUrl(art.wide.webp)} alt="" width={art.wide.width} height={art.wide.height}
      decoding="async" loading={eager?"eager":"lazy"} fetchPriority={eager?"high":"auto"}/>
  </picture>;
}
