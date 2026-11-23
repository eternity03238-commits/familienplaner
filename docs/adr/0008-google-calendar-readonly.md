# ADR-0008: Google Kalender, nur lesend, über OAuth (Sprint 2, vorgezogen)

Status: angenommen (Inhaberin, 23.11.2026, Wahl „Mit Google anmelden (OAuth)“ statt iCal-Adresse) · Bezug: CONNECTORS.md, ADR-0007, SECURITY.md

## Entscheidung
- Jeder Elternteil verbindet **seinen eigenen** Google-Kalender über OAuth 2.0: Authorization Code mit PKCE und State, der einmalig und 10 Minuten gültig ist und nur als Hash gespeichert wird.
- Angefragte Rechte: `openid email https://www.googleapis.com/auth/calendar.readonly`. **Nur lesen**, FamilyOS schreibt nichts nach Google.
- Der Refresh-Token liegt verschlüsselt im **Supabase Vault**. `integration_connections` speichert nur die Vault-ID, und diese Spalte ist für Endnutzer nicht lesbar. Zugriff haben ausschließlich `srv_*`-Funktionen, die nur `service_role` (der Vercel-Server mit `SUPABASE_SECRET_KEY`) ausführen darf.
- Server-Routen: `POST /api/google/start`, `GET /api/google/callback`, `POST /api/google/sync`, `POST /api/google/disconnect`. Die Anmeldung geht per `Authorization: Bearer <Supabase-Token>`, ohne Cookies und damit ohne CSRF-Fläche. Geheimnisse liegen nur in `apps/web/lib/server/` (geschützt durch `server-only` und einen Architekturtest).
- Synchronisation: Übernommen werden die in Google eingeblendeten Kalender, maximal 10, Hauptkalender zuerst, im Fenster −1 bis +60 Tage, höchstens 2000 Termine.
  - Der Abgleich ist idempotent über `external_resource_mappings`: Geänderte Termine werden aktualisiert, verschwundene gelöscht.
  - Ganztägige Termine werden als Datum gespeichert, eine Zeile pro Tag (Regel 8).
  - Jeder Lauf schreibt `sync_runs`. Fehler stehen sichtbar an der Verbindung (`error` bzw. `reauth_required`), FamilyOS meldet nie stillschweigend Erfolg.
  - Ausgelöst wird der Abgleich beim Öffnen der App, höchstens alle 15 Minuten, oder über „Jetzt aktualisieren“. Webhooks und syncToken-Deltas folgen später.
- Sichtbarkeit: Importierte Termine sind `private` und gehören dem verbindenden Elternteil. Der Partner sieht sie nicht. Das Teilen einzelner Kalender mit der Familie ist ein eigener späterer Schritt mit eigener Zustimmung.
- Trennen: Token, importierte Termine und Zuordnungen werden gelöscht, und der Zugriff wird bei Google widerrufen. In Google bleibt alles erhalten.

## Folgen
- Migration `0005_google_calendar.sql` mit Rollback. DB-Tests: `tests/db/google.test.ts`.
- Einrichtung durch die Inhaberin: Google-Cloud-Projekt im Testing-Modus mit Testnutzern. Vercel-Variablen `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` und `SUPABASE_SECRET_KEY`, optional `GOOGLE_REDIRECT_URI`.
- Im Testing-Modus laufen Google-Refresh-Tokens nach 7 Tagen ab. Die App zeigt dann „Neu verbinden“. Für dauerhaften Betrieb muss die App bei Google veröffentlicht werden. Für `calendar.readonly` gilt eine Verifizierung als sensibler Bereich, das ist offen.
