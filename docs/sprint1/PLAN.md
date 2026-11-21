# Sprint 1 — Familie einrichten mit echten Daten

Ziel: Ihr meldet euch an, legt in wenigen Minuten eure Familie an, und beide Kinder sehen auf ihrem eigenen Gerät ihren Tag. Alles bleibt sicher getrennt. Entscheidungen: ADR-0007.

## Leitlinie Bedienung
- **Ein Schritt pro Bildschirm,** eine klare Hauptaktion und ein sichtbarer Fortschritt („2 von 4“).
- **Nichts fragen, was nicht nötig ist:** Vorname reicht. Schule und Klasse sind optional und später ergänzbar.
- **Alles rückgängig machbar:** Namen ändern, Kind entfernen, Gerät abmelden. Löschen nur mit Bestätigung.
- **Sprache der Familie,** keine Technikwörter: „Gerät von Mia verbinden“ statt „Device-Pairing“.
- **Leere Seiten erklären den nächsten Schritt** („Noch keine Aufgaben. Leg die erste an.“).

## Ablauf (ca. 3 Minuten)
1. **Willkommen:** E-Mail-Adresse eingeben, 6-stelligen Code aus der Mail eintippen. Kein Passwort.
2. **Familie:** Familienname vorschlagen (aus dem Google-Namen), bestätigen oder ändern.
3. **Kinder:** Vorname und Farbe/Avatar je Kind, „+ weiteres Kind“. Schule optional.
4. **Partner einladen:** Einladungslink teilen (iPhone-Teilen-Menü). Der Partner meldet sich ebenfalls mit seiner E-Mail-Adresse und Code an und landet direkt in der Familie. Überspringbar.
5. **Kindergerät verbinden:** QR-Code am Elterngerät, Kamera am Kindergerät, Kind wählt eine 4-stellige PIN. Fertig. Überspringbar, später unter „Familie“.

## Umsetzung (kleine PRs)
1. Migration 0004 + Rollback + RLS-Tests (Kopplung, Sichtbarkeit, Familienmitglieder).
2. Supabase-Adapter für `packages/auth` (serverseitige Session-Prüfung, fail-closed) + E-Mail-Code-Login (OTP) + Abmelden.
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
