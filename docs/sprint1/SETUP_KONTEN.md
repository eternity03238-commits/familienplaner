# Konten anlegen — Schritt für Schritt (ca. 10 Minuten)

Diese Schritte machst **du**, weil es deine Konten sind. **Kein neues Passwort nötig:** Bei Supabase und Vercel meldest du dich mit deinem GitHub-Konto an („Continue with GitHub“). Passwörter und Schlüssel **nie** in den Chat oder nach GitHub. Sie kommen später direkt in die Vercel-Einstellungen; ich zeige dir dann, wohin.

## 1. Supabase (Datenbank, Frankfurt)
1. supabase.com → „Continue with GitHub“ → „New project“.
2. Name `familyos`, Region **Central EU (Frankfurt)**, Plan Free.
3. Das Datenbank-Passwort nur in deinem Passwort-Manager speichern.
4. Mir genügt die **Projekt-URL** (`https://xxxx.supabase.co`). Sie ist nicht geheim.

## 2. (überholt, siehe Abschnitt 5) E-Mail-Anmeldung
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

## 4. Datenbank über GitHub einrichten (ca. 5 Minuten)
Die Datenbankänderungen spielt ein GitHub-Workflow ein (`.github/workflows/db-deploy.yml`). Das Passwort geht dabei nie durch den Chat.
1. Supabase → dein Projekt → oben **„Connect“** → **Session pooler** → die URI kopieren. Sie sieht so aus: `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-…pooler.supabase.com:5432/postgres`. `[YOUR-PASSWORD]` durch dein Datenbank-Passwort ersetzen.
2. GitHub → Repository → **Settings → Secrets and variables → Actions → New repository secret**. Name `SUPABASE_DB_URL`, als Wert die URI.
3. Gib mir Bescheid. Ich starte dann zuerst eine **Vorschau** (nur Anzeige, keine Änderung), zeige dir das Ergebnis und spiele erst danach ein.
4. Optional, aber empfohlen: GitHub → Settings → Environments → `supabase-production` → **Required reviewers** = du. Dann wartet jeder Lauf auf deinen Klick „Approve“.

## 5. Anmeldung in Supabase einstellen (1 Minute, keine Mails nötig)
1. Authentication → **Sign In / Providers** → **Email**:
   - „Enable Email provider“: **an**
   - „Confirm email“: **aus**
   - „Minimum password length“: **8**
   - **Save**
2. SMTP und Mailvorlagen werden **nicht** gebraucht.
3. Authentication → URL Configuration → Site URL: die Vercel-Adresse, sobald es sie gibt.
