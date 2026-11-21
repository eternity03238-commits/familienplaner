# Konten anlegen — Schritt für Schritt (ca. 10 Minuten)

Diese Schritte machst **du**, weil es deine Konten sind. **Kein neues Passwort nötig:** Bei Supabase und Vercel meldest du dich mit deinem GitHub-Konto an („Continue with GitHub“). Passwörter und Schlüssel **nie** in den Chat oder nach GitHub. Sie kommen später direkt in die Vercel-Einstellungen; ich zeige dir dann, wohin.

## 1. Supabase (Datenbank, Frankfurt)
1. supabase.com → „Continue with GitHub“ → „New project“.
2. Name `familyos`, Region **Central EU (Frankfurt)**, Plan Free.
3. Das Datenbank-Passwort nur in deinem Passwort-Manager speichern.
4. Mir genügt die **Projekt-URL** (`https://xxxx.supabase.co`). Sie ist nicht geheim.

## 2. E-Mail-Anmeldung in Supabase einstellen
1. Supabase → dein Projekt → **Authentication → Sign In / Providers → Email**: „Enable Email provider“ an, „Confirm email“ an.
2. **Authentication → Emails → Magic Link**: Die Vorlage soll den Code `{{ .Token }}` zeigen. Den Text passe ich später mit dir auf Deutsch an.
3. Supabase verschickt zunächst nur an Adressen aus deinem Supabase-Team und nur 2 Mails pro Stunde. Für deine Tests reicht das. Bevor dein Partner sich anmeldet, richten wir einen eigenen Mailversand (SMTP) ein. Dessen Zugangsdaten trägst du selbst direkt in Supabase ein.

## 3. Vercel (App-Hosting)
1. vercel.com → „Continue with GitHub“ → Repository `familienplaner` importieren.
2. Root Directory `apps/web`. Noch **nicht** deployen. Die Umgebungsvariablen trage ich mit dir gemeinsam ein.

## Danach
Gib mir Bescheid, sobald die Schritte erledigt sind (nur die Supabase-URL schicken). Ich verbinde dann die Vorschau, wir testen mit Testkonten, und erst nach deiner Freigabe tragt ihr eure echte Familie ein.

## Warum nicht Firebase?
Die Rechte (Familie ↔ Familie, Kind ↔ Kind) setzt die Postgres-Datenbank selbst durch (RLS) und auf GitHub prüfen sie 39 Tests. Firestore nutzt ein anderes Rechtemodell. Ein Wechsel hieße, genau diesen sicherheitskritischen Teil neu zu bauen. Supabase bietet dasselbe „Anmelden mit einem bestehenden Konto“ wie Firebase.
