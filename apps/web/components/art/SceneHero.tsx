import { ART, type SceneName, type SceneTime } from "../../lib/art/manifest.ts";
import { ART_ENABLED, artUrl, vectorSceneUrl } from "../../lib/art/paths.ts";

/**
 * Decorative scene layer (text, state and access checks stay in the caller).
 * - ART_ENABLED (NEXT_PUBLIC_FAMILYOS_V3_ART=1): the approved ORIGINAL illustrations as art-directed
 *   <picture> crops (mobile 4:3 / wide), AVIF with WebP fallback — only once the 12 files and the
 *   original masters are committed and verified (npm run art:verify).
 * - otherwise: TEMPORARY vector stand-ins (public/art/v3/*.svg). They are NOT the approved originals.
 * The observatory renders dusk and night stacked so the toggle cross-fades (240 ms; instant with reduced motion).
 */
export function SceneHero({ scene, time = "dusk", eager = false, toggleable = false }: { scene: SceneName; time?: SceneTime; eager?: boolean; toggleable?: boolean }) {
  if (scene === "volcano") return <Layer artKey="volcano-expedition" scene={scene} active eager={eager} />;
  // Static placements (home) load only the scene they show.
  if (!toggleable) return <Layer artKey={`observatory-${time}`} scene={scene} active eager={eager} />;
  return (
    <div className="fo-art-stack" data-time={time}>
      <Layer artKey="observatory-dusk" scene={scene} active={time === "dusk"} eager={eager && time === "dusk"} />
      <Layer artKey="observatory-night" scene={scene} active={time === "night"} eager={eager && time === "night"} />
    </div>
  );
}

function Layer({ artKey, scene, active, eager }: { artKey: string; scene: SceneName; active: boolean; eager: boolean }) {
  const cls = `fo-art fo-art--${scene} ${ART_ENABLED ? "fo-art--original" : "fo-art--vector"} ${active ? "is-active" : "is-inactive"}`;
  const loading = eager ? "eager" : "lazy";
  if (!ART_ENABLED) {
    return <picture className={cls}><img src={vectorSceneUrl(artKey)} alt="" width={1440} height={810} loading={loading} decoding="async" fetchPriority={eager ? "high" : "auto"} /></picture>;
  }
  const art = ART[artKey];
  return (
    <picture className={cls}>
      <source media="(max-width: 640px)" type="image/avif" srcSet={artUrl(art.mobile.avif)} />
      <source media="(max-width: 640px)" type="image/webp" srcSet={artUrl(art.mobile.webp)} />
      <source type="image/avif" srcSet={artUrl(art.wide.avif)} />
      <source type="image/webp" srcSet={artUrl(art.wide.webp)} />
      <img src={artUrl(art.wide.webp)} alt="" width={art.wide.width} height={art.wide.height} decoding="async" loading={loading} fetchPriority={eager ? "high" : "auto"} />
    </picture>
  );
}
