# FamilyOS — Sprint 0 Starter

**Status:** Architektur- und Entwicklungsgrundgerüst, **kein** produktionsreifes Familienportal. Alle iPhone-/Google-/Schulportalkonten sind **noch nicht verbunden**. Die Startseite zeigt bewusst keine erfundenen Nutzerdaten.

## Projektziel

AI-first Familienorganisation für zunächst zwei Erwachsene und zwei Kinder in Klasse 5 an verschiedenen Schulen (Gymnasium und Gemeinschaftsschule). Apple/iPhone-first PWA, Google Calendar als erster Kalenderprovider. Später Patchwork-Haushalte, getrennte Kinderfreigaben, mehr Personen, andere Kalender/Login-Anbieter sowie LernSax, VP Plan, beste.schule und DLS. Schul-Connectoren nur nach technischer und rechtlicher Prüfung.

## Schnellstart

Voraussetzungen: Node.js >= 22.16, npm 10+, ein Git-Repository. Node >=22.16 wird für die TypeScript-Tests ohne Build-Schritt benötigt (`--experimental-strip-types`).

```bash
npm install
cp .env.example .env.local
npm test
npm run typecheck
npm run lint
npm run dev
```

Danach `http://localhost:3000` öffnen. Ohne Supabase-Konfiguration startet lediglich die öffentliche Startseite. **Nicht** sofort produktive Familien-, Schul- oder Google-Daten eingeben. 

Die Kerntests (Domain, Planung, Auth-Skeleton, Architektur-/Secret-Scans) laufen ohne Datenbank:

```bash
npm test
npm run check        # tests + typecheck + lint
npm run build && npm run security:bundle && npm run smoke:web
```

Datenbanktests (lokaler PostgreSQL, Wegwerf-DB `*_test`, nur synthetische Daten):

```bash
export DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export DATABASE_URL=$(npm run -s test:db:prepare | tail -1)
npm run test:db && npm run test:db:rollback
# oder gegen den echten Stack: supabase start && supabase db reset && DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db
```

## Repository

- `apps/web` — minimale Next.js-PWA-Oberfläche und Status-API.
- `packages/domain` — Domänenmodelle, datensparsame Berechtigungslogik und Zeitplanungsregeln.
- `packages/auth` — Schnittstellen für Rechteprüfung, keine ungesicherte Client-Autorisierung.
- `packages/planning` — deterministische Vorschlagslogik.
- `packages/ai` — AI-Provider-Kontrakt, bewusst kein unkontrollierter Datenbankzugriff.
- `packages/connectors` — Provider-neutraler Vertrag für Integrationen.
- `packages/database` — SQL-Migrationen, RLS-Funktionen, restriktive Policies.
- `workers/jobs` — Schnittstellen für idempotente Hintergrundjobs.
- `tests` — ausführbare Node-TypeScript-Kerntests, Berechtigungs- und Planungsfälle.
- `docs` — alle fachlichen/technischen Spezifikationen, ADR und der Sprint-0-Bericht (`docs/sprint0/REPORT.md`).
- `scripts` — Hilfsskripte für lokale DB-Prüfung, Bundle-Scan und Smoke-Test.

## Supabase lokal (noch manuell)

1. Supabase CLI installieren, `supabase start` ausführen (Docker nötig).
2. Migrationen aus `packages/database/migrations/` in Reihenfolge einspielen, vorzugsweise über die lokale Supabase-CLI bzw. versionierte Migrationen.
3. RLS-Verhalten **mit realen DB-Rollen/JWTs** zusätzlich testen; reine Kerntests ersetzen diese Integrationstests **nicht**.
4. Public URL und anon key in `.env.local` setzen. Service-Role-Key ausschließlich serverseitig verwenden.
5. Keine produktiven Eltern-/Kinderkonten anlegen, bevor die Auth-Flows und RLS-Integrationstests erfolgreich sind.

## Definition of Done für Sprint 0

- [x] Dokumentierte Entscheidungen und Grenzen
- [x] Minimaler Next.js/PWA-Einstieg, ohne Scheindaten
- [x] Domain-Modelle und deterministische Lernplanung
- [x] Patchworkfähiges Datenmodell und erste RLS-Policies
- [x] Tests für Sicherheitslogik und Planungslogik
- [x] Abhängigkeiten installieren und Next.js/ESLint/Typecheck verifizieren (Bericht: `docs/sprint0/REPORT.md`)
- [x] SQL-Migrationen und JWT/RLS-Integrationstests auf lokalem PostgreSQL 16 mit Supabase-Shim
- [ ] Dieselben Migrationen/Tests auf dem **echten** Supabase-Local-Stack (`supabase start`) — offen, siehe Bericht Punkt A
- [ ] Produktive Google-OAuth-Integration (Sprint 2)
- [ ] Schul-Connectoren (später)

## Sicherheit & Datenschutz

Keine Zugangsdaten in Git. Keine echten Kinderinformationen in Testdaten. Keine Schulplattformen automatisiert scrapen. Anthropic-API nur über serverseitige, minimierte Inputs. Nicht autorisierte Zugriffe *vor* KI-Promptaufbau stoppen. Privater Kalenderinhalt bleibt privat. Siehe `SECURITY.md`.

## Einstieg für Claude Code

Projektordner in Claude Code öffnen, `CLAUDE.md` lesen und zunächst den Abschnitt „Sprint 0 – Fertigstellungsarbeiten“ abarbeiten. In kleinen Änderungen arbeiten und jede ausgeführte Prüfung mit Ergebnis dokumentieren.
