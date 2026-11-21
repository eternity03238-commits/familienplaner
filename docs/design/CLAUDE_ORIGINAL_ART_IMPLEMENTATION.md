# FamilyOS – VERBINDLICHER Original-Art-Implementierungsauftrag für Claude Code

**Priorität: P0 – Designblocker. Stand: 21.11.2026. Branch `integration/visual-world-v3`.**
**Ziel ist die Umsetzung der ursprünglich freigegebenen drei hochauflösenden Bildillustrationen, NICHT die weitere Verbesserung oder Neuinterpretation der GitHub-SVG-Nachzeichnungen.**

## 0. Wichtiger Befund – Ursache der sichtbaren Abweichung

**In GitHub liegen aktuell NICHT die original freigegebenen Rasterillustrationen.** Dort liegen nur:
- `apps/web/public/art/v3/observatory-dusk.svg`
- `apps/web/public/art/v3/observatory-night.svg`
- `apps/web/public/art/v3/volcano-expedition.svg`

`apps/web/components/art/SceneHero.tsx` rendert standardmäßig genau diese SVGs, weil `NEXT_PUBLIC_FAMILYOS_V3_ART` nicht auf `1` gesetzt ist. Der andere Zweig im Code referenziert zwölf AVIF/WebP-Dateien aus `apps/web/lib/art/manifest.ts`, die im Repository **nicht vorhanden** sind.

Die SVGs sind nachgezeichnete, abstrahierte Vektorbilder – NICHT die vom Nutzer freigegebenen ursprünglichen Szenen. Dass der Build grün ist, beweist nur, dass eine Illustration lädt; es beweist NICHT die verlangte Bildtreue.

**STOP-KRITERIUM:** Du darfst die Umsetzung der *Originale* weder als „fertig“ bezeichnen noch mergen, solange die echten Originaldateien nicht als prüfbare Binärassets im GitHub-Repo liegen und in der App verwendet werden. Keine weitere Ersatz-SVG als „Original“ verkaufen.

## 1. Drei verbindliche Originalreferenzen

Die vom Nutzer in ChatGPT freigegebenen Bildmotive sind:
1. **Abend-Observatorium:** `futuristische_sternwarte_im_abendlicht.png` — fantastische, detailreiche Sternwarte auf einer felsigen Berghöhe, violett-pinker Abendhimmel mit warmem Sonnenuntergang, ringförmiger geschwungener gläserner Kuppel und goldbeleuchteten Fenstern, kurviger Weg im Vordergrund, Tal links, Gebäude auf der rechten Bildhälfte, große ruhige Himmelsfläche links. Keine UI-Schrift in der Illustration.
2. **Nacht-Observatorium:** `moderne_sternwarte_unter_dem_mond.png` — dieselbe gestalterische Architekturfamilie und Kameraperspektive, dunkler Indigo-Sternenhimmel mit Mond, warme Innenbeleuchtung, Ring-Kuppel und beleuchteter Weg; nicht nur ein Farbfilter auf der Abenddatei.
3. **Vulkan-Forschungsstation:** `dämmernde_vulkan_forschungsstation_mit_lavaglühen.png` — verwandtes Observatorium/Forschungsstation rechts, große aktive Vulkanlandschaft und leuchtender Krater mittig/rechts, violett-amber Dämmerung, geschwungener Weg, dieselbe hochwertig-cineastische Art Direction.

**Diese Originalreferenzen sind derzeit nur in der ursprünglichen ChatGPT-Unterhaltung und deren generierten Bildartefakten verfügbar, NICHT automatisch für Claude Code unter diesen Dateinamen in GitHub.** Wenn du keine Originalbytes sehen oder abrufen kannst, melde konkret: „Originale fehlen in GitHub, vorhandene SVGs sind nur Ersatz“. Behaupte niemals, du hättest dieselben Bilder umgesetzt.

### Quelle und Transfer – ausschließlich GitHub als Übergabepunkt
- Akzeptiert: Die originalen PNG-Dateien oder daraus originalgetreu exportierte AVIF/WebP-Dateien werden durch eine berechtigte Asset-Upload-Integration direkt auf einem separaten GitHub-Branch committed. Nach diesem einmaligen Asset-Commit arbeiten alle Beteiligten ausschließlich per Git.
- **Nicht akzeptiert:** neue generative Bilder mit ähnlichen Prompts als Ersatz, handgezeichnete vereinfachte SVGs, remote Hotlinking als Dauerlösung, Ersetzung durch CSS-Gradienten, Behauptung „Original integriert“ ohne Binärdateien.
- Kein ZIP-Hin-und-her mit dem Nutzer. Falls die Originaldateien noch nicht über ein verbundenes Tool abrufbar sind: ohne Scheinlösung den Asset-Blocker benennen. Währenddessen dürfen technische Änderungen und Layoutvorbereitung weitergehen; der Original-Look bleibt ausdrücklich unvollständig.
- Lege die Dateien samt `assets-manifest.json` mit Dateinamen, Pixelmaßen, SHA-256, Dateigrößen, Quellart (original PNG / davon abgeleiteter Crop) und Bildfreigabe in `apps/web/public/art/v3/` ab.

