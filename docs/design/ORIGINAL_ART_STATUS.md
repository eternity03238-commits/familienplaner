# Status Original-Illustrationen — **Blocked: Originalbilder nicht in GitHub**

Stand 2026-11-21 · Branch `integration/visual-world-v3` · Auftrag: `CLAUDE_ORIGINAL_ART_IMPLEMENTATION.md`

## Befund (geprüft, nicht angenommen)
Durchsucht wurden alle 8 Remote-Branches, die PRs #1–#3 (Beschreibungen, Kommentare, Review-Kommentare), Issues und Releases. Es gibt **keine** PNG-, AVIF-, WebP- oder JPEG-Datei der Illustrationen. Ausgenommen sind die Prüf-Screenshots unter `docs/design/screenshots/`.

| Original | Originaldatei in GitHub | 12 Exporte | in App geladen | Mobile-Crop geprüft | echtes iPhone geprüft |
|---|---|---|---|---|---|
| `futuristische_sternwarte_im_abendlicht.png` | **nein** | nein | nein (SVG-Ersatz) | nein | nein |
| `moderne_sternwarte_unter_dem_mond.png` | **nein** | nein | nein (SVG-Ersatz) | nein | nein |
| `dämmernde_vulkan_forschungsstation_mit_lavaglühen.png` | **nein** | nein | nein (SVG-Ersatz) | nein | nein |

Die App zeigt die drei SVGs aus `apps/web/public/art/v3/*.svg`. Sie sind **Ersatzgrafiken, nicht die freigegebenen Originale**. Das gilt auch für die Überarbeitung in Commit `5f2cefe` (`V3_ART_REVIEW.md`). Deren Screenshots und Kontrastwerte beziehen sich nur auf den Ersatz.

## Was ohne Originale vorbereitet ist (keine neuen Bilder)
- **`docs/design/art-v3/originals/`:** Zielordner mit Upload-Anleitung (GitHub *Add file → Upload files*, kein ZIP).
- **`docs/design/art-v3/crops.json`:** eigene Ausschnitte pro Szene, iPhone 4:3 und Desktop 16:9 (Vulkan 3:2). Die Werte sind Startwerte und werden an den echten Originalen nachjustiert.
- **`npm run art:export`** (`scripts/art/export-originals.ts`):
  - erzeugt aus den Original-PNGs die 12 AVIF/WebP-Dateien und `assets-manifest.json` (Maße, Bytes, SHA-256, Quelle und Quell-Hash, Crop-Rechteck);
  - nur Zuschnitt, Skalierung und Kompression, kein Hochskalieren, keine Generierung;
  - ohne Originale bricht es mit „Blocked“ ab.
- **`npm run art:verify`:** prüft zusätzlich die Herkunft. Jedes Master-PNG im Manifest muss mit identischem Hash im Repo liegen; eine Manipulation wird erkannt (getestet).
- **Überblendung Abend/Nacht:** 240 ms, bei reduzierter Bewegung sofort. Gilt für Originale und Ersatz.
- **Tests** (`tests/art-pipeline.test.ts`): Crop-Geometrie, kein Hochskalieren, Abgleich Crop-Konfiguration ↔ `manifest.ts`. Der Workflow darf die Raster-Art nicht ohne die 12 Dateien einschalten.
- Mechanik einmal mit technischen Testmustern geprüft: 12 Dateien, Manifest, Prüfung grün, Manipulation erkannt. Die Testmuster wurden **nicht** committet.

## Nächste Schritte, sobald die drei PNGs auf GitHub liegen
1. `npm run art:export` ausführen, Ausschnitte an den echten Motiven nachjustieren (Kuppel rechts vollständig, ruhige Himmelsfläche links für den Text). Erst Abend, dann Nacht, dann Vulkan.
2. `npm run art:verify`, dann ein Pages-Build mit `NEXT_PUBLIC_FAMILYOS_V3_ART=1` und dem Präfix `/familienplaner`.
3. Soll/Ist-Vergleich mit Screenshots: Original, SVG-Ersatz und React-Ansicht bei 320, 390, 430 und 1280 px, hell und dunkel, 200 % Text, reduzierte Bewegung. Dazu Kontrastmessung (`scripts/design/art_contrast.py`) und Funktionsprüfung (`npm run design:check`).
4. Echte iPhone-Screenshots: Claude kann nur Chrome mit iPhone-Maßen aufnehmen. Gerätescreenshots kommen von dir, über die GitHub-Pages-Vorschau.
5. Erst nach deiner Abnahme: Raster-Art im Pages-Workflow einschalten und mergen. PR #3 bleibt bis dahin Draft.
