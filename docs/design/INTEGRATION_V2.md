# Integration Design System V2 (Explore / Command) — Bericht

Stand 2026-11-21 · Branch `integration/design-v2` (Basis: `design/gameplan-ui` → `sprint0/foundation`)
Quelle: `design/familyos-orbit-wow` @ `b87daa9` (PR #1) · Massgeblich: `DESIGN_SYSTEM_V2.md` vor `PARENT_COMMAND_V1_3.md`, `ITERATION_V1_2_AUDIT.md`, `ITERATION_V1_1.md`; `DESIGN_DIRECTION.md` (GAMEPLAN) und `IMPLEMENTATION_NOTES.md` sind historisch.

## Vorgehen
Der Design-Branch ist eine eigenständige Next-15-App im Wurzelverzeichnis. Sie hat mit dem Monorepo nur den ersten Commit gemeinsam. Ein Git-Merge hätte `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json` und die CI-Dateien gegenseitig überschrieben. Die Inhalte wurden deshalb **gezielt portiert**:
- V2-Dokumente kopiert, Code neu in `apps/web` aufgebaut.
- `main`, `design/familyos-orbit-wow` und PR #1 sind unverändert.
- Kein Force-Push.

## Ausgangslage, real gemessen am unveränderten Design-Branch
| Prüfung | Ergebnis |
|---|---|
| `npm install`, `tsc --noEmit`, `next build` | grün |
| axe WCAG 2.2 AA (Mein Tag, Command Heute, 390 px) | 0 Verstöße |
| Überlauf bei 320 px | keiner |
| `npm audit` | **2 high, 1 moderate** (`next@15.5`, postcss) |

Probleme im Design-Branch:
- **Gerät im Gerät:** Auf dem iPhone erscheint ein iPhone-Rahmen mit erfundener Statuszeile „9:41“.
- **Schrift von Google Fonts:** Wird zur Laufzeit von `fonts.googleapis.com` geladen; dabei geht die IP-Adresse an Google (DSGVO-Risiko).
- **Rolle als Umschalter:** Eltern/Kind ist ein Toggle in einem 112-Zeilen-`page.tsx`. V1.3 P0 #5 verlangt getrennte Routen.
- **Fest kodierte Farben:** rund 70 Hex-Werte im Legacy-CSS.
- **Command zu dünn:** keine privaten Termine, kein Sync-Zeitstempel, keine Freigabe-Logik pro Kind.

## Übernommen
| V2-Element | Umsetzung |
|---|---|
| Tokens `src/styles/tokens.css` | `apps/web/app/tokens.css`. V2-Werte unverändert übernommen; Ergänzungen mit „(+)“ markiert: Tints, Hellmodus-Akzente, Look „Tech“. Test: `tests/design-tokens.test.ts` |
| Bausteine `ui.tsx` | `apps/web/components/ui.tsx`: ActionButton, SurfaceCard, Eyebrow, StatusChip, SectionHeading, ProgressLine, TaskTile, dazu MissionIcon und DemoPill |
| SourcePill | Erweitert um „abgeglichen vor …“ (nur mit Zeitstempel), „veraltet“, „nicht verbunden“, „manuell“. Es wird nie ein Verbindungsstatus erfunden |
| Explore: Mein Tag | Observatorium-Szene mit Abend/Nacht-Schalter (nutzergesteuert) und nächstem Termin. Dazu Tagesfortschritt, „Dein nächster Move“ mit Fokus-Dialog, Missionen und Projekt der Woche |
| Missionssystem | Arten Lernen, Sport, Projekt, Alltag mit eigenem Symbol. Abhaken mit Text-Bestätigung in einer Live-Region. Keine XP, Streaks oder Vergleiche |
| Fokus-Dialog (V1.2) | Nativer `<dialog>`: Fokus bleibt im Dialog, Escape schließt, der Fokus kehrt zum Auslöser zurück (automatisch getestet) |
| Kalender (V1.2) | Wochenleiste Mo–Fr; jeder Tag zeigt eigene Beispieldaten |
| Expeditionsroute (V1.2) | Fünf Etappen mit Auswahl, Detailfeld und Abschließen/Wieder öffnen. Die Route ist die Betonung dieses Bereichs |
| Profil | Looks Explorer/Tech, Hell/Dunkel. Gespeichert im Browser, nur als Darstellung |
| Command (V1.3) | Heute: Als Nächstes, Zähler, Belastungshinweis, Familien-Zeitleiste, Freigaben, offene Aufgaben. Dazu Kalender, Planung (Wochenlast, Projekt, Lernpläne) und Profil (Rechte, Quellen, Darstellung) |
| Mitgliederfilter | Alle / Kind A / Kind B, umgesetzt als native Radiogruppe. Als Ansicht beschriftet, nicht als Berechtigung |
| Vorschlag mit „Warum?“ | Regeln und an die KI übermittelte Angaben sichtbar. Nur Erziehungsberechtigte des Kindes entscheiden, die Entscheidung ist endgültig. Kinder sehen „Ein Elternteil entscheidet“ |
| `/design-system` | Katalog mit Dunkel/Hell × Explore/Command. Zusätzlich Zeitleiste, Vorschlag, beide Observatorium-Szenen und die Zustände leer, veraltet, kein Zugriff, offline und lädt |

## Bewahrt (aus Sprint 0 und GAMEPLAN)
Unverändert geblieben sind:
- Monorepo, Datenbank-Migrationen 0001–0003 samt Rollback, RLS- und Integritätstests.
- Auth-Skeleton, Domain- und Planungspakete, Security-Header, CI und Bundle-Scan.

Die Logik der GAMEPLAN-Vorschau (`apps/web/lib/preview/model.ts`) wurde erweitert, nicht ersetzt:
- **Private Termine:** Termine anderer Erwachsener erscheinen nur als „belegt“, private Termine der Kinder sind für Eltern unsichtbar.
- **Isolation:** Geschwister sehen die Daten des anderen Kindes nie.
- **Freigaben:** nur durch Erziehungsberechtigte des betroffenen Kindes.
- **Lernplan:** berechnet von `packages/planning`.

Die alten `/design-preview/*`-Adressen leiten auf die neuen Seiten um.

Neu im Modell, alles unit-getestet:
- `loadWarnings` liefert den Belastungshinweis mit einstellbarer Schwelle.
- `toggleStage` schaltet Etappen nur für das Kind selbst oder Erziehungsberechtigte um.
- `workWeek` liefert die Arbeitswoche.
- `Mission.kind` ordnet jeder Mission eine Art zu.

## Bewusste Abweichungen von V2
| Thema | Entscheidung und Grund |
|---|---|
| Geräte-Rahmen und „9:41“ | Entfernt. Auf dem iPhone ist die App jetzt Vollbild mit Safe-Area-Abständen; auf dem Desktop eine zentrierte Spalte |
| Schrift DM Sans | Lokal über `@fontsource-variable/dm-sans` (OFL) statt Google Fonts, weil sonst die IP-Adresse an Google geht |
| Icons | `lucide-react` 1.x (ISC) statt 0.468 |
| Next 15 | Next 16 beibehalten (0 Schwachstellen) |
| Eltern/Kind-Toggle | Getrennte Routen `/explore/*` und `/command/*`. Der Wechsel-Link ist keine Berechtigung, und das steht so in der Oberfläche |
| Hellmodus | V2 bietet hell nur im Katalog an. Hier ist er in der ganzen App wählbar, weil V1.3 P1 eine helle Barrierefreiheits-Variante verlangt. Alle Tokens sind kontrastgeprüft |
| `stroke` (2,4:1) | Nur für dekorative Trennlinien. Bedienelemente nutzen `ink-muted` oder `ink-subtle` (≥3:1); ein Test sichert das ab |
| Tech-Look | Türkis statt Neon, kontrastgeprüft in hell und dunkel |
| Command-Akzent Bernstein (V1.3) | Bernstein bleibt für Entscheidungen und Hinweise (V2: „amber = warning/decision“). Primäraktionen sind violett wie in V2 |

## Prüfungen (Abschlusslauf nach frischem `npm ci`)
| Prüfung | Ergebnis |
|---|---|
| `npm run audit:deps` | 0 Schwachstellen |
| `npm test` | **77 / 77** (Domain, Planung, Auth, Architektur, Ansichtslogik, V2-Tokens in 6 Varianten) |
| `npm run typecheck`, `npm run lint`, `npm run build` | grün (14 Routen) |
| `npm run security:bundle`, `npm run smoke:web` | grün |
| `npm run test:db`, `npm run test:db:rollback` | 39 / 39, grün (DB unverändert) |
| `npm run design:check` | **132 Kombinationen, 0 Befunde** |
| Start im Heimnetz (`next start -H 0.0.0.0`) | HTTP 200 über die Netzwerk-IP |

`design:check` deckt 11 Seiten × 6 Viewports (320 bis 1280 px) × dunkel/hell ab. Pro Kombination laufen axe (WCAG 2.2 AA und Best Practices), Prüfungen auf Überlauf, Zielgrößen und Konsolenfehler sowie ein Tastaturtest der Sprungmarke. Hinzu kommen 200 % Text ohne Überlauf auf allen Seiten und diese Abläufe:
- Abhaken mit Text-Bestätigung.
- Fokus-Dialog: Fokus bleibt im Dialog, Escape schließt, Fokus kehrt zurück.
- Zustand bleibt über Tab-Wechsel erhalten.
- Wochentag wechselt die Daten.
- Kein privater Titel erscheint, Filter Kind B blendet Kind A aus, Freigabe ändert den Status.
- Keine Geschwisterdaten in Explore an allen Wochentagen.

Während der Integration gefunden und behoben:
- **Logo:** Der zugängliche Name wich vom sichtbaren Text ab (WCAG 2.5.3).
- **Kopfzeile:** lief auf 320 px und bei 200 % Text über.

## Ausprobieren auf iPhone oder im Browser
```bash
npm ci
npm run preview:lan      # Produktions-Build, erreichbar im Heimnetz auf Port 3000
# oder für Entwicklung mit Hot Reload:
npm run dev:lan
```
1. IP-Adresse des Rechners ermitteln. macOS: `ipconfig getifaddr en0`, Windows: `ipconfig`.
2. Auf dem iPhone (gleiches WLAN) `http://<IP>:3000` in Safari öffnen.
3. Einstiege: `/` (Auswahl), `/explore`, `/command`, `/design-system`.

Hinweise:
- Nur im vertrauenswürdigen Heimnetz starten. Es laufen ausschließlich Beispieldaten.
- „Zum Home-Bildschirm“ funktioniert, aber echtes PWA-Verhalten (Offline, Push) braucht HTTPS. Das gehört zur späteren Hosting-Entscheidung.
- Die macOS-Firewall fragt beim ersten Start eventuell nach; Node muss eingehende Verbindungen annehmen dürfen.

## Online-Demo auf GitHub Pages
Workflow `.github/workflows/pages.yml` läuft bei jedem Push auf `integration/design-v2` oder `main`. Er führt `npm test` aus, baut die statische Demo (`FAMILYOS_PAGES_BASE=/familienplaner`) und veröffentlicht sie.
- **Adresse:** https://eternity03238-commits.github.io/familienplaner/
- **Sichtbarkeit:** öffentlich für jeden mit Link. Nur erfundene Beispieldaten, `noindex`, keine Secrets im Workflow.
- **Inhalt:** Die statische Version enthält alle Seiten, aber keine API-Route (`/api/health`).
- **Was auf Pages fehlt:** Security-Header und Umleitungen der alten `/design-preview`-Adressen. GitHub Pages kann beides nicht.
- **Lokal nachbauen:** `npm run build:pages`; die Ausgabe liegt in `apps/web/out`.
- **Geprüft:** unter dem Unterpfad `/familienplaner/` mit denselben 132 Prüfkombinationen und Abläufen, 0 Befunde.

**Einmalige Freischaltung durch die Repo-Inhaberin.** Claude kann diese Einstellungen nicht ändern:
1. Repository → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
2. Settings → Environments → `github-pages` → *Deployment branches and tags*: `integration/design-v2` hinzufügen. Standardmäßig ist dort nur der Standard-Branch erlaubt.
3. Actions → Workflow „Demo auf GitHub Pages“ → letzten Lauf öffnen → **Re-run all jobs**.

## Offen
- **Nicht geprüft:** VoiceOver mit echtem iPhone und Safari; bisher nur Chrome mit axe.
- **Ohne Pixel-Regression:** Screenshot-Vergleiche gegen gespeicherte Referenzbilder fehlen noch; die Screenshots unter `docs/design/screenshots/` sind Belege.
- **Nicht in CI:** `design:check` braucht Python, Playwright und Chrome.
- **Bildmaterial:** Original-Illustrationen (V2 „Requirements for original visual assets“) fehlen. Das Observatorium ist weiter das portierte SVG, Lichtstimmungen gibt es nur als Abend und Nacht. Gestalterische Aufgabe außerhalb des Codes.
- **Spätere Sprints:** echte Zustände für Laden, Offline, veralteten Connector und Berechtigungsfehler. Die Bausteine dafür sind im Katalog fertig, aber ohne Datenquelle noch nicht verdrahtet.
- **Keine Benachrichtigungen:** Mitteilungen (Erlaubnis-Dialog, Notifications) gibt es noch nicht.
- **Entscheidungen offen:** Fragen aus `docs/sprint0/REPORT.md` §5, zum Beispiel ob Eltern private Kindertermine sehen. Die UI setzt die heutige Datenbank-Logik um.
- **Supabase-Stack:** Der Lauf auf dem echten Supabase-Local-Stack steht weiter aus (Sprint-0-Gate).
- **PR #1:** kann nach Prüfung dieses Branches geschlossen oder als Referenz behalten werden; diese Entscheidung liegt bei dir.
