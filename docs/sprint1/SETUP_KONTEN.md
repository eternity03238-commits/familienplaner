# Konten anlegen — Schritt für Schritt (ca. 20 Minuten)

Diese Schritte machst **du**, weil es deine Konten sind. **Kein neues Passwort nötig:** Bei Supabase und Vercel meldest du dich mit deinem GitHub-Konto an („Continue with GitHub“). Google Cloud ist dieselbe Konsole wie bei Firebase, mit deinem bestehenden Google-Konto. Passwörter und Schlüssel **nie** in den Chat oder nach GitHub. Sie kommen später direkt in die Vercel-Einstellungen; ich zeige dir dann, wohin.

## 1. Supabase (Datenbank, Frankfurt)
1. supabase.com → „Continue with GitHub“ → „New project“.
2. Name `familyos`, Region **Central EU (Frankfurt)**, Plan Free.
3. Das Datenbank-Passwort nur in deinem Passwort-Manager speichern.
4. Mir genügt die **Projekt-URL** (`https://xxxx.supabase.co`). Sie ist nicht geheim.

## 2. Google-Login (Google Cloud)
1. console.cloud.google.com (dasselbe Google-Konto wie bei Firebase) → neues Projekt `FamilyOS`.
2. „APIs & Dienste → OAuth-Zustimmungsbildschirm“: Typ **Extern**, App-Name „FamilyOS“, deine E-Mail. Status „Testing“ lassen und euch beide als **Testnutzer** eintragen.
3. „Anmeldedaten → OAuth-Client-ID → Webanwendung“. Als autorisierte Weiterleitungs-URI die Callback-Adresse aus Supabase eintragen (Supabase → Authentication → Providers → Google zeigt sie an).
4. Client-ID und Client-Secret direkt in Supabase bei „Google“ eintragen und den Provider aktivieren.

## 3. Vercel (App-Hosting)
1. vercel.com → „Continue with GitHub“ → Repository `familienplaner` importieren.
2. Root Directory `apps/web`. Noch **nicht** deployen. Die Umgebungsvariablen trage ich mit dir gemeinsam ein.

## Danach
Gib mir Bescheid, sobald die drei Schritte erledigt sind (nur die Supabase-URL schicken). Ich verbinde dann die Vorschau, wir testen mit Testkonten, und erst nach deiner Freigabe tragt ihr eure echte Familie ein.

## Warum nicht Firebase?
Die Rechte (Familie ↔ Familie, Kind ↔ Kind) setzt die Postgres-Datenbank selbst durch (RLS) und auf GitHub prüfen sie 39 Tests. Firestore nutzt ein anderes Rechtemodell. Ein Wechsel hieße, genau diesen sicherheitskritischen Teil neu zu bauen. Supabase bietet dasselbe „Anmelden mit einem bestehenden Konto“ wie Firebase.
