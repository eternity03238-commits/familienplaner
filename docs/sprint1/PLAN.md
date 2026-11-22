# Sprint 1 — Familie einrichten mit echten Daten

Ziel: Ihr meldet euch an, legt in wenigen Minuten eure Familie an, und beide Kinder sehen auf ihrem eigenen Gerät ihren Tag. Alles bleibt sicher getrennt. Entscheidungen: ADR-0007.

## Leitlinie Bedienung
- **Ein Schritt pro Bildschirm,** eine klare Hauptaktion und ein sichtbarer Fortschritt („2 von 4“).
- **Nichts fragen, was nicht nötig ist:** Vorname reicht. Schule und Klasse sind optional und später ergänzbar.
- **Alles rückgängig machbar:** Namen ändern, Kind entfernen, Gerät abmelden. Löschen nur mit Bestätigung.
- **Sprache der Familie,** keine Technikwörter: „Gerät von Mia verbinden“ statt „Device-Pairing“.
- **Leere Seiten erklären den nächsten Schritt** („Noch keine Aufgaben. Leg die erste an.“).

## Ablauf (ca. 3 Minuten)
1. **Willkommen:** „Neu hier“: E-Mail-Adresse und Passwort festlegen (das iPhone speichert es). Es wird keine Mail verschickt.
2. **Familie:** Familienname eintippen (ein Feld), dazu der eigene Vorname.
3. **Kinder:** Vorname und Farbe/Avatar je Kind, „+ weiteres Kind“. Schule optional.
4. **Partner einladen:** Einladungslink teilen (iPhone-Teilen-Menü). Der Partner legt über den Link ebenfalls ein Konto mit E-Mail-Adresse und Passwort an und landet direkt in der Familie. Überspringbar.
5. **Kindergerät verbinden:** QR-Code am Elterngerät, Kamera am Kindergerät, Kind wählt eine 4-stellige PIN. Fertig. Überspringbar, später unter „Familie“.

## Umsetzung (kleine PRs)
1. Migration 0004 + Rollback + RLS-Tests (Kopplung, Sichtbarkeit, Familienmitglieder).
2. Supabase-Adapter für `packages/auth` (serverseitige Session-Prüfung, fail-closed) + E-Mail/Passwort-Login ohne Bestätigungsmail + Abmelden.
3. Onboarding-Bildschirme 1–4 (Design System V2, 375 px, VoiceOver, 200 % Text).
4. Kindergerät koppeln (QR, Einmalcode, PIN-Sperre, Geräteliste mit „Abmelden“).
5. Explore/Command lesen echte Daten statt Demodaten. Die Demo bleibt per Schalter erhalten.
6. CSP-Header, Rate-Limits für Kopplung, Audit-Einträge.
7. Vorschau-Deploy auf Vercel mit **Testkonten** → dann Freigabe → erst danach eure echten Daten.

## Gate (ROADMAP)
- Automatischer Test: Elternteil A sieht keine fremde Familie. Kind A sieht weder Daten von Kind B noch Elterndaten. Ein abgemeldetes Gerät verliert sofort den Zugriff. Ein abgelaufener oder benutzter Code funktioniert nicht.
- Alle Checks grün, keine echten Daten in Logs oder Git, Sichtprüfung auf dem iPhone.

## Was du tun musst
Siehe `SETUP_KONTEN.md`: zwei Konten anlegen (erledigt), Supabase einstellen (ca. 5 Minuten). Bis dahin baue und teste ich alles lokal mit Testkonten.

## Stand
- **Schritt 1 erledigt (lokal, 21.11.2026):** Migration `0004_family_onboarding.sql` mit Rollback.
  - Funktionen: `create_family`, `add_child`, `rename_person`, `rename_family`, `create_family_invite`/`accept_family_invite` (7 Tage, einmalig), `create_child_pairing_code` (10 Minuten, nur der neueste Code gilt), `revoke_child_device`, `my_family`.
  - Das Gerätekonto bindet nur der Server: `app_private.redeem_child_pairing`, ausführbar ausschließlich mit der Service-Rolle.
  - Tests: `tests/db/onboarding.test.ts` mit 10 Szenarien. Es gibt keine Datenlecks zwischen Familien, zwischen Geschwistern oder zwischen Kind und Eltern. Einladungen und Kopplungscodes funktionieren einmalig, laufen ab und werden nur als Hash gespeichert. Ein abgemeldetes Gerät verliert sofort den Zugriff. Jede Änderung erzeugt einen Audit-Eintrag ohne Geheimnisse.
  - DB-Tests lokal: 50/50. Rollback-Prüfung grün. `npm run check`: 93/93.
