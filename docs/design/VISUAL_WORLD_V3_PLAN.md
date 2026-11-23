# FamilyOS Visual World V3 — Art Direction, Asset Pipeline & Integration Plan

**Status:** Proposed implementation plan based on the actual `integration/design-v2` code (2026-11-21). NO visual assets or app UI changes have been implemented by this document. This branch is based on `integration/design-v2`; do not merge blindly into `main`.

## 0. Verified starting point

- The GitHub Pages deployment workflow is `.github/workflows/pages.yml`, triggered by pushes to `integration/design-v2` and `main`; static output is `apps/web/out`.
- App lives under `apps/web` (Next 16 monorepo), NOT `src/app` in the older standalone design branch.
- Static export sets `FAMILYOS_PAGES_BASE=/familienplaner`, `basePath` and `images.unoptimized: true`.
- Explore hero uses `apps/web/components/Observatory.tsx`, an inline hand-coded 360 × 195 SVG with basic landscape polygons; `apps/web/components/explore/Today.tsx` renders it in `.fo-hero`.
- Project screen: `apps/web/components/explore/Expedition.tsx`, currently project header and list route.
- Command: `apps/web/components/command/CommandToday.tsx` (agenda, AI approvals and tasks); appearance must remain deliberately quieter.
- Homepage renders the same `Observatory` in `apps/web/app/page.tsx`; avoid introducing totally different brand art by mistake.
- Existing V2 CSS is `apps/web/app/styles.css`; semantic tokens are `apps/web/app/tokens.css`.
- Integration report `docs/design/INTEGRATION_V2.md` explicitly says original illustrations are still missing. Existing screenshots in `docs/design/screenshots` are verification artifacts, NOT in-app visuals.
- This plan is source-code-based; live remote DOM pixels weren't accessible in this environment. Request visual review screenshots before aesthetic sign-off.

## 1. Creative thesis

**ORBIT / ein Ort, viele Wege.** FamilyOS is a coherent imagined observatory on a ridge overlooking mountains, city lights and an expansive sky. It is a _subtle navigation metaphor_ for planning, foresight, discovering and growing up. Not a medieval RPG castle, not a sci-fi spaceship HUD, not gold-framed cards, not an AI fantasy wallpaper.

Audience: two grade-5 children and adults. The same world but two treatments:
- **Explore:** cinematic, expressive, curious; 1 intentional hero per view, crisp readable UI beneath.
- **Command:** restrained editorial command deck. Visual character comes from structured rails, micro-icons, warm highlights and a small architectural crop. Never reuse the child's large fantasy panorama behind real scheduling data.

### Art rules
- Recognizable signature: ring-shaped observation dome, asymmetric ridge, narrow warm-lit windows, one luminous orbit/ring; all assets consistent in silhouette.
- Flat-to-illustrated hybrid: clean 2D geometry, authored atmospheric texture, a controlled three-plane depth. NO pseudo-3D glossy blobs, generic generated towers, gradients covering all UI, text embedded in imagery, or watermark.
- Brand palette must extend—not replace—`apps/web/app/tokens.css`: midnight #0B0E1D, indigo #222741, violet #AF8CFF, soft amber #FFCD8C, mint #78E0BC. Scenic art can contain more nuanced shades, but actionable UI continues to use semantic tokens.
- Frame composition: 55–65% calm dark sky area on text side; architectural focal point shifted to right third; horizon lower third. Mobile center crop is a first-class composition, not a cut-down desktop poster.
- No characters or mascots in daily dashboards. Kids get agency from project paths, not XP streaks or leaderboards.
- Dark and light both ship; in light mode the sky remains a bounded art card, not a whole-app dark overlay.

## 2. Specific asset manifest: build these first

Place only approved, optimized files in `apps/web/public/art/v3/`. All files use lower-case hyphenated names. Keep design master files separate in `docs/design/art-v3/` (sources can be SVG if safe, editable master metadata files, never proprietary font files).

| Asset | Purpose | Desktop / mobile aspect | Delivery | Target |
|---|---|---|---|---|
| `observatory-dusk-wide.avif` | Explore hero, sunset | 16:9 (1600×900 master) | AVIF + WebP fallback | <= 160 KB wide |
| `observatory-dusk-mobile.avif` | Real mobile composition | 4:3 (960×720 master) | AVIF + WebP fallback | <= 95 KB |
| `observatory-night-wide.avif` | Night variant, same exact architecture/composition | 16:9 | AVIF + WebP fallback | <= 160 KB |
| `observatory-night-mobile.avif` | Night mobile variant | 4:3 | AVIF + WebP fallback | <= 95 KB |
| `volcano-expedition.avif` | Project-specific mission illustration | 3:2 (1200×800 master) | AVIF + WebP fallback | <= 130 KB |
| `world-orbit.svg` | Small reusable authored orbit/line motif | vector | sanitized SVG | <= 15 KB |
| `topography.svg` | subtle reusable vector contour, for bounded panels ONLY | vector | sanitized SVG | <= 15 KB |
| `familyos-symbol.svg` | distinctive logomark, no text; based on ring observatory | square vector | sanitized SVG | <= 10 KB |

