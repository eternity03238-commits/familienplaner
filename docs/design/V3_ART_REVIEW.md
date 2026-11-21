# V3-Illustrationen — Prüfung im echten Layout und Überarbeitung

Stand 2026-11-21 · Branch `integration/visual-world-v3` (PR #3) · Grundlage: `GITHUB_ONLY_ART.md`, `VISUAL_WORLD_V3_PLAN.md`, `DESIGN_SYSTEM_V2.md`

## Prüfumgebung
- Statischer GitHub-Pages-Build (`FAMILYOS_PAGES_BASE=/familienplaner`, `NEXT_PUBLIC_ASSET_BASE=/familienplaner`), ausgeliefert unter dem Unterpfad `/familienplaner/`.
- Chrome (Playwright), iPhone-Breite 390 px (3× Pixeldichte, Touch) und Desktop 1280 px.
- **Nicht geprüft:** echtes iPhone mit Safari. Das steht weiter aus (siehe „Offen“).

## Laden der Illustrationen (nachgewiesen, nicht angenommen)
| Szene | URL im HTML | Antwort | `img.complete` |
|---|---|---|---|
| Startseite (Nacht) | `/familienplaner/art/v3/observatory-night.svg` | 200 | ja |
| Explore Abend | `/familienplaner/art/v3/observatory-dusk.svg` | 200 | ja |
| Explore Nacht | `/familienplaner/art/v3/observatory-night.svg` | 200 (nach Umschalten) | ja |
| Vulkan-Expedition | `/familienplaner/art/v3/volcano-expedition.svg` | 200 | ja |

Alle drei SVGs liegen im statischen Export unter `apps/web/out/art/v3/`.

## Befund vor der Überarbeitung (Screenshots `screenshots/v3/before--*`)
| Bereich | Befund | Bewertung gegen Premium-Richtung |
|---|---|---|
| Explore (390 px) | `object-fit: cover` mittig schnitt die Sternwarte rechts ab | Widerspricht V3-Plan §1: Der mobile Ausschnitt muss eigenständig komponiert sein |
| Sternwarte | Kastenbau mit Nieten-Fenstern, schrägen Streben und Antennen-Polygon. Liest sich als Truhe, nicht als Kuppel | Signatur „ringförmige Kuppel“ fehlte |
| Abend vs. Nacht | Fast gleiche Farbstimmung; die Abendsonne lag außerhalb des mobilen Ausschnitts | Lichtwirkung zu schwach unterschieden |
| Vulkan | Lava als Zickzack-Kontur (wirkt wie ein Blitz), eckige Kraterplatte, harte Comic-Wolke, Station in anderer Formsprache | Kein Premium-Niveau, inkonsistente Welt |
| Vulkan-Überzeile | Brach wegen `max-inline-size: 75 %` hässlich um | Typografischer Fehler |
| Barrierefreiheit | `aria-hidden` auf `<picture>` (ESLint-Warnung). Das Bild ist über `alt=""` bereits dekorativ | Korrigiert |

## Überarbeitung (direkt im Repository)
**`observatory-dusk.svg` / `observatory-night.svg`**
- **Neue Sternwarte**, in beiden Varianten in identischer Geometrie (per Test abgesichert):
  - Trommel mit fünf Bogenfenstern und Halbkugel-Kuppel mit Meridianlinien;
  - offener, warm leuchtender Beobachtungsspalt und Teleskop;
  - Orbit-Ring mit hinterem, gedämpftem und vorderem, hellerem Bogen;
  - Lichtkante als Signatur.
- **Abend:** wärmerer Himmel (Violett, Koralle, Bernstein). Die Sonne steht tief hinter dem Bergkamm links der Sternwarte, ihr Schein ist begrenzt. Die fernen Grate tragen warmes Streiflicht.
- **Nacht:** Der Mond sitzt jetzt im sichtbaren mobilen Ausschnitt; die Kanten sind kühl-lila, die Fenster bleiben warm.

**`volcano-expedition.svg`**
- **Krater:** flache, glühende Kraterlinse statt eckiger Platte.
- **Lava:** zwei sich verjüngende Lavaströme, die den Hängen folgen und zum Fuß hin abkühlen. Dazu ein Glüh-Layer.
- **Rauch:** weicher, unscharfer Rauch statt Comic-Kontur.
- **Forschungsstation:** in derselben Kuppel-Formsprache wie die Sternwarte.

**`art-v3.css` und `SceneHero.tsx`**
- **Bildausschnitt pro Szene:**
  - Sternwarte auf dem Telefon rechtsbündig (`100% 55%`), auf breiten Ansichten `80% 50%`;
  - Vulkan `62% 50%`.
- **Umbruch:** Die Überschrift bricht auf dem Telefon vor der Kuppel um (max. 56 % Breite), statt sie zu überdecken.
- **Abdunklung:** Ein Verlauf vom Textblock aus ersetzt die gleichmäßige Abdunklung; auf dem Desktop kommt ein radialer Anteil hinter dem Text dazu.
- **Überzeilen** auf Bildern in Weiß.
- **`<picture>`** ohne `aria-hidden`; das `img` bleibt mit `alt=""` dekorativ.
- **ESLint:** ignoriert den statischen Export `apps/web/out`. Vorher erzeugte er 2.146 Meldungen, sobald lokal ein Pages-Build lag.

## Lesbarkeit (gemessen)
`scripts/design/art_contrast.py` blendet den Text aus, fotografiert die Szene samt Abdunklung und vergleicht die Textfarbe mit den **hellsten 5 %** der Pixel unter jedem Textblock. Das ist strenger als ein Mittelwert.

| Ansicht | Überzeile | Überschrift | Untertitel |
|---|---|---|---|
| Explore Abend · 390 px | 10,98 | 6,68 | 5,42 |
| Explore Nacht · 390 px | 10,99 | 13,93 | 13,08 |
| Vulkan · 390 px | 6,18 | 8,74 | 12,28 |
| Explore Abend · Desktop | 6,24 | 4,67 | 8,20 |
| Explore Nacht · Desktop | 15,01 | 13,49 | 12,86 |
| Vulkan · Desktop | 4,66 | 8,54 | 12,19 |

Minimum **4,66:1** (Ziel ≥4,5:1 auch für kleine Schrift). Vor der Korrektur lag es bei 3,67:1 (Desktop Abend, Überschrift über der Sonne).

## Prüfkette (Abschlusslauf)
| Prüfung | Ergebnis |
|---|---|
| `npm test` | 87 / 87 (neu: identische Architektur Abend/Nacht, weiße Überzeilen, mobiler Ausschnitt) |
| `npm run typecheck`, `npm run lint` | grün, 0 Warnungen |
| `npm run audit:deps` | 0 Schwachstellen |
| `npm run build`, `npm run security:bundle`, `npm run smoke:web` | grün |
| Pages-Build mit Asset-Präfix | grün, 3 SVGs im Export, alle Bilder laden mit Status 200 |
| `npm run design:check` | 132 Kombinationen, 0 Befunde |
| `scripts/design/art_contrast.py` | Minimum 4,66:1 |
| GitHub CI für PR #3 (vor dieser Überarbeitung) | 3 / 3 Jobs grün |

Funktionen, Rollen, Datenmodelle, Datenbank und Command bleiben unverändert. Command bekommt bewusst keine Landschaft (Test).

## Screenshots
`screenshots/v3/after--*` (390 px und 1280 px: Startseite, Explore Abend, Explore Nacht, Vulkan; Ausschnitte der drei Heros) und `screenshots/v3/before--*` zum Vergleich.

## Offen vor der Freigabe
- **Visuelle Abnahme durch dich:** Kein Merge in `integration/design-v2` ohne Freigabe.
- **Echtes iPhone mit Safari:** Text-Einstellungen, Hell/Dunkel und VoiceOver prüfen.
- **Kreuzblende Abend/Nacht** (V3-Plan §5) ist noch nicht umgesetzt; der Wechsel ist sofort.
- **Pixel-Regression:** Referenzbilder nach deiner Freigabe als Baseline speichern (V3-Plan PR E).
- **Optionale Rasterfassung** (12 AVIF/WebP) bleibt deaktiviert; die SVGs sind die laufende Fassung.