- **Noch nicht** auf das Supabase-Projekt der Inhaberin angewendet. Das passiert erst nach Freigabe, zusammen mit dem Login-Schritt.
- **Schritt 3 als Vorschau umgesetzt (21.11.2026):** Einrichtung unter `/einrichten`, nach der Designvorgabe der Inhaberin (Commit `e822036`).
  - Layout: links das Bild, rechts ein Schritt pro Bildschirm.
  - Ablauf: E-Mail und Code → Familie → Kinder → Partner → Kindergeräte → Zusammenfassung. In der Zusammenfassung lässt sich jeder Abschnitt mit „Ändern“ bearbeiten.
  - Das Bild zeigt Familienname und Kinder schon während der Eingabe. Am Ende blendet es von Abend zu Nacht über.
  - **Vorschau:** Es wird nichts gespeichert oder verschickt, jeder 6-stellige Code funktioniert, der QR-Code ist ein Platzhalter. Die Anbindung an Supabase (Code-Login, 0004-Funktionen, echter QR-Code) folgt als nächster Schritt.
  - Logik und Tests: `apps/web/lib/setup/flow.ts`, `tests/setup-flow.test.ts`. Die Namensregeln entsprechen denen der Datenbank.
  - Prüfungen: `design:check` 144 Kombinationen / 0 Befunde, 98/98 Tests. Screenshots in `docs/design/screenshots/sprint1/`.
- **Schritt 2 und 3 live-fähig (22.11.2026):** Die Einrichtung schaltet automatisch in den echten Modus, sobald `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` gesetzt sind. Ohne diese Werte bleibt sie Vorschau, zum Beispiel auf GitHub Pages.
  - Code-Login per E-Mail (Supabase OTP). Familie anlegen und umbenennen, Kinder anlegen und umbenennen.
  - Einladungslink: Der Token steht im URL-Fragment und wird sofort aus der Adresszeile entfernt. Der Beitritt als Partner braucht nur den Vornamen.
  - Wer schon eingerichtet ist, landet direkt in der Zusammenfassung. Eine zweite Familie entsteht nicht.
  - Fehler erscheinen als kurze deutsche Handlungsanweisung, interne Servermeldungen werden nie angezeigt.
  - Kindergeräte koppeln: im Live-Modus noch nicht freigeschaltet. Das Einlösen braucht eine Server-Route mit Service-Rolle (nächster Schritt).
  - Tests: `tests/setup-backend.test.ts`. Dazu `tests/e2e/setup-live.ts` in der CI gegen den echten lokalen Supabase-Stack: Codes kommen aus Mailpit, RPCs und RLS sind echt.
  - Bundle-Prüfung blockiert jetzt auch `sb_secret_…`-Schlüssel.
  - Datenbank-Deploy über `db-deploy.yml` (Push auf Branch `db-deploy/dry-run` bzw. `db-deploy/apply`, Secret `SUPABASE_DB_URL`), danach eine lesende RLS-Prüfung.
- **Datenbank eingespielt (22.11.2026, Freigabe der Inhaberin):** 0001 bis 0004 im Supabase-Projekt (eu-west-1) über `db-deploy.yml`, Lauf auf Commit `9918e8d`.
  - Prüfung danach: 27 Tabellen, 0 ohne RLS, 0 öffentliche Funktionen für `anon` ausführbar.
  - Noch keine Nutzerdaten. Es gibt noch keinen App-Deploy mit Live-Modus.
- **Login vereinfacht (22.11.2026, Entscheidung der Inhaberin):** E-Mail und Passwort statt Code, ohne Bestätigungsmail und ohne SMTP. Siehe ADR-0007, Punkt 2. Der E2E-Test prüft Registrierung, falsches Passwort, doppelte Registrierung und erneutes Anmelden.
- **Echte Elternansicht (22.11.2026):** Im Live-Modus zeigt `/command` nach der Anmeldung die echte Familie, ohne Demodaten und ohne Demo-Banner.
  - Startseite: „Heute“ als leerer Zustand mit Hinweis auf den Kalender, dazu „So geht es weiter“ mit offenen und erledigten Schritten.
  - Kalender und Planung erklären im leeren Zustand den nächsten Schritt. Das Profil zeigt die Mitglieder und hat „Abmelden“.
  - Neue Seite `/command/verbindungen`: Google Kalender (kommt als Nächstes), LernSax, VP Plan, beste.schule, DLS, jeweils mit ehrlichem Status, wie die Verbindung funktionieren wird und was dafür fehlt.
  - Die Kinderansicht bleibt Beispiel, mit eigenem Hinweis, bis Kindergeräte gekoppelt sind.
  - Abgemeldet oder ohne Familie: Hinweis mit Weg zu `/einrichten`.
  - Tests: `tests/live.test.ts`. Live-Screens im Browser mit simulierter Supabase-Antwort geprüft (hell/dunkel, ohne Konsolenfehler). `design:check` 156/0.