**Targets are budgets, not claims of completed image exports.** Generate/design from one coherent source composition and derive dusk/night as controlled lighting layers; do not independently prompt each variant into unrelated architecture. Small mobile versions are separately composed, NOT simply resized wide images.

Provide a manifest `apps/web/lib/art/manifest.ts` declaring: key, mobile/wide file names, width/height, focal point, dark/light overlay direction, fallback, ALT semantics (usually decorative), attribution/source, exported byte sizes, review status. Give each art asset an approval timestamp/hash so later substitutions are detected.

## 3. Actual image creation workflow

### Stage A — original art direction (before code)
1. Draft a **one-page scene sheet**: architecture silhouette, ridge horizon, orbit/light ring, sky treatment, focal coordinates, text-safe zone. Compare with GameSchool for energy and depth, but do not copy its compositions/assets.
2. Draw a line-art master first (Figma/Illustrator/Inkscape SVG): architecture, three horizon planes, stars, glow shapes, with layers: `sky`, `far-ridge`, `near-ridge`, `observatory`, `window-lights`, `orbit`.
3. Add painterly treatment only AFTER the recognizable silhouette works at 390px. If using generative image assistance, it is a concept/reference phase; manually finish geometry, consistency, edges and color grading. Review rights/license.
4. Derive dusk and night from exactly the same master composition: sunset warmer rim light vs. blue/violet moon light; do not change building position or contour.
5. Compose 4:3 mobile framing with the observatory on right, calm sky left. Review at 320/375/390/430px and in both themes.
6. Make the volcano a **separate scene** with the same lighting and contour language. No arbitrary medieval landmarks or dramatic photorealistic lava.
7. Export images without embedded text or UI labels. Keep all readable words as accessible HTML.

### Stage B — quality gates
- View in realistic crop at 320px and 390px; test headline over scene using screenshot.
- Run a near-blur silhouette test (outline should remain distinctive).
- Compress with AVIF and WebP fallbacks; record byte size. Avoid above-the-fold giant PNGs.
- Confirm no stock watermark, no copyrighted third-party assets, no child photographs.
- Review contrast AFTER integrating actual HTML text layers; a beautiful illustration is invalid if copy is unreadable.

## 4. How assets enter the actual Next app

### Architecture & paths
- Keep public assets: `apps/web/public/art/v3/...`
- Add `apps/web/lib/art/paths.ts` helper:
  ```ts
  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
  export function artUrl(file: string) {
    if (!/^[a-z0-9-]+\.(avif|webp|svg)$/.test(file)) throw new Error("Invalid art asset");
    return `${assetBase}/art/v3/${file}`;
  }
  ```
- In `.github/workflows/pages.yml`, set **both** `FAMILYOS_PAGES_BASE=/familienplaner` and `NEXT_PUBLIC_ASSET_BASE=/familienplaner` at static build. Locally `NEXT_PUBLIC_ASSET_BASE` defaults to empty. This avoids broken `/art/...` URLs on Pages under the repo path.
- Do NOT place source imagery under `docs/design/screenshots/` and assume it will render. Only `apps/web/public` becomes public static assets. Avoid absolute GitHub-hosted URLs.
- For art backgrounds use `<picture>` / responsive `<img>` or an art-only component with media variants + `object-fit: cover`; no optimized server endpoint in static export.
- Provide intrinsic width/height or CSS aspect-ratio, prevent layout shifts, set `loading="eager"` / `fetchPriority="high"` only for main above-fold Explore hero. Secondary images lazy-load.
- Decorative images: empty alt and `aria-hidden`; meaningful content remains in surrounding heading and copy.

### Component changes — narrow scope
1. **New:** `apps/web/components/art/SceneHero.tsx` receives `scene: "observatory" | "volcano"`, `time: "dusk" | "night"`, responsive asset mapping. Renders picture/AVIF/WebP with text-safe overlay and CSS gradient; text stays in caller.
2. **Replace internals of:** `apps/web/components/Observatory.tsx` with optional compatibility wrapper (or use SceneHero directly), keeping existing external `world` API where needed. Preserve home/Explore shared visual identity.
3. **Modify:** `apps/web/components/explore/Today.tsx` only to swap scenic rendering and support tasteful sky toggle (existing state remains; no data logic changes).
4. **Modify:** `apps/web/components/explore/Expedition.tsx` to add the volcano scene as bounded project art, retaining stages, selected state, accessible buttons and dates. The route itself gains authored connector line/markers, not a full-screen wallpaper.
5. **Modify:** `apps/web/app/page.tsx` to use the same observatory motif in a differently cropped entrance. No duplicate image downloads if responsive variant is already cached.
6. **Command:** small architectural line motif or topographic crop in `CommandToday.tsx` header; keep `TimeRail`, `AIProposalCard`, `MemberFilter` contrast and touch targets unchanged.
7. **Add:** art tokens to `apps/web/app/tokens.css`: `--fo-art-overlay`, `--fo-art-gutter`, `--fo-art-highlight`, `--fo-art-motion`; do not replace existing status colors.

