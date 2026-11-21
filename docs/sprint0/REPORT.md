# Sprint-0-Abschlussbericht (Stand 2026-11-21)

**Ergebnis: Sprint 0 ist NICHT abgeschlossen.** Alle automatisierten Prüfungen, die in dieser Umgebung ausführbar waren, sind grün. Das Gate aus ROADMAP.md („alle Checks und DB-Rechttests grün“) gilt aber erst, wenn die Migrationen und RLS-Tests auf dem **echten Supabase-Local-Stack** laufen. Das war hier nicht möglich (siehe „Offene Punkte“). Sprint 1 wurde nicht begonnen.

Es wurden keine echten Familien-, Kinder-, Schul- oder Anbieterdaten und keine Produktionsumgebung verwendet. Alle Testdaten sind synthetisch (`tests/db/fixtures.ts`, E-Mail-Domain `familyos.test`).

## 1. Testumgebung

| Komponente | Version / Zustand |
|---|---|
| Node.js / npm | 22.23.5 / 10.9.9 |
| Next.js / React / Zod | 16.4.6 / 19.3.1 / 4.6.7 |
| PostgreSQL | 16.15 (lokal, Wegwerf-DB `familyos_test`) mit **Supabase-Kompatibilitäts-Shim** |
| Supabase CLI / Docker-Stack | **nicht ausgeführt** (Docker-Daemon startete, aber `public.ecr.aws` und `registry-1.docker.io` sind im Sandbox-Netz gesperrt; Images nicht ladbar) |
| Git | Verzeichnis ist kein Git-Repository; es wurden keine Commits erzeugt |

Der Shim (`packages/database/test-support/00_supabase_compat.sql`) bildet Rollen `anon`/`authenticated`/`service_role` (mit BYPASSRLS), `auth.users`, `auth.uid()` aus `request.jwt.claims` und die Standard-Tabellenrechte in `public` nach. RLS-Tests wechseln pro Test mit `SET LOCAL ROLE` in die API-Rolle und setzen die JWT-Claims, wie PostgREST es pro Request tut. Der Shim ist **kein** Ersatz für den echten Stack (siehe Punkt A).

## 2. Testergebnisse (Abschlusslauf, frischer `npm ci`)

| # | Prüfung | Befehl | Ergebnis |
|---|---|---|---|
| 1 | Abhängigkeiten | `npm ci` | OK, 0 Schwachstellen (`npm audit`, vorher 3: 2 high, 1 moderate) |
| 2 | Unit-/Sicherheits-/Architekturtests | `npm test` | **51 / 51 grün** (12 vorhanden + 39 neu) |
| 3 | TypeScript strict | `npm run typecheck` | grün (umfasst jetzt auch `scripts/`) |
| 4 | ESLint | `npm run lint` | grün (vorher nicht lauffähig, siehe 3.1) |
| 5 | Next.js-Build | `npm run build` | grün (Turbopack, 3 Routen) |
| 6 | Bundle-Prüfung | `npm run security:bundle` | grün: 10 Dateien, keine Secrets/Source-Maps |
| 7 | Smoke-Test der gebauten App | `npm run smoke:web` | grün: `/`, `/api/health`, Manifest, 404 für `/.env`, `/.git/config`, Security-Header |
| 8 | Migrationen 0001–0003 anwenden | `npm run test:db:prepare` | grün (Shim-DB, PostgreSQL 16) |
| 9 | DB-Tests mit echten Rollen + JWT-Claims | `npm run test:db` | **39 / 39 grün** |
| 10 | Rollback-Strategie | `npm run test:db:rollback` | grün: 0003 anwenden, zurückrollen, erneut anwenden; RLS-Basis aus 0001/0002 bleibt intakt |
| 11 | Mutationstests der DB-Suite | manuell, 10 absichtliche Fehler | 10 / 10 erkannt (RLS aus, FORCE RLS aus, INSERT-Grant, fehlende Trigger, Scope-Fehler in `can_access_child`, anon-Grant, fehlendes `search_path`) |
| 12 | Mutationstests der Architekturtests | manuell | Geheimnis-Muster und `ai → database`-Import werden erkannt |
| 13 | Integrität des Starterpakets | `MANIFEST.json` SHA-256 | alle Dateien des ZIP stimmten überein |

Aufschlüsselung `npm test` (51): `authorization` 8, `planning` 4 (vorhanden); `authorization.extended` 11, `planning.edge` 10 (Sommer-/Winterzeit, überlappende Belegungen, Mitternacht, Determinismus, Fail-closed), `auth` 6, `architecture` 12.
Aufschlüsselung `npm run test:db` (39): `rls` 19, `privileges` 8, `guards` 11, `parity` 1 (432 Kombinationen Akteur × Kind × Scope × Capability: TypeScript-Policy und SQL-Policy liefern in allen Fällen dasselbe).

### SECURITY.md-Pflichtfälle

