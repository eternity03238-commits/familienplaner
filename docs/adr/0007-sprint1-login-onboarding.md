# ADR-0007: Login, Kindergeräte und Hosting für echte Daten (Sprint 1)

Status: angenommen (Produktverantwortliche, 21.11.2026) · Ersetzt nichts · Bezug: ADR-0002 (Konto ≠ Person), SECURITY.md

## Entscheidungen
1. **Hosting:** Supabase (Region Frankfurt, `eu-central-1`) für Datenbank und Auth; Vercel (Funktionen in `fra1`) für die Next.js-App. Beide Konten legt die Inhaberin selbst an. Die GitHub-Pages-Demo bleibt rein statisch mit erfundenen Daten.
2. **Eltern melden sich mit Google an** (Supabase Auth, Provider Google). Beim Login werden nur `openid email profile` angefragt. Kalenderrechte fragt erst Sprint 2 separat und mit eigener Zustimmung an (inkrementelle Autorisierung).
3. **Kinder bekommen kein eigenes E-Mail-Konto.** Ein Elternteil koppelt das Gerät des Kindes per Einmal-QR-Code (10 Minuten gültig, einmal nutzbar, nur als Hash gespeichert). Der Server legt dabei ein eigenes Auth-Konto für dieses Gerät an und ordnet es der Person des Kindes zu. Die **4-stellige PIN** ist eine Gerätesperre für die Bedienung, **kein** Zugangsnachweis. Die Berechtigung kommt allein aus der Sitzung und RLS. Eltern können jedes gekoppelte Gerät mit einem Tipp abmelden.
4. **Eltern sehen alle Termine ihrer Kinder.** Private Kindertermine gibt es im MVP nicht. Erziehungsberechtigte lesen alle `calendar_events` ihrer Kinder. Eine Lockerung pro Kind bleibt als späterer Schalter möglich (REPORT §5.1 damit entschieden).
5. **Eltern sehen einander:** Mitglieder derselben Familie lesen Name und Rolle der anderen Mitglieder (REPORT §5.4 damit entschieden), nicht aber deren private Daten.

## Folgen
- Migration `0004` mit Rollback: Kopplungscodes, Geräte-Sitzungen, Sichtbarkeit Eltern/Kind, Lesbarkeit der Familienmitglieder. Dazu RLS-Tests für Cross-Family- und Cross-Child-Isolation.
- Keine Service-Role-Keys im Browser. Admin-Aufrufe (Gerätekonto anlegen) laufen nur serverseitig und werden protokolliert (`audit_events`).
- Produktiver Deploy erst nach ausdrücklicher Freigabe, wenn das Sprint-1-Gate grün ist.