### CSS layering
For Explore hero: layer 1 picture/scene, layer 2 subtle gradient scrim (left-to-right, stronger behind text), layer 3 HTML heading and next-event copy, layer 4 compact state control. Apply `isolation:isolate`, border radius with overflow hidden. Keep outside cards flat.
For project: image upper 140–200px only; route remains semantic `<ol>` with clear selected/completed state.
For parent: pattern opacity <= 8% behind header and no background behind multi-line agenda details.
Avoid CSS heavy filter/blur on whole-page backgrounds; low GPU/memory costs on older iPhones.

## 5. Motion system (one purpose per movement)
- Scene toggle: 200–300ms *cross-fade* between preloaded dusk/night assets, without layout shift; reduce motion -> instant switch.
- Mission done: check enters ~150ms and one compact text status (already present); avoid sparkle or confetti.
- Route step: current marker progresses along a continuous vector route, not animated parallax across entire page.
- Sheet/dialog: 180–220ms entrance; maintain `<dialog>` focus trap and Escape support.
- Never animate fixed navigation every tap; no sound or haptics without explicit user choice.
- Keep motion optional and test actual `prefers-reduced-motion: reduce`.

## 6. Implementation sequence (small PRs, safe integration)
- **PR A — Brand Art Direction + assets**: approved scene sheet, original vector masters, optimized 8 images, manifest, attribution, screenshot samples. No app logic.
- **PR B — Explore Hero integration**: SceneHero, responsive artUrl helper, Pages basePath fix, home + Today, fallbacks; visual compare at mobile widths.
- **PR C — Project world**: volcano illustration and route polish; verify all existing stages and permissions unaffected.
- **PR D — Command refinement + motion**: small decorative motif, typography spacing, consistent transitions, zero loss of data density.
- **PR E — Visual regression gates**: golden screenshots stored as references; automate screenshot diff + size, asset and privacy check; manually sign off iOS Safari/VoiceOver.

Each PR branches off the **integration branch**, not the old standalone design branch. Never overwrite working components wholesale. Keep existing V2 tests and avoid modifying `packages/domain`, `packages/auth`, `packages/database`, `packages/planning`.

## 7. Verification & acceptance

### Automated
- `npm ci && npm test && npm run typecheck && npm run lint && npm run build`
- `npm run build:pages` and verify ALL referenced assets exist under `apps/web/out/art/v3/`; ensure generated HTML contains `/familienplaner/art/v3/` rather than broken root `/art/v3/` links.
- Run the existing `npm run design:check`; then add real screenshot **pixel regression against approved V3 baselines**. The current `docs/design/screenshots` are reports, not approved visual designs.
- Layout under 320px, 375px, 390px, 430px, tablet, desktop; test text resize 200% and light/dark. No art may obstruct text or touch controls.
- Assert art weight budgets (hero AVIF <= 160KB / mobile <= 95KB target, total initial route visual payload as small as possible).
- Confirm route/mission interactions, dialogs, color semantics, no console errors, and no unexpected network requests.
- `npm run security:bundle`; no secrets in public export.

### Human review
- Three screenshots side by side: current deployment vs. approved art reference vs. V3 implementation at **same viewport**.
- Two children (about age 10–12) and two adults should understand the next action without explanation. Note discomfort with infantilization or visual overload.
- Check on an **actual iPhone Safari**, including text settings, dark/light, low-power mode, VoiceOver if possible.
- Sign off on exact target screenshots for: Explore Today dusk/night, volcano route, Command Today, home landing and light theme.

## 8. Decision/ownership and definition of done
The **first production-visible milestone** is the approved original observatory hero in Explore Today. Do NOT work on ten images at once. Create one art master, one night variation and mobile crops, integrate and evaluate at 390px. If that is not genuinely better than the existing inline SVG, iterate art direction instead of increasing complexity.

Done means: the deployed demo displays real approved background assets (not merely new specs), responsive images load under `/familienplaner/`, artwork remains consistent across home/Explore/project, all current workflows and privacy tests stay green, visual-regression comparison shows approved results, and the user actually approves screenshots.

**Never claim live pixel inspection from code alone.** Ask for screenshots or use a browser-capable environment for final review.
