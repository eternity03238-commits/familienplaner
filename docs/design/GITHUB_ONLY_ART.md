> **Überholt (21.11.2026):** Die freigegebenen Originale sind integriert, siehe `ORIGINAL_ART_STATUS.md`. Die SVGs sind nur noch ein Rückfall (`NEXT_PUBLIC_FAMILYOS_V3_ART=0`).

# FamilyOS V3 – GitHub-only illustration workflow

**Stand: 21.11.2026. Keine ZIP-Übergaben mehr erforderlich.**

## Was jetzt im GitHub-Repository liegt
Die drei Illustrationen sind als **eigenständige, neu gezeichnete SVG-Interpretationen** der freigegebenen Observatorium- und Vulkanbildwelt direkt versioniert:
- `apps/web/public/art/v3/observatory-dusk.svg`
- `apps/web/public/art/v3/observatory-night.svg`
- `apps/web/public/art/v3/volcano-expedition.svg`

Diese Vektorgrafiken sind **nicht pixelidentisch** mit den ursprünglich in ChatGPT erzeugten und freigegebenen Rasterillustrationen. Sie greifen aber die freigegebene Art Direction auf und können ohne privaten Dateiaustausch auf GitHub entwickelt, versioniert und deployed werden.

## Integration
- `SceneHero.tsx` rendert die GitHub-SVGs standardmäßig, auch ohne die bisherigen 12 AVIF-/WebP-Exports.
- Startseite, Explore Abend/Nacht und Vulkan-Expedition haben die `fo-art-enabled`-Gestaltung aktiv.
- `paths.ts` liefert streng geprüfte Asset-URLs mit `NEXT_PUBLIC_ASSET_BASE`.
- Im Pages-Workflow ist `NEXT_PUBLIC_ASSET_BASE=/<repo>` gesetzt, sodass der Unterpfad `/familienplaner/art/v3/*.svg` funktioniert.
- `NEXT_PUBLIC_FAMILYOS_V3_ART` **nicht setzen**. Die alte Raster-Option bleibt optional und verlangt weiterhin 12 Dateien, solange sie bewusst aktiviert wird.

## Pflege der Illustrator-Dateien
Claude Code verändert künftig direkt die drei SVG-Dateien via Pull Request. Kein Kopieren aus Chats. Jede Version bekommt einen Screenshot-Vergleich für mobile 390px und Desktop; die Vektoren haben bewusst keine eingebetteten Texte oder Personen. Text, Buttons und Status bleiben in HTML.

## Tests und Freigabe
- CI: `npm test && npm run typecheck && npm run lint && npm run build`.
- SVG-Test: `tests/design-vectors.test.ts`.
- Pages-Export mit `FAMILYOS_PAGES_BASE=/familienplaner NEXT_PUBLIC_ASSET_BASE=/familienplaner npm run build -w @familyos/web`.
- `apps/web/out/art/v3/` muss die drei SVG-Dateien enthalten.
- Browser: 320px/390px/430px sowie Desktop; Abend/Nacht-Umschaltung, Projektroute, Kontrast in hell/dunkel.
- Kein Merge in `integration/design-v2`, bevor die visuellen Screenshots beurteilt wurden.

**Die ursprüngliche `V3_ASSET_INSTALL.md`-Anleitung ist nur noch für den optionalen Austausch gegen hochauflösende Rasterversionen relevant. Für die laufende App ist sie kein Blocker.**
