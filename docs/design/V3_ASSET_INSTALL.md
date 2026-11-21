# Approved V3 illustrations — installation gate

Images are packaged as `FamilyOS-Visual-World-V3-Assets.zip` in the conversation. **The current GitHub text connector cannot commit binary exports.** This PR contains code only, protected by an opt-in environment flag. The app stays on the existing V2 SVG until all 12 art files are installed and verified.

## Install
1. Extract the ZIP.
2. Copy `apps/web/public/art/v3/` from it into the same path in this branch.
3. Preserve filenames: 3 scenes × 2 responsive crops × 2 formats = **12 image files**, plus optional source notes.
4. Compare SHA-256 digests from `ASSET_MANIFEST.json`; verify public asset files contain no secrets or student data.
5. On this branch, run:
   ```bash
   npm ci
   npm test
   npm run typecheck
   npm run build
   NEXT_PUBLIC_FAMILYOS_V3_ART=1 NEXT_PUBLIC_ASSET_BASE=/familienplaner FAMILYOS_PAGES_BASE=/familienplaner npm run build -w @familyos/web
   ```
6. Verify `apps/web/out/art/v3/` contains all 12 files, and each route loads via the `/familienplaner/art/v3/` prefix.
7. Enable `NEXT_PUBLIC_FAMILYOS_V3_ART: "1"` and `NEXT_PUBLIC_ASSET_BASE: /familienplaner` in the static Pages build workflow **only after** the files are committed and visual checks pass.
8. Run `npm run design:check` and manually test actual Safari; compare screenshots of home, Explore dusk/night and volcano.
9. Merge to `integration/design-v2` only after acceptance. Do not push to `main` or switch Pages source until the branch is verified.

## Intended placements
- `apps/web/components/explore/Today.tsx` → hero (dusk/night, 4:3 on phone, 16:9 desktop)
- `apps/web/components/explore/Expedition.tsx` → volcano project header
- `apps/web/app/page.tsx` → home brand hero
- Parent Command keeps its calm UI; it does not get a giant landscape

No text is baked into the image. Keep HTML headings, project titles and buttons fully accessible.

## Art QA
Use one consistent composition per scene family, not new unrelated images. The night scene has a nearly matching observatory architecture to the dusk version; inspect the crop carefully, because generative scenes are not pixel-identical. Require approval of the final screenshots rather than just the standalone art.
