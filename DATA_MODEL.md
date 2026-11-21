# DATA_MODEL.md — Domain, Relationen, Migrationen

## Trennung von Identitäten
`users` referenziert ein Auth-Konto und genau eine `person` (`person_id NOT NULL UNIQUE`). Eine `person` kann ohne Login existieren (z.B. Kind ohne Konto), ein Konto ohne Person nicht. `families` repräsentieren logische Familiengruppen, `households` physische/organisatorische Haushalte. Mitgliedschaften sind Many-to-many.

## Wichtige Entitäten
- `users(id, auth_user_id, person_id)`
- `persons(id, display_name, birth_date)` — Geburtsdatum optional und nur bei Bedarf.
- `families(id, name, timezone)`
- `households(id, family_id, name)`
- `family_memberships(family_id, person_id, role)`
- `household_memberships(household_id, person_id)`
- `child_guardianships(child_person_id, guardian_person_id, verified_at)`
- `access_grants(subject_person_id, grantee_person_id, scope, capability, expires_at, revoked_at)` (spätere Patchwork-Freigaben)
- `schools`, `school_enrollments`, `subjects`
- `tasks`, `task_completions`, `exams`, `projects`, `project_steps`, `study_sessions`, `routines`
- `calendar_events`, `integration_connections`, `external_resource_mappings`, `sync_runs`, `ai_proposals`, `audit_events`

## Berechtigung
Einer Person zugeordnetes Auth-Konto darf eigene Profilinformationen abrufen. Verifizierte Erziehungsberechtigte sehen autorisierte Kinderdaten. Spätere access_grants gewähren expliziten Scope (`school`, `tasks`, `sports`, `exams`, `projects`, `schedule`) und Capability (`read`/`write`) für genau ein Kind. „family_member“ allein reicht nicht, um fremde Daten zu lesen. Scopes nicht mit Global-Admin verwechseln.

## Datenqualitätsregeln
- `tasks.due_at` timestamptz; Fälligkeitsdatum ohne Uhrzeit als separates Datum bei Bedarf.
- `calendar_events.starts_at` / `.ends_at` als `timestamptz`, `all_day` und `event_date` für ganztägige Termine.
- `external_resource_mappings` Unique-Key auf `(connection_id, resource_kind, external_id)`.
- Keine doppelten Completion-Einträge pro Aufgabe und Person.
- `ai_proposals` mit `pending/approved/rejected`, Originalpayload und Freigabezeitpunkt.
- Logische Löschung/Widerruf bei Berechtigungen; Fremdschlüssel und Audits beachten.

## Migrationen
`packages/database/migrations/0001_initial.sql` erstellt Typen, Tabellen und Indizes. `0002_security.sql` legt Restriktionsfunktionen und RLS-Policies an. Aus Sicherheitsgründen sind spätere Patchwork-Schreibflows im MVP noch nicht freigeschaltet. Server-seitige API-Policy + DB-RLS müssen gemeinsam getestet werden.

`0003_integrity_guards.sql` (Rollback: `packages/database/rollback/`) ergänzt Integritätsschranken, die für jede Rolle gelten (ADR-0005): Statusmaschine und Freigabe-Regeln für `ai_proposals`, Statusbeschränkung für Kinder auf `tasks`, Ausstellungs- und Widerrufsregeln für `access_grants`. `ai_proposals.approved_by_person_id`/`approved_at` halten bei `approved` *und* `rejected` die entscheidende Person fest.

## Domain ↔ DB (Sprint-0-Abgleich)
| Domain (`packages/domain`) | DB |
|---|---|
| `GuardianRelationship.verified` | `child_guardianships.verified_at IS NOT NULL` |
| `AccessGrant.subjectChildId` / `granteePersonId` | `access_grants.subject_person_id` / `grantee_person_id` |
| `Family.timeZone` | `families.timezone` |
| `Task.status` (`open`/`done`/`cancelled`), `dueAt`, `dueOn` | `tasks.status`, `due_at` (timestamptz), `due_on` (date) |
| `Exam.date`, `Exam.subject`, `Exam.title` | `exams.exam_on`, `subjects.name` über `subject_id`, `exams.title` |
Die Zugriffsentscheidung (`mayAccessChild` ↔ `app_private.can_access_child`) wird in `tests/db/parity.test.ts` für alle Kombinationen gegeneinander geprüft.

## Offene Punkte
Sorgeberechtigungsprüfung; Datenschutz-/Löschfristen; Kinderanmeldung vs. elterngeführte Profile; tatsächliche Schul-Provider; mehrfache Familienkontexte in einem eingeloggten Konto; Offline-Konfliktauflösung; Trennung von Eltern-Privatkalendern.