| Pflichtfall | Abdeckung |
|---|---|
| Nicht angemeldet: Kinderdaten verweigert | `rls`: anon 42501 auf allen Tabellen; JWT ohne FamilyOS-User sieht nichts |
| Elternteil A: autorisiertes Kind A erlaubt | `rls`: Guardian sieht genau Tasks/Exams/Projekte/Sessions/Proposals seiner Kinder |
| Nicht beteiligtes Elternteil: Kind A verweigert | `rls`: fremde Familie, unverifizierter Guardian, Haushaltsmitglied ohne Bezug |
| Kind A: Kind B nicht lesbar | `rls`: Geschwister-Isolation in beide Richtungen |
| Patchwork-Grant nur `sports.read`: `tasks.read` verweigert | `rls` + `authorization.extended` |
| Ablauf/Widerruf eines Grants | `rls`, `authorization.extended` (Grenzfall „läuft exakt jetzt ab“, unlesbares Datum) |
| Kind kann Frist nicht ändern | `rls` (kein UPDATE-Recht) und `guards` (Trigger, auch bei umgangener RLS) |
| KI nicht ohne Autorisierung | `rls` (kein Schreibrecht für Endnutzer), `guards` (nur verifizierter Guardian dieses Kindes entscheidet, einmalig, Payload unveränderlich), `architecture` (`packages/ai` kann DB/Connectoren nicht importieren) |
| DB-RLS mit echten JWT-Rollen | `rls`/`privileges`/`guards` (auf Shim; echter Stack siehe Punkt A) |

## 3. Gefundene Fehler und Änderungen

### 3.1 Behobene Fehler
1. **ESLint nicht lauffähig:** `eslint-config-next@15` liefert keine Flat-Config; `eslint.config.mjs` ist für v16 geschrieben. → Next/eslint-config-next auf 16.4.6 angehoben, `typescript`-Regelsatz ergänzt, `settings.next.rootDir` für das Monorepo gesetzt.
2. **3 Schwachstellen (2 high, 1 moderate):** `next@15.5.29` bündelt verwundbares `postcss`; `zod@3` mit Advisory (Speichererschöpfung bei sehr großen Collections). → `next@^16.4.6`, `zod@^4.6.7` (Zod ist noch nicht im Code verwendet, daher kein Migrationsaufwand). Ergebnis: 0 Schwachstellen.
3. **`pgcrypto` in `public` (Migration 0001):** Extension-Funktionen im exponierten Schema wären in Supabase als RPC aufrufbar. → `create extension … with schema extensions`; neuer Test verhindert Extensions in `public`.
4. **Generierte `next-env.d.ts` brach sauberen Typecheck:** Next 16 schreibt Importe auf `.next/types/*` in die Datei. → `apps/web/next-env.d.ts` in `.gitignore`, Starter-Fassung belassen.
5. **ADR-0004 fehlte** (in ARCHITECTURE.md referenziert). → nachgetragen.
6. **DATA_MODEL.md ↔ Schema:** Dokument nennt die Person eines Users „optional“, Schema verlangt `person_id NOT NULL` (richtig: Kinder ohne Login haben eine Person ohne User). → Dokument korrigiert.

### 3.2 Domain/DB-Vergleich (CLAUDE.md Sprint-0-Schritt 3)
- **Autorisierungssemantik:** identisch (432/432 Kombinationen).
- `Task.status` kannte `cancelled` nicht → ergänzt; `Task.dueOn` (Ganztagsfrist) ergänzt; `Exam.title` optional ergänzt.
- Bewusste Namensunterschiede dokumentiert (DATA_MODEL.md, Abschnitt „Domain ↔ DB“): `verified` ↔ `verified_at`, `subjectChildId` ↔ `subject_person_id`, `timeZone` ↔ `timezone`, `date` ↔ `exam_on`.

### 3.3 Neue Schutzschichten (Patchwork, Mandantentrennung, KI-Trennung)
- **Migration `0003_integrity_guards.sql`** (+ Rollback, ADR-0005): `ai_proposals` (Statusmaschine, Entscheidung nur durch verifizierten Guardian des Kindes, Payload unveränderlich), `tasks` (Kinder dürfen nur open↔done), `access_grants` (nur durch verifizierte Guardians ausstellbar, unveränderlich außer Widerruf). Gelten auch für `service_role`.
- Explizite `REVOKE … FROM anon` auf den 0002-Helferfunktionen.
- **Auth-Skeleton ohne Konten** (`packages/auth`): fail-closed `createAuthorizer(ports)`, einheitlicher 403 gegen IDOR/BOLA-Orakel, keine Fehlerdetails nach außen. Der Supabase-Adapter ist Sprint-1-Arbeit.
- **Security-Header** und `poweredByHeader: false` in `apps/web/next.config.ts` (CSP folgt mit Auth in Sprint 1).
- **CI** (`.github/workflows/ci.yml`): `npm ci`, Audit (high/critical), Tests, Typecheck, Lint, Build, Bundle-Scan, Smoke-Test; Job `database` (PostgreSQL 16 + Shim); Job `supabase-local` (echter Stack, ungeprüft, siehe A). `supabase/migrations` ist ein Symlink auf `packages/database/migrations`, damit die Supabase-CLI dieselben Dateien nutzt.

