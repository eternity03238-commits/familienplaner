# ADR-0007: Login, Kindergeräte und Hosting für echte Daten (Sprint 1)

Status: angenommen (Produktverantwortliche, 21.11.2026) · Ersetzt nichts · Bezug: ADR-0002 (Konto ≠ Person), SECURITY.md

## Entscheidungen
1. **Hosting:** Supabase (Region **Irland, `eu-west-1`**; geplant war Frankfurt, die Inhaberin hat am 22.11.2026 entschieden, das bestehende EU-Projekt zu behalten) für Datenbank und Auth; Vercel (Funktionen in `fra1`) für die Next.js-App. Beide Konten legt die Inhaberin selbst an. Die GitHub-Pages-Demo bleibt rein statisch mit erfundenen Daten.
2. **Eltern melden sich mit E-Mail-Adresse und Passwort an, ohne Bestätigungsmail.** Das ist die zweite Änderung der Inhaberin vom 22.11.2026: Zuerst war Google geplant, dann E-Mail-Code. Der Code hätte einen eigenen Mailserver (SMTP) verlangt, weil Supabase die Mailvorlagen sonst nicht bearbeiten lässt. Für eine Familie ist das zu viel Aufwand.
   - Supabase Email-Provider: „Confirm email“ **aus**, Mindestlänge 8 Zeichen. Es wird keine Mail verschickt.
   - Die Felder tragen `autocomplete="username"` und `new-password`/`current-password`. So schlägt das iPhone ein starkes Passwort vor, speichert es im Schlüsselbund und füllt es danach per Face ID aus.
   - Risiko: Ohne Bestätigung ist nicht bewiesen, dass die Adresse der Person gehört. Das ist vertretbar, weil ein Konto ohne Einladung nur eine eigene, leere Familie anlegen kann. Zugriff auf eine bestehende Familie gibt es nur per Einladungslink (Einmal-Token).
   - Passwort vergessen: Eine Zurücksetzen-Mail ist ohne SMTP nur an die Inhaberin möglich. Ein Passwort-Reset mit SMTP kommt, wenn er gebraucht wird.
   - Der Google-Zugang für den Kalender (Sprint 2) bleibt eine eigene Verbindung, kein Login.
3. **Kinder bekommen kein eigenes E-Mail-Konto.** Ein Elternteil koppelt das Gerät des Kindes per Einmal-QR-Code (10 Minuten gültig, einmal nutzbar, nur als Hash gespeichert). Der Server legt dabei ein eigenes Auth-Konto für dieses Gerät an und ordnet es der Person des Kindes zu. Die **4-stellige PIN** ist eine Gerätesperre für die Bedienung, **kein** Zugangsnachweis. Die Berechtigung kommt allein aus der Sitzung und RLS. Eltern können jedes gekoppelte Gerät mit einem Tipp abmelden.
4. **Eltern sehen alle Termine ihrer Kinder.** Private Kindertermine gibt es im MVP nicht. Erziehungsberechtigte lesen alle `calendar_events` ihrer Kinder. Eine Lockerung pro Kind bleibt als späterer Schalter möglich (REPORT §5.1 damit entschieden).
5. **Eltern sehen einander:** Mitglieder derselben Familie lesen Name und Rolle der anderen Mitglieder (REPORT §5.4 damit entschieden), nicht aber deren private Daten.

## Folgen
- Migration `0004` mit Rollback: Kopplungscodes, Geräte-Sitzungen, Sichtbarkeit Eltern/Kind, Lesbarkeit der Familienmitglieder. Dazu RLS-Tests für Cross-Family- und Cross-Child-Isolation.
- Keine Service-Role-Keys im Browser. Admin-Aufrufe (Gerätekonto anlegen) laufen nur serverseitig und werden protokolliert (`audit_events`).
- Produktiver Deploy erst nach ausdrücklicher Freigabe, wenn das Sprint-1-Gate grün ist.
