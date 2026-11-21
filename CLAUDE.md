# CLAUDE.md — Verbindliche Regeln für Claude Code

## Rolle
Du bist Principal Engineer für FamilyOS. Baue sauber, nachvollziehbar, testbar und sicher. Produktkontext: `PRODUCT.md`; Architektur: `ARCHITECTURE.md`; Datenmodell: `DATA_MODEL.md`; Security: `SECURITY.md`; Roadmap: `ROADMAP.md`.

## Produkt
- Zunächst 2 Erwachsene, 2 Kinder, beide in Klasse 5, unterschiedliche Schulen.
- Apple-first responsive PWA, Zeitzone `Europe/Berlin`, Sprache Deutsch.
- Google Calendar zuerst; LernSax, VP Plan, beste.schule, DLS nach Connector-Freigabe.
- Zukunft: Patchwork, mehrere Haushalte, explizite Freigaben pro Kind und Datenbereich, beliebige Familiengröße und weitere Login-Provider.
- **NICHT** Patchwork-UI oder zusätzliche Connectoren im Sprint-0-MVP implementieren.

## Nicht verhandelbare Leitplanken
1. Modularer Monolith; klare Paketgrenzen, keine Microservices.
2. Niemals Benutzerkonto, Person, Familie und Haushalt gleichsetzen.
3. Rechte *serverseitig und per Datenbank-RLS* kontrollieren. Client-Checks sind nur UX.
4. Nur autorisierte, minimal notwendige Daten an KI-Provider übermitteln.
5. Keine direkten KI-SQL-Tools. Tool-Calls nur über validierte, begrenzte Domain-Aktionen.
6. Keine unbestätigten Schul-APIs, Credentials-Scraper oder ToS-Umgehungen.
7. Externe Datensätze mit Quellen-IDs, Sync-Status und Provenienz speichern.
8. Zeit: UTC-Zeitpunkte plus explizite Zeitzone; ganztägige Termine als Datum.
9. Automatische Änderungen mit Side Effects benötigen sichere Freigaben; Wiederholungen idempotent.
10. Keine sensiblen Daten, API-Keys oder Tokens in Logs, Prompts, Git oder Browserbundle.
11. Kinder dürfen nicht durch beliebige Task-Updates unbemerkt Fristen ändern.
12. Testausführung ehrlich dokumentieren; keine erfundenen grünen Checks.
13. Kein produktiver Deploy und keine echten Anbieter-Konten ohne Nutzerfreigabe.
14. Sicherheitsrelevante DB-Funktionen benötigen feste `search_path`-Einstellung und explizite Rechte.

## Arbeitsweise (AI-DLC)
`Discover → Design → Develop → Validate → Deploy (nur mit Freigabe) → Improve`.
Vor jedem Schritt: Anforderungen, Sicherheitsauswirkungen, Teststrategie und begrenzte Änderung planen. Nach jedem Schritt: Tests, Risiken, offene Punkte dokumentieren. Bei Blockern die sichere Teilimplementierung liefern statt Rechte aufzuweichen.

## Sprint 0 – Fertigstellungsarbeiten
1. `npm install`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` ausführen und Resultate notieren.
2. Migrationen in lokaler Supabase-DB anwenden und RLS in echten Sessions verifizieren.
3. Domain/DB-Modelle vergleichen; Unterschiede dokumentiert beheben.
4. Auth-Skeleton **ohne** Produktivkonten vorbereiten.
5. Automatisierte Sicherheitschecks in CI ergänzen.
6. Erst danach Sprint 1 nach freigegebener Roadmap beginnen.

### Befehle
`npm run check` (Tests, Typecheck, Lint) · `npm run build` · `npm run security:bundle` · `npm run smoke:web` · DB: `npm run test:db:prepare`, `npm run test:db`, `npm run test:db:rollback` (siehe README). Ergebnisse und offene Punkte: `docs/sprint0/REPORT.md`.

## Definition of Done pro PR
- Geänderte Anforderungen/Architektur dokumentiert; Migrationen reversible Strategie.
- Typecheck, Unit-/Integration-/Security-Tests ausgeführt und Ergebnisse berichtet.
- RLS-Betroffenheit geprüft, keine Mandantendaten-Leaks.
- UI auf 375px Breite überprüft, barrierearme Bedienung berücksichtigt.
- Fehlergrenzen, sichere Defaults und keine Silent-Fail-Synchronisation.

## Konventionen
TypeScript strict, Zod für API- und KI-Ein-/Ausgaben, `packages/domain` ohne IO, `packages/planning` ohne Modellabhängigkeit, englische Bezeichner im Code, deutsche Oberfläche, kleine PRs, konventionelle Commits.
