# FamilyOS Visual World V3 — Bilder direkt über GitHub

Die App benötigt **keine ZIP-Dateien, kein manuelles Weiterreichen zwischen ChatGPT und Claude Code und keine externen Bildhosts**.

## Aktueller, funktionierender Weg

Unsere GitHub-native V3-Art-Direction liegt unter:
- `apps/web/public/art/v3/observatory-dusk.svg`
- `apps/web/public/art/v3/observatory-night.svg`
- `apps/web/public/art/v3/volcano-expedition.svg`

`SceneHero.tsx` zeigt diese drei SVG-Illustrationen direkt. Sie sind eigenständige gezeichnete Interpretationen der freigegebenen Rastermotive; **nicht dieselben Bildbytes**.

`apps/web/lib/art/paths.ts` ergänzt die notwendige Pfadbasis. Für GitHub Pages ist im Workflow der Wert `NEXT_PUBLIC_ASSET_BASE=/familienplaner` hinterlegt. Auf einem lokalen Server werden Pfade ohne Präfix erzeugt.

**WICHTIG:** `NEXT_PUBLIC_FAMILYOS_V3_ART` nicht auf `1` setzen. Dieser alte experimentelle Schalter verlangt 12 AVIF/WebP-Bilddateien, die im Repository nicht vorliegen. Die SVG-Bilder sind unabhängig davon sichtbar.

## Test
```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
FAMILYOS_PAGES_BASE=/familienplaner NEXT_PUBLIC_ASSET_BASE=/familienplaner npm run build -w @familyos/web
```

Prüfen, dass `apps/web/out/art/v3/` alle drei SVGs enthält und dass sie in der exportierten Demo unter `/familienplaner/art/v3/*.svg` erreichbar sind. Dazu Screenshots von Start, Explore-Abend, Explore-Nacht und Vulkan-Projekt bei 390 px machen. Relevantes Design-QA: `docs/design/GITHUB_ONLY_ART.md`.

## Nächste Iteration
Neue Illustrationsverbesserungen werden künftig direkt in GitHub per PR an den drei SVG-Dateien bearbeitet, getestet und reviewt. Wer irgendwann die ursprünglichen hochaufgelösten Rasterillustrationen einsetzen möchte, braucht einen separaten ausdrücklich beauftragten GitHub-Binär-Uploadworkflow. Für die jetzt verfügbare App ist das kein Blocker.

Vor dem Merge nach `integration/design-v2` visuelle Screenshots prüfen und sicherstellen, dass der GitHub-Pages-Workflow nicht durch einen zweiten Pages-Build von `main` überlagert wird.
