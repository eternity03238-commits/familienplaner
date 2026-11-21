# FamilyOS Visual World V3.1 — Vulkanexpedition + konsistentes Fortschrittsdesign

## Implemented 2026-11-21 (source-code changes)
The user approved the 3 original visual scenes and asked to execute the next design milestone: stronger stage markers, progress, lighting accents and transitions that match the artwork.

This iteration **implements the actual React and CSS layer on top of `design/visual-world-v3`**:
- `apps/web/components/explore/Expedition.tsx`: a titled expedition hero, 5 distinct Lucide stage icons, selected/done/remaining semantic statuses, numeric expedition progress and a readable detail panel. Existing `useExplore`, `toggleStage`, permissions and dates remain unchanged.
- `apps/web/components/explore/Today.tsx`: project shortcut shows the same live progress as expedition route.
- `apps/web/app/art-v3.css`: route line, selected stage treatment, restrained amber/violet scene accents, responsive fallbacks, progress animations and reduced-motion alternative.

## Visual design contract
1. The hero is the only substantial scenic image on the expedition page. Stage cards use proper UI surfaces rather than fantasy wallpaper.
2. The line is a symbolic expedition route. Icons help differentiate steps but every stage is also labeled in real text and marked as completed/not completed.
3. Mint communicates actual completion. Violet communicates selected/active. Amber is reserved for art highlights and warning/decision elsewhere.
4. Stage progress is derived from the same `stages` state, not a duplicate counter. `role=progressbar` carries numeric accessible value.
5. Selecting an etappe does **not** mark it complete; the button remains explicit, reversible, and permission-aware.
6. Motion remains 150–240 ms, no sparkles/confetti and reduced-motion disables transitions.
7. The new design works even before the approved raster files have been committed. The feature flag remains off and the original static SVG or CSS fallback is used.

## Still blocked on asset upload
The approved illustrations are available in `FamilyOS-Visual-World-V3-Assets.zip` in the conversation. Images **are not currently committed** to this GitHub branch. Follow `docs/design/V3_ASSET_INSTALL.md`, copy the 12 AVIF/WebP assets into `apps/web/public/art/v3/`, verify checksums and enable `NEXT_PUBLIC_FAMILYOS_V3_ART=1` only after export checks.

## QA before merge
- Run all CI tests on this branch. Do not assert passing CI before the completed result.
- Run Playwright visual checks on 320 / 390 / 430 px, desktop, both themes and 200% text. Confirm stage buttons remain 44px+ touch targets.
- Test selecting any stage, marking completed, reopening, returning to Today, and verifying shared progress.
- Compare screenshots with the approved visual reference *at the same viewport*; verify the approved volcano art does not obscure heading.
- Verify `prefers-reduced-motion`, no screen reader announcement from decorative scene imagery.
- Confirm neither `main` nor deployment source changed. The actual published page is still on the existing deployment until intentional merge/deploy.