## 2. Art Direction – pixelkonkret statt „mach es schöner“

### Stil & Qualitätsniveau
- Halte die **originale, detailreiche, hochwertige cineastische Illustration**. Die bereits vorhandenen stark vereinfachten SVGs sollen NICHT als Stilvorlage verwendet werden.
- Farbklima: Nacht-Indigo und Violett, warme Amber-Lichter als gezielte Lichtquelle, sanftes Pink/Koralle am Abendhorizont, lokales Mint nur als UI-Erledigtzustand.
- Bildhierarchie: dramatische Landschaft, 3 klar getrennte Tiefenebenen, eigenständige elegante Architektur und fein gezeichnete Fenster/Wege/Vegetation.
- Keine Cartoon-Charaktere, kein Kinderspiel-Look, keine massiven Neonrahmen, keine willkürlichen Glitzerkarten, keine 3D-Emojis, keine neuen Art Styles pro Screen.
- **Keine neue Bildgenerierung.** Originale dürfen verlustarm zugeschnitten, komprimiert und farblich sehr vorsichtig korrigiert werden; nicht neu erfunden.

### Bildausschnitt
- Mobile iPhone: Bild muss so komponiert sein, dass die erkennbare Kuppel auf der rechten Seite sichtbar bleibt und die linke Fläche für „Heute läuft.“ und Unterzeile ruhig bleibt. Verboten: Gebäude zur Hälfte abgeschnitten, Kuppel nur als abstraktes Dach, Texte über Fenster-/Lavaspitzen.
- Für 320, 375, 390 und 430 px **eigenen Mobile-Crop** exportieren; nicht bloß Desktop-16:9 mit `object-position:100%` abschneiden. Desktop braucht separat abgestimmten Wide-Crop.
- Teste das **tatsächliche Hero-Element mit Überschrift und UI**, nicht nur ein einzelnes Bild im Browser. Die Hero-Höhe wird am Inhalt ausgerichtet (ca. 240–300 px auf iPhone, keine starre Vollbild-Fantasytapete).
- Die Bildfläche darf die Tagesaufgaben nicht unter den sichtbaren Bereich verdrängen. Im Startscreen muss spätestens beim ersten kurzen Scroll klar sein, was als Nächstes ansteht.
- Overlay/Scrim hinter Text: nur so viel wie nötig für gemessenen Kontrast, nicht eine undurchsichtige schwarze Schicht über der Illustration.

### Exakte UI-Platzierung
- **Explore Today** (`apps/web/components/explore/Today.tsx`): Bild oben, kleine Tageszeile, gut lesbarer prägnanter Titel, darunter Tagesfortschritt und „Dein nächster Move“ als erste wichtige Aktion. Missionen bleiben kontrastreich, flach und gut bedienbar.
- **Explore Night**: Umschalten rendert die original Nachtillustration im gleichen Rahmen, keine komplette Seitenneuanordnung. Bildwechsel nur ca. 200–280 ms Crossfade; `prefers-reduced-motion`: ohne Übergang.
- **Expedition** (`apps/web/components/explore/Expedition.tsx`): echter Vulkan-Hero oben, darunter die semantische Expeditionsroute mit fünf Etappen. Kein Lavahintergrund hinter langen Aufgabenlisten. Fortschritt, Auswahl und Abschluss bleiben echte Appzustände.
- **Home** (`apps/web/app/page.tsx`): identische Markenwelt, neu zugeschnittener Nacht-Hero; keine selbstständige andere Fantasiewelt.
- **Command**: Elternansicht bleibt ruhig; dort keine große Vulkan-/Observatorium-Fototapete.

## 3. Technische Integration – konkrete Dateien

1. Stelle Originaldateien über GitHub bereit: `apps/web/public/art/v3/observatory-dusk-{mobile,wide}.{avif,webp}`, `observatory-night-{mobile,wide}.{avif,webp}`, `volcano-expedition-{mobile,wide}.{avif,webp}` (12 Exporte) sowie ggf. PNG-Originale in einem Design-Quellordner. Mobile 4:3, Wide 16:9 oder 3:2 für Vulkan; identischer Bildinhalt mit bewusster Komposition.
2. Prüfe im `apps/web/lib/art/manifest.ts` alle Dateinamen, Maße, Hashes und Abmessungen. `SceneHero.tsx` verwendet ein echtes `<picture>` mit mobilen und breiten Varianten, AVIF plus WebP Fallback.
3. Der heutige `SceneHero`-Fallback auf SVG ist ein TEMPORÄRER Migrationspfad. Erst nach committed Assets, erfolgreich bestandenen Pfadtests und Screenshot-Abnahme `NEXT_PUBLIC_FAMILYOS_V3_ART=1` aktivieren; erst danach SVGs als Fallback oder historische Referenz markieren.
4. GitHub Pages: `FAMILYOS_PAGES_BASE=/familienplaner` UND `NEXT_PUBLIC_ASSET_BASE=/familienplaner` beim Static Build. **Alle Bild-URLs müssen im exportierten HTML den Präfix `/familienplaner/art/v3/` tragen**. Keine Root-Pfade, keine externen URLs.
5. Stelle sicher, dass GitHub Pages nicht abwechselnd von einem Jekyll-Lauf aus `main` und dem korrekten Next.js-Artefakt überschrieben wird. Öffentliche Demo erst nach verifizierter, freigegebener Veröffentlichung.
6. Keine Änderungen an `packages/domain`, `packages/auth`, `packages/database`, `packages/planning`, Auth, Rechten, Privacy oder KI-Freigaben für dieses Designticket.