### 3.4 Geänderte/neue Dateien gegenüber dem Starterpaket
Geändert: `.github/workflows/ci.yml`, `.gitignore`, `apps/web/next.config.ts`, `apps/web/package.json`, `eslint.config.mjs`, `package.json`, `tsconfig.json`, `packages/auth/src/index.ts`, `packages/domain/src/index.ts`, `packages/database/migrations/0001_initial.sql`, README/SECURITY/DATA_MODEL/CLAUDE, `packages/database/README.md`.
Neu: `package-lock.json`, `packages/database/migrations/0003_integrity_guards.sql`, `packages/database/rollback/`, `packages/database/test-support/`, `scripts/` (DB-Vorbereitung, Seed, Rollback-Check, Bundle-Check, Smoke-Test), `supabase/migrations` (Symlink), `tests/` (`architecture`, `auth`, `authorization.extended`, `planning.edge`, `db/*`), `docs/adr/0004`, `docs/adr/0005`, dieser Bericht.

## 4. Offene Punkte (verhindern den Abschluss von Sprint 0)

**A. Echter Supabase-Local-Stack nicht ausgeführt.** *Ursache:* Image-Registries im Sandbox-Netz gesperrt. *Auswirkung:* Unterschiede zwischen Shim und echtem Supabase (z. B. Rolle `postgres` ohne Superuser-Recht, Standardrechte für `anon`/`authenticated`, `auth.users`-Spalten, PostgreSQL-Hauptversion; `supabase/config.toml` nennt 15, getestet wurde 16) sind nicht ausgeschlossen. Der Test „Definer-Funktionen gehören einer Rolle mit BYPASSRLS“ und der Schema-`CREATE`-Test sind genau darauf ausgelegt, solche Abweichungen zu melden. *Nächster Schritt:* auf einer Maschine mit Docker und Registry-Zugang `supabase start && supabase db reset && DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db` ausführen oder den CI-Job `supabase-local` laufen lassen. Erst wenn das grün ist, Gate in ROADMAP.md abhaken.

**B. CI-Workflow nicht auf GitHub gelaufen.** Jeder Schritt wurde lokal mit denselben Befehlen ausgeführt (inkl. frischem `npm ci`); die YAML-Syntax ist geprüft. Der erste echte CI-Lauf steht aus.

**C. UI-Prüfung bei 375 px Breite und Barrierefreiheit (CLAUDE.md DoD) nicht durchgeführt.** Es steht kein Browser-Test in dieser Sitzung zur Verfügung; die Startseite ist statisch ohne Daten. Vor dem ersten Funktions-PR nachholen.

## 5. Entscheidungsbedarf (Produkt/Recht, keine Fehler)
1. **Private Kinderkalender:** Termine eines Kindes mit `visibility = 'private'` sind für dessen Erziehungsberechtigte unsichtbar; nur `shared_child` ist lesbar. Gewollt?
2. **Namenssichtbarkeit bei Patchwork-Grants:** `persons` ist nur für `school`-Lesezugriff oder Guardians lesbar. Ein Grantee mit z. B. nur `sports.read` sieht den Namen des Kindes nicht; ein `school`-Grantee sieht zusätzlich `birth_date`. Spaltenbezogene Sichtbarkeit sollte vor Patchwork-UI entschieden werden.
3. **Lesescope für KI-Vorschläge:** `ai_proposals` ist an den Scope `projects` gebunden (aus 0002 übernommen). Fachlich prüfen, ob Vorschläge zu Prüfungen/Aufgaben eigene Scopes brauchen.
4. **Mitverantwortliche sehen sich nicht:** Ein Elternteil kann die `persons`-Zeile des anderen Elternteils nicht lesen. Wird mit Familien-/Haushaltsansichten in Sprint 1 relevant.
5. **Datenschutz/Rechtsprüfung** (Sorgeberechtigungsnachweis, Löschfristen, KI-Subprozessoren) bleibt wie in SECURITY.md und DATA_MODEL.md offen.

## 6. Reproduktion
```bash
npm ci
npm run check            # tests + typecheck + lint
npm run build && npm run security:bundle && npm run smoke:web
# DB (lokaler Postgres als Superuser, Wegwerf-Datenbank *_test):
export DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export DATABASE_URL=$(npm run -s test:db:prepare | tail -1)
npm run test:db && npm run test:db:rollback
```
Die DB-Skripte weigern sich, gegen nicht-lokale Hosts oder Datenbanken ohne Namensendung `_test` (bzw. Supabase-Local-Port 54322) zu laufen.
