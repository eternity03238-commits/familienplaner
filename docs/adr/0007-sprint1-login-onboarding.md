# ADR-0007: Login, Kindergeräte und Hosting für echte Daten (Sprint 1)

Status: angenommen (Produktverantwortliche, 21.11.2026) · Ersetzt nichts · Bezug: ADR-0002 (Konto ≠ Person), SECURITY.md

## Entscheidungen
1. **Hosting:** Supabase (Region **Irland, `eu-west-1`**; geplant war Frankfurt, die Inhaberin hat am 22.11.2026 entschieden, das bestehende EU-Projekt zu behalten) für Datenbank und Auth; Vercel (Funktionen in `fra1`) für die Next.js-App. Beide Konten legt die Inhaberin selbst an. Die GitHub-Pages-Demo bleibt rein statisch mit erfundenen Daten.
2. **Eltern melden sich per E-Mail an, ohne Passwort** (Änderung der Inhaberin vom 21.11.2026, ersetzt „Mit Google anmelden“). Ablauf: E-Mail-Adresse eingeben, 6-stelligen Code aus der Mail in der App eintippen. Technisch ist das Supabase Email-OTP. Wir nehmen bewusst keinen Anmeldelink: Auf dem iPhone öffnet ein Link Safari statt der installierten App, die Anmeldung landet dann im falschen Fenster. Der Code funktioniert überall. Den Google-Zugang für den Kalender fragt erst Sprint 2 separat an. Er ist dann eine Verbindung, kein Login.
   - **E-Mail-Versand:** Supabase verschickt ohne eigenen Mailserver nur an Mitglieder des Supabase-Teams und nur 2 Mails pro Stunde. Für Tests reicht das. Bevor der zweite Elternteil sich anmeldet, braucht es einen eigenen SMTP-Versand. Dessen Zugangsdaten trägt die Inhaberin selbst in Supabase ein.
3. **Kinder bekommen kein eigenes E-Mail-Konto.** Ein Elternteil koppelt das Gerät des Kindes per Einmal-QR-Code (10 Minuten gültig, einmal nutzbar, nur als Hash gespeichert). Der Server legt dabei ein eigenes Auth-Konto für dieses Gerät an und ordnet es der Person des Kindes zu. Die **4-stellige PIN** ist eine Gerätesperre für die Bedienung, **kein** Zugangsnachweis. Die Berechtigung kommt allein aus der Sitzung und RLS. Eltern können jedes gekoppelte Gerät mit einem Tipp abmelden.
4. **Eltern sehen alle Termine ihrer Kinder.** Private Kindertermine gibt es im MVP nicht. Erziehungsberechtigte lesen alle `calendar_events` ihrer Kinder. Eine Lockerung pro Kind bleibt als späterer Schalter möglich (REPORT §5.1 damit entschieden).
5. **Eltern sehen einander:** Mitglieder derselben Familie lesen Name und Rolle der anderen Mitglieder (REPORT §5.4 damit entschieden), nicht aber deren private Daten.

## Folgen
- Migration `0004` mit Rollback: Kopplungscodes, Geräte-Sitzungen, Sichtbarkeit Eltern/Kind, Lesbarkeit der Familienmitglieder. Dazu RLS-Tests für Cross-Family- und Cross-Child-Isolation.
- Keine Service-Role-Keys im Browser. Admin-Aufrufe (Gerätekonto anlegen) laufen nur serverseitig und werden protokolliert (`audit_events`).
- Produktiver Deploy erst nach ausdrücklicher Freigabe, wenn das Sprint-1-Gate grün ist.
