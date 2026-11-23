# SECURITY.md — Threat Model, Minderjährigenschutz und Freigaben

**Gilt als Sicherheitsanforderung, nicht als Behauptung bereits produktionsreifer Compliance.** Vor echtem Betrieb: Datenschutz- und Rechtlichkeitsprüfung für Deutschland/EU, Verträge und internationale Übermittlung mit externen KI-Diensten klären.

## Bedrohungen
1. Elternteil sieht private Daten eines anderen Erwachsenen oder Kindes ohne Berechtigung.
2. Patchwork-Elternteil erhält versehentlich Zugriff auf Geschwister-/Haushaltsdaten.
3. Kompromittierter Schulimport gibt vor, systeminterne Anweisungen zu sein (Prompt Injection).
4. Wiederholte Google-Webhooks erzeugen doppelte Termine.
5. Token-/Key-Leak in Client, Logs oder Repository.
6. Manipulierte Aufgaben-/Kind-ID in API-Pfad (IDOR/BOLA).
7. KI verschiebt ungefragt verbindliche Veranstaltungen.
8. Minderjährige erhalten unangemessene oder überfordernde Planung.

## Kontrollen
- Supabase Auth + verifizierte Session auf *jeder* API-Anfrage.
- PostgreSQL RLS plus explizite serverseitige Ressourcenprüfung.
- Kein generelles Elternrecht auf private Erwachsenentermine.
- Guardian-Beziehungen nur nach Verifikation; `access_grants` nicht selbst ausstellbar.
- Read/write pro Scope getrennt; zeitliche Befristung/Widerruf/auditierbare Änderungen.
- Keine `service_role`-Credentials an Browser, mobile Geräte oder LLM geben.
- Kein `SELECT *` in KI-Kontext; vor Promptaufbau feldweise minimieren.
- Tool-Calls beschränkt auf freigegebene interne Aktionen; JSON-Schemas validieren.
- Rate Limits, sichere Session Cookies, CSRF-Betrachtung bei mutierenden Endpunkten, OAuth state/PKCE, Secret-Rotation.
- Kalender-Tokens nur verschlüsselt speichern; Consent und Anbieterwiderruf unterstützen.
- Nachrichten und Schuldateien als untrusted content, niemals als Entwickleranweisung.
- Familienaufgaben auf kindgerechte Belastung begrenzen. Kein verdecktes Performance-Scoring.
- Audit-Logs pseudonymisieren, kurz und zweckgebunden aufbewahren.

## Testfälle (Pflicht)
- Nicht angemeldet: Zugriff auf Kinderdaten verweigert.
- Elternteil A: Zugriff auf autorisiertes Kind A erlaubt.
- Nicht beteiligtes Elternteil: Zugriff auf Kind A verweigert.
- Kind A: Kind B nicht lesbar.
- Patchwork-Grant nur `sports.read`: `tasks.read` verweigert.
- Ablauf/Widerruf eines Grants: Zugriff verweigert.
- Child cannot mutate task due date by completion endpoint.
- KI darf keine kalenderübergreifende Änderung ohne ausdrückliche Autorisierung durchführen.
- DB-RLS mit echten JWT-Rollen ausführen (noch **nicht** im Starter getestet).

## Datenminimierung
Namen optional pseudonymisieren; Geburtstag nur falls erforderlich; Fächer/Termine möglichst ohne personenbezogene Schultexte an KI. Nachvollziehbare Löschpfade und Exportrecht planen. Produktionshosting und Subprozessoren im EU-Kontext bewerten.

## Sicherheitsstatus Sprint 0 (Stand 2026-11-21)
Autorisierungslogik, SQL-RLS und Integritätsschranken (Migration 0003) sind mit automatisierten Tests abgedeckt: Unit-/Architekturtests (`npm test`) und DB-Tests mit echten API-Rollen und JWT-Claims (`npm run test:db`), derzeit auf PostgreSQL 16 mit Supabase-Shim. **Noch offen:** Lauf auf dem echten Supabase-Local-Stack, erster CI-Lauf auf GitHub, Auth-Flow (nur fail-closed Skeleton in `packages/auth`), Live-Deploy. Details, Ergebnisse und Entscheidungsbedarf: `docs/sprint0/REPORT.md`. Keine Produktivbereitschaft.