## 4. Visuelle Abnahme – keine Ausrede durch grüne Tests

Verpflichte einen **visuellen Soll/Ist-Vergleich** mit Screenshots:
- Original freigegebenes Art Asset (Referenz)
- aktuelle GitHub-SVG-Version (Ist-alt)
- neue React-Ansicht mit echtem Original (Ist-neu)
- gleicher Ausschnitt und gleiche Viewportbreite, mindestens 390 × 844 CSS-px; außerdem 320, 430 und 1280px
- Explore Dusk, Explore Night, Vulkan-Projekt und Home; Dark/Light, 200%-Text und reduziertes Motion-Setting.

Für jede Ansicht beantworte:
1. Ist es **dieselbe Originalillustration** (Assetname + SHA256), nicht nur ein ähnliches Motiv?
2. Stehen Kuppel, Horizont und Text in der erwarteten Komposition?
3. Bleiben Titel/Untertitel lesbar (Kontrastprüfung) und Buttons 44px+ groß?
4. Lädt das richtige Bild wirklich (HTTP 200, `img.complete`, natürliche Breite, keine 404)?
5. Gibt es Layoutverschiebungen, verschwindende Texte, abgeschnittene Bilder, unscharfe Mobile-Skalierung?
6. Bleiben Aufgaben abhaken, Projekte auswählen/abschließen, Theme- und Nachtwechsel funktionsfähig?
7. Sind Screenshots von Claude selbst tatsächlich gesehen und kritisch beschrieben worden, statt nur Artefakte gespeichert?

**Abnahme erst, wenn** 1) echte Originalassets im Repo, 2) tatsächliche Bilder im App-HTML, 3) screenshotbasierter visueller Vergleich überzeugend, 4) CI inkl. Typecheck/Lint/Tests/Pages-Build erfolgreich, 5) Nutzer gibt die neue Ansicht frei.

## 5. Arbeitsreihenfolge und Berichtspflicht

### A — In 1. Antwort
- Git Branch + Commit SHA nennen.
- Nachweisen, welche Originaldateien IN GitHub vorhanden sind, welche fehlen.
- Die Screenshot-/Bildausschnitt-Probleme der aktuell gerenderten Version präzise benennen.
- Offen sagen, was ohne Originaldateien möglich ist und was nicht.

### B — Implementierung
- Mit Explore Dusk beginnen. Erst **eine** Bildversion mit Original-Crop und UI-Abnahme fertig machen.
- Danach die Nachtvariante in identischer UI-Position.
- Danach Vulkan-Projekt.
- Danach Home und Command-Feinschliff.

### C — Ergebnis
- GitHub-PR mit Dateidiff und vor/nach-Screenshots, Buildlogs und Asset-Checks liefern.
- Eine kurze Tabelle `Originaldatei vorhanden / in App geladen / mobile Crop geprüft / iPhone geprüft`.
- Bei fehlendem Original: **„Blocked: Originalbild nicht in GitHub“**; weitere Layoutarbeit separat beschreiben. Keine falsche Abschlussmeldung.
- PR bleibt Draft; nicht ohne Nutzerfreigabe mergen/deployen.

## 6. Anti-Pattern-Liste – ausdrücklich untersagt

❌ „Original ist implementiert“, aber `SceneHero` zeigt `observatory-dusk.svg`.

❌ GitHub Pages ist grün, daher sei das Design fertig.

❌ Eine weitere aus Polygonen nachgezeichnete SVG statt der freigegebenen detailreichen Illustration.

❌ Aufruf zur ZIP-Übergabe an den Nutzer (GitHub ist gewünschter Übergabekanal).

❌ Ein einziger Desktop-Hintergrund und `object-fit:cover` als Mobile-Lösung ohne kontrollierten Mobile-Crop.

❌ Schatten, Unschärfe und Glitzer als Ersatz für hochqualitative Bilddetails.

❌ Verbesserung nur anhand von Dateinamen oder CSS ohne die reale iPhone-Ansicht anzuschauen.

**Definition of Done: Die tatsächlichen freigegebenen Bilder und ihre richtige Komposition sind auf der veröffentlichten App erkennbar – nicht nur eine motivisch ähnliche Visualisierung.**
