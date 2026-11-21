# Status Original-Illustrationen — Originale integriert, **visuelle Abnahme ausstehend**

Stand 2026-11-21 · Branch `integration/visual-world-v3` (PR #3, Draft) · Vertrag: `CLAUDE_ORIGINAL_ART_IMPLEMENTATION.md`

## Herkunft
Die Inhaberin hat die drei freigegebenen Originale auf `main` hochgeladen. Sie lagen nicht unter den ursprünglich erwarteten Dateinamen, sondern unter den folgenden:

| Original (1536 × 1024 PNG) | Commit auf `main` | Git-Blob = Kopie in `docs/design/art-v3/originals/` |
|---|---|---|
| `assets/images/sternwarte-im-abendlicht.png` | `364c307` | `6fcbfd6…` identisch |
| `assets/images/sternwarte-unter-dem-mond.png` | `13ec39c` | `6227b7e…` identisch |
| `assets/images/vulkan-forschungsstation.png` | `364c307` | `9e008ec…` identisch |

`main` wurde nicht verändert. Die Kopien sind bytegleich (gleicher Git-Blob, kein zusätzlicher Speicher im Repository). SHA-256 aller Master und Exporte stehen in `apps/web/public/art/v3/assets-manifest.json`, und `npm run art:verify` prüft sie.

## Status
| Szene | Original in GitHub | 12 Exporte (AVIF/WebP) | in App geladen | iPhone-Ausschnitt geprüft | echtes iPhone geprüft |
|---|---|---|---|---|---|
| Observatorium Abend | ja | ja | ja (HTTP 200, `img.complete`, 1024/1440 px) | ja, Chrome 320/390/430 px | **nein**, Abnahme durch Inhaberin |
| Observatorium Nacht | ja | ja | ja | ja | **nein** |
| Vulkan-Forschungsstation | ja | ja | ja | ja | **nein** |

## Umsetzung
- **Nur Zuschnitt, Skalierung und Kompression** der Originale (`npm run art:export`, `docs/design/art-v3/crops.json`). Keine Farbkorrektur, keine Generierung, kein Hochskalieren.
- **iPhone:** quadratischer Ausschnitt 1024 × 1024 mit vollständiger Kuppel; Abend ab x = 512, Nacht ab x = 120 (Mond bewusst außerhalb statt halb angeschnitten). Vulkan nutzt den vollen 3:2-Rahmen.
- **Desktop / Projekt:** voller 3:2-Rahmen (1440 × 960) mit Sonne bzw. Mond.
- **Gestaltung:**
  - Im Dunkelmodus läuft der Hero auf dem Telefon randlos über die ganze Breite und blendet in den Hintergrund über.
  - Der Text liegt unten links auf dem dunklen Vordergrund.
  - Im Hellmodus und auf dem Desktop ist der Hero eine abgerundete Karte.
  - Einmaliges, sanftes Heranzoomen beim Laden (1,4 s) und 280 ms Überblendung Abend/Nacht; bei reduzierter Bewegung entfällt beides.
- **Ladegewicht:** AVIF 88–135 KB pro Bild (Safari/Chrome laden AVIF), WebP-Fallback 129–219 KB. Die WebP-Dateien liegen teils über dem Budget aus dem V3-Plan (Warnung in `art:verify`).
- **SVG-Ersatz:** bleibt als Rückfall (`NEXT_PUBLIC_FAMILYOS_V3_ART=0`) im Repo. Er ist **nicht** die freigegebene Gestaltung.

## Messungen (Chrome, Playwright)
- **Textkontrast über den Originalen** (gegen die hellsten 5 % des Bildes hinter dem Text): Minimum **4,58:1**, Nacht-Überschrift 12,1:1. Script: `scripts/design/art_contrast.py`.
- **`npm run design:check`:** 132 Kombinationen (11 Seiten × 6 Breiten × hell/dunkel), 0 Befunde. Dazu 200 % Text auf Explore Abend, Explore Nacht und Vulkan ohne Überlauf.
- **Tests und Build:** 93/93 Tests, Typecheck, Lint, Audit (0), Build, Bundle-Scan und Smoke-Test grün.

## Beobachtung zur Art Direction (Entscheidung der Inhaberin)
Abend- und Nachtbild zeigen **verschiedene Gebäude und Kameraperspektiven**:
- Abend: futuristischer Glasbau rechts im Bild.
- Nacht: klassische weiße Kuppel links im Bild.

Der Vertrag beschreibt „dieselbe Architekturfamilie und Kameraperspektive“. Die App kann das ausgleichen (Text unten links, eigener Ausschnitt je Szene). Beim Umschalten wechselt aber sichtbar das Gebäude. Falls das stört, bräuchte es ein passendes Nachtbild zum Abendbild. Die Bilder selbst werden nicht verändert.

## Paralleler Commit `8e28f52` (Inhaberin, 21.11.2026)
Gleichzeitig kamen auf diesem Branch an:
- die Originale unter `assets/images/` (gleiche Git-Blobs wie oben),
- `familyos-symbol.svg`, `topography.svg` und `world-orbit.svg`,
- eigene Exporte unter denselben zwölf Dateinamen (Handy 960 × 720, Desktop 1440 × 810).

Originale und SVGs bleiben unverändert. Bei den zwölf Exporten gilt die hier beschriebene Fassung, weil Layout, Ausschnitte und Kontrastmessung darauf abgestimmt sind. Die Version aus `8e28f52` bleibt in der Historie erhalten (`git checkout 8e28f52 -- apps/web/public/art/v3/`). Welche Ausschnitte bleiben, entscheidet die Inhaberin bei der Abnahme.

## Vor dem Merge
1. Echte iPhone-Screenshots durch die Inhaberin, zum Beispiel über die GitHub-Pages-Vorschau oder `npm run preview:lan`.
2. Freigabe der Ausschnitte und der Gestaltung.
3. Danach: PR #3 auf „Ready for review“ und Merge in `integration/design-v2`.

Vergleich Original – SVG-Ersatz – App: `screenshots/v3-original/vergleich-original-ersatz-app.webp`. Dazu Einzelansichten bei 320/390/430/1280 px, Hellmodus und 200 % Text im selben Ordner.
