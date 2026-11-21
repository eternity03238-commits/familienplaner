# GAMEPLAN — Umsetzungsbericht (Phasen A–C)

Stand 2026-11-21 · Branch `design/gameplan-ui` (Basis: `sprint0/foundation`) · Vorgaben: `DESIGN_DIRECTION.md`, `IMPLEMENTATION_BRIEF.md`, `TOKENS.css`

## Ergebnis
Designsystem, zwölf Bausteine, drei Vorschau-Ansichten, ein UI-Katalog und die neu gestaltete Startseite. Die Prototypen laufen nur mit Beispieldaten: Es gibt keine Backend-Schreibzugriffe, keinen KI-Aufruf und keinen Kalenderabgleich. Ein Demo-Hinweis ist dauerhaft sichtbar.

| Route | Inhalt |
|---|---|
| `/` | Startseite im GAMEPLAN-Stil, weiterhin ohne erfundene Nutzerdaten |
| `/design-preview` | Übersicht und UI-Katalog (Ersatz für Storybook) mit allen Bausteinen und Zuständen |
| `/design-preview/parent` | Familienansicht: Filter Alle / Kind A / Kind B, Zeitleiste, Freigaben, offene Aufgaben |
| `/design-preview/child` | Tag von Kind A: Als Nächstes, Aufgaben abhaken, Projekt, Zeitleiste, Vorschläge mit Status „Wartet auf Freigabe“ |
| `/design-preview/study` | Projektpfad Referat und erklärter Lernplan vor der Klassenarbeit |

Alle Vorschau-Routen sind `noindex`.

## Phase A — Bestandsaufnahme
- **Vorher:** nur Startseite und `/api/health`, eigenes ad-hoc-CSS (Blau `#16375f`, Verlaufskarten). Es gab keine Bausteine, keine Tokens und keinen Dunkelmodus.
- **Widerspruch in den Vorgaben:** `preview.html` („Explore“: dunkel, Verläufe, Leuchteffekte, Emojis) widerspricht der schriftlichen GAMEPLAN-Richtung. Umgesetzt wurde GAMEPLAN. Inhalte aus Explore (Missionen, Projektpfad, Referat Vulkane) sind in die GAMEPLAN-Gestaltung übernommen. `preview.html` liegt unverändert als Referenz im Repo.

## Designentscheidungen
1. **Ein lautes Element pro Ansicht:** das Jetzt/Als-Nächstes-Panel. Es zeigt die exakte Uhrzeit in Archivo bei 62 % Breite, hat eine abgeschrägte Ecke und einen versetzten, schräg gestellten Volt-Balken als Unterstreichung. Alles andere bleibt ruhig.
2. **Farbe hat Bedeutung:**
   - Blau steht für Aktion, Navigation und „jetzt“.
   - Volt steht für Erledigt und Fortschritt, immer als Fläche mit Tinte darauf.
   - Violett steht nur für Lernen.
   - Warnfarbe kennzeichnet einen veralteten Abgleich.
3. **Schraffur bedeutet „nicht echt oder nicht sichtbar“:** Sie markiert den Demo-Streifen und die geschwärzten privaten Termine. Das Motiv ist so funktional statt dekorativ.
4. **Kinder ohne Farbcodierung allein:** Kind A ist ein eckiges „A“, Kind B ein rundes „B“. Termine sind nach Form unterscheidbar: Schule Quadrat, Sport Kreis, Lernen Raute, Familie Dreieck, Termin gestrichelt.
5. **Datenschutz in der Oberfläche:**
   - Private Termine des anderen Erwachsenen erscheinen nur als „Privater Termin, belegt“, der Titel erreicht das Ansichtsmodell gar nicht erst.
   - Private Kindertermine sind für Eltern unsichtbar, passend zur offenen Entscheidung 5.1 im Sprint-0-Bericht.
   - Geschwärzte Termine werden nie als „Als Nächstes“ angezeigt.
6. **Freigaben statt KI-Magie:** Die Vorschlagskarte zeigt „Warum dieser Plan?“, die Blöcke, die eingehaltenen Regeln und genau die Angaben, die an die KI gingen. Nur Erziehungsberechtigte des betroffenen Kindes sehen die Freigabe-Schaltflächen, und eine Entscheidung ist endgültig. Kinder sehen „Ein Elternteil entscheidet“. Unbestätigte Blöcke stehen nicht im Kalender, wie PRODUCT.md es verlangt.
7. **Echte Planungsengine:** Der Lernplan der Klassenarbeit wird von `packages/planning` mit Beispieldaten berechnet. Er hält 25-Minuten-Blöcke, maximal einen Block pro Tag und zwei Puffertage ein. Ein Block weicht auf Freitag 16:00 aus, weil der feste Termin von 15 bis 16 Uhr belegt ist.
8. **Ehrlicher Sync-Status:** „abgeglichen“ steht nur mit bestätigtem Zeitstempel da. Sonst zeigt die Oberfläche „Abgleich unbestätigt“, „veraltet“ oder „nicht verbunden“.
9. **Kindermodus:** gleiche Bausteine mit größeren Zahlen, Texten und Zielflächen. Es gibt keine Streaks, keine Ranglisten und keine Pop-ups.
10. **Schriften:**
    - Geist (`geist`, SIL OFL) für Text und Bedienung.
    - Archivo Variable mit Breitenachse (`@fontsource-variable/archivo`, OFL-1.1) für Uhrzeiten und Überschriften.
    - Beide Schriften kommen über npm. Es liegen keine Schriftdateien im Git, die Lizenzen liegen den Paketen bei.

