# ARCHITECTURE.md — Technische Architektur

## Entscheidung
TypeScript-Monorepo, modularer Monolith. Next.js App Router PWA, PostgreSQL (Supabase), Supabase Auth, providerneutraler Connector Layer. Planungsregeln und KI-Interpretation getrennt. Hintergrundjobs zunächst konzeptuell (kein produktiver Scheduler in Sprint 0).

## Schichten
1. **UI** (`apps/web`): Responsive iPhone-first Oberfläche, keine Secrets, keine privilegierten Queries.
2. **Application / API**: Sessions und objektbezogene Berechtigung, Zod-Validierung, Audit und Freigabeflüsse.
3. **Domain** (`packages/domain`): Personen, Familien, Haushalte, Tasks, Exams, Privacy-Scope, robuste Regelmodelle.
4. **Planning** (`packages/planning`): Konfliktfreie Zeitfenster, Lastgrenzen, Puffer, deterministische Vorschläge.
5. **AI** (`packages/ai`): Typisierte Tools und Modellprovider; KI darf nur Vorschläge erzeugen, nicht unbeschränkt schreiben.
6. **Connectors** (`packages/connectors`): Integration-Schnittstellen, Sync-Cursor, externe IDs, Provenienz.
7. **Persistence** (`packages/database`): PostgreSQL, RLS, versionierte SQL-Migrationen.
8. **Jobs** (`workers/jobs`): später idempotente, beobachtbare Outbox- und Sync-Jobs.

## Datenfluss: Klassenarbeit
Import oder Elternteil → validierte Normalisierung → `exams` mit Quelle → AI-Vorschlag (minimierte Daten) → Zod-Schema → Planning Engine (hard constraints) → `ai_proposals` → Elternfreigabe → `study_sessions` / optionale Kalenderprojektion → Reminder.

## Datenfluss: Google Calendar (Sprint 2)
Google OAuth (offline access falls nötig) → Tokens verschlüsselt serverseitig → initialer Sync → externe Events und Mapping → Änderungs-Push nur als Signal → delta/incremental sync → Upsert nach Provider-ID → Idempotenz, Race-Schutz, Token-Recovery. `syncToken`-Ablauf / Fehler führen zu sauberem resync. Private Google-Daten nicht standardmäßig an KI geben.

## Datenfluss: Planen in Claude (Sprint 4a, ADR-0006)
Erwachsene Person in Claude → FamilyOS-Connector (Remote-MCP, OAuth/PKCE, Rechte der Person) → begrenzte Werkzeuge (Zod) → Planning Engine (harte Constraints) → `ai_proposals` (pending) → Freigabe in Command → `study_sessions` / optionale Kalenderprojektion. Claude schreibt nie direkt in Termine, Rechte oder Freigaben.

## Datenfluss: Kinderfrage (Sprint 4b, ADR-0006)
Kind in Explore → `POST /api/learn/ask` (Session, Freischaltung, Limits) → Minimal-Prompt (Klassenstufe, Fach, Frage; pseudonym) → Moderation → Claude → Moderation und Zod-Prüfung → Antwort mit KI-Hinweis → Verlauf für Eltern (kurz aufbewahrt). Bei Ausfall: klarer Status, restliche App unverändert.

## PWA und Apple
HTTPS für PWA, Installationshinweis „Zum Home-Bildschirm“, Safari/Apple-Push-Einschränkungen berücksichtigen, keine native iOS-Features voraussetzen. Offline zunächst Fehler-/Lesestatus, keine komplexe Offline-Merge-Logik ohne Konfliktstrategie.

## Mandantengrenzen
Datensätze mit Family/Owner/Child-Kontext; Zugriff immer objekt- und scopebezogen. SQL-RLS als zweite Schutzschicht. `household_id` ist NICHT gleich `family_id`; Patchwork später über Freigaben und Guardian-Beziehungen. Kein Zugriff nur aufgrund bloßer Haushaltsmitgliedschaft.

## Skalierungsweg
Zunächst eine Postgres-DB und Web-Anwendung. Bei steigender Last: Queue, Outbox, Job-Worker, API-Rate-Limits, Caching pro Berechtigungsumfang, Connection Pool, Monitoring. Nicht vorschnell Microservices.

## Entscheidungslog
- ADR-0001: Modularer Monolith.
- ADR-0002: Personen/Benutzer/Haushalte trennen.
- ADR-0003: KI erzeugt nur Vorschläge, Regeln bestätigen Zeitfenster.
- ADR-0004: Connector-first, keine ungeprüften Scraper.
- ADR-0005: Integritätsschranken in der Datenbank.
- ADR-0006: Claude über FamilyOS-API/MCP – Vorschläge mit Freigabe, Kinder-Lernhilfe mit Schutzmaßnahmen.

## Konfigurationsabhängigkeiten
Anthropic Modellname nur über `ANTHROPIC_MODEL` konfigurieren (vorgesehen: `claude-opus-5-5`, vor Live-Start Verfügbarkeit/Verträge prüfen). Kein API-Aufruf im Sprint-0-Starter. Infrastruktur und Auth-Callbacks müssen später korrekt für Hosting und Region konfiguriert werden.