## Kontraste (WCAG 2.2, geprüft in `tests/design-tokens.test.ts`)
| Paar | Hell | Dunkel |
|---|---|---|
| Text auf Hintergrund | 17,0:1 | 17,3:1 |
| Gedämpfter Text auf Hintergrund | 5,6:1 | 9,4:1 (auf Fläche) |
| Blau als Text auf Kreide | 4,7:1 | 7,6:1 |
| Weiß auf Blau (Hauptschaltfläche) | 5,1:1 | Tinte auf `#8CA0FF` 7,6:1 |
| Tinte auf Volt | 16,2:1 | 16,2:1 |

Graphit `#747782` erreicht auf Kreide nur 4,1:1 und ist deshalb nur für Linien und Symbole zugelassen. Für gedämpften Text gilt `#5F626B`. Ein Test schlägt fehl, wenn jemand das ändert. Diese Absicherung wurde per Mutation geprüft.

## Phase C — Prüfung (Abschlusslauf)
| Prüfung | Ergebnis |
|---|---|
| `npm test` | 68 / 68 grün (davon 16 neu: 13 Ansichtslogik, 3 Tokens) |
| Typecheck, ESLint, Build | grün (7 Routen) |
| `npm run audit:deps` | 0 Schwachstellen |
| `npm run security:bundle` / `npm run smoke:web` | grün |
| `npm run test:db` / `test:db:rollback` | 39 / 39 grün / grün (unverändert, keine DB-Änderung in diesem Branch) |
| `npm run design:check` | **50 Kombinationen, 0 Befunde** |

`design:check` deckt 5 Seiten × 5 Viewports (375, 390, 430, iPad 820, Desktop 1280) × hell/dunkel ab. Pro Kombination laufen:
- axe-core mit WCAG 2.0/2.1/2.2 AA und Best Practices,
- eine Prüfung auf horizontalen Überlauf,
- eine Prüfung der Zielgrößen (mindestens 24 px; Bedienelemente haben 44 px),
- ein Tastaturtest: Der erste Tab muss die Sprungmarke sichtbar machen,
- eine Prüfung auf Konsolenfehler.

Dazu kommen 200 % Schriftgröße ohne Überlauf und Interaktionstests: Abhaken aktualisiert den Fortschritt und die Live-Region, der Filter „Kind B“ blendet Kind A aus, und eine Freigabe ändert den Status.

Befunde während der Entwicklung, alle behoben:
- **Kontrast:** Vergangene Termine fielen durch Transparenz unter 4,5:1.
- **Landmark:** Der Demo-Streifen lag außerhalb eines Landmarks.
- **Sprungmarke:** Sie war nach dem Scrollen nicht sichtbar und ist jetzt `fixed`.
- **200 % Text:** Überlauf in Navigation, Grids und Ganztagszeile.
- **Favicon:** fehlte (404).
- **Trenner:** Schrägstriche landeten nach Zeilenumbruch am Zeilenanfang.

Kuratierte Screenshots liegen unter `docs/design/screenshots/` (WebP), der vollständige Satz entsteht lokal mit `npm run design:check`. Ganzseiten-Screenshots zeigen die fixierte Navigation mitten im Bild, das ist ein Effekt der Aufnahme. Die `--viewport`-Bilder zeigen den echten ersten Bildschirm.

## Offene Punkte und Risiken
- **VoiceOver auf echtem iPhone und Safari nicht geprüft.** Geprüft wurde mit Chrome und axe, die Semantik ist nativ (Checkbox, Radiogruppe, `details`, Live-Region). Vor Sprint 6 auf Gerät testen.
- **Bildvergleich gegen gespeicherte Referenzbilder fehlt:** Die Screenshots sind Belege, keine Pixel-Regressionstests. Das ergibt erst mit stabiler UI in Sprint 1/2 Sinn.
- **`design:check` läuft nicht in CI:** Python, Playwright und Chrome sind dort noch nicht eingerichtet. Lokal: `npm run build`, Server auf Port 3988 starten, dann `npm run design:check`.
- **Strikte Content-Security-Policy (CSP) mit Nonces** folgt mit Auth in Sprint 1.
- **Produktentscheidungen** aus dem Sprint-0-Bericht (§5) bleiben offen. Die UI setzt die heutige Datenbank-Logik um, zum Beispiel unsichtbare private Kindertermine.
- **Lernplan nicht pädagogisch geprüft:** Der Plan „1 Block pro Tag“ in der Vorschau ist Beispielkonfiguration. Die Produktvorgabe nennt maximal 60 Minuten zusätzlich pro Tag, einstellbar.
