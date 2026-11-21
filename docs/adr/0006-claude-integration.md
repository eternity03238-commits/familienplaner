# ADR 0006: Claude als Planungs- und Lernassistent über die FamilyOS-API
Status: Accepted (Richtung) · 2026-11-21 · Umsetzung ab Sprint 4 gemäß ROADMAP.md

## Kontext
Die Produktverantwortliche möchte FamilyOS mit Claude verbinden:
- In Claude planen, Empfehlungen und Ideen für Projekte und Aufgaben erzeugen und das Ergebnis in die App bringen.
- Fragen der Kinder in der App von Claude beantworten lassen und die Antwort im Frontend anzeigen.

Bestehende Leitplanken (CLAUDE.md 3–5, 9, 10; ADR-0003):
- Rechte serverseitig und per RLS.
- Nur minimal nötige Daten an KI-Anbieter.
- Keine direkten KI-Schreibzugriffe oder SQL.
- KI erzeugt nur Vorschläge, Seiteneffekte erst nach Freigabe.

## Entscheidung
**Claude befüllt das Frontend nicht direkt.** FamilyOS (Datenbank mit RLS und Server-API) bleibt die einzige Quelle der Wahrheit. Das Frontend zeigt nur gespeicherte, berechtigte und, wo nötig, freigegebene Daten. Claude arbeitet ausschließlich über begrenzte, validierte Domain-Aktionen.

### 1. Planen in Claude: FamilyOS-Connector (MCP-Server, nur Erwachsene)
- **Remote-MCP-Server** als Teil der FamilyOS-Server-API.
- **Anmeldung:** OAuth (Authorization Code + PKCE) mit dem FamilyOS-Konto der erwachsenen Person. Claude handelt immer im Namen dieser Person und sieht nur, was RLS ihr erlaubt.
- **Werkzeuge (Zod-validiert, mit Mengen- und Zeitgrenzen):**
  - Lesend: `list_children` (Pseudonyme und Klassenstufe), `get_week(child, from, to)`, `list_open_tasks(child)`, `list_exams(child)`.
  - Vorschlagend: `propose_study_plan(child, exam|project, …)`, `propose_project_steps(project, steps[])`, `propose_task(child, …)`.
- **Ergebnis:** Jeder vorschlagende Aufruf erzeugt ausschließlich einen Eintrag in `ai_proposals` mit Status `pending`. Sichtbar wird er in Command unter „Freigaben“ mit „Warum dieser Vorschlag?“, Regeln und übermittelten Angaben.
- **Prüfung vor dem Speichern:** Die Planungsengine (`packages/planning`) prüft harte Termine, Lastgrenzen und Puffer. Ungültiges wird abgelehnt, nicht „korrigiert“.
- **Freigabe:** Nur eine verifizierte erziehungsberechtigte Person des Kindes gibt frei. Das sichern Trigger aus Migration 0003 ab.
- **Folgeaktionen nur nach Freigabe:** Lernblöcke (`study_sessions`) und optionale Kalenderprojektion entstehen erst dann und idempotent.
- **Nicht erlaubt:** Werkzeuge zum Löschen, zum direkten Ändern bestätigter Termine, für Rechte oder Freigaben (`access_grants`) oder für freie Abfragen.

### 2. Kinderfragen: Lernhilfe über den FamilyOS-Server
- **Ablauf:** Die App schickt die Frage an `POST /api/learn/ask`, nie direkt an Anthropic. Der Server prüft Sitzung, Kind und Freischaltung und baut einen minimalen Prompt: Klassenstufe, Fach, Frage. Kein Name, keine Schule, keine Termine. Claude antwortet, der Server prüft die Antwort und liefert sie aus.
- **Rolle:** Lernhilfe, die erklärt und Rückfragen stellt, kein Hausaufgaben-Löser. Feste Themengrenzen. Bei Themen außerhalb gibt es einen freundlichen Hinweis und das Angebot, Eltern einzubeziehen.
- **Pflichten nach Anthropic-Leitlinien für Organisationen mit minderjährigen Nutzenden** (vor Umsetzung in aktueller Fassung prüfen):
  - Zugang nur für in FamilyOS angelegte Kinderprofile (Altersbestätigung durch Eltern).
  - Inhaltsmoderation und Filter für Ein- und Ausgabe.
  - Den von Anthropic bereitgestellten Kinderschutz-System-Prompt einsetzen, soweit verfügbar.
  - Sichtbarer Hinweis, dass eine KI antwortet.
  - Einhaltung örtlicher Vorgaben zum Schutz Minderjähriger.
- **Elternkontrolle:** Funktion pro Kind ein- und ausschaltbar (Standard: aus). Tages- und Mengenlimits. Eltern sehen Themen und Verlauf, mit kurzer, festgelegter Aufbewahrung.
- **Datenschutz:**
  - Einwilligung der Eltern (DSGVO Art. 8 i. V. m. Art. 6, Deutschland: unter 16 Jahren).
  - Auftragsverarbeitung bzw. kommerzielle Bedingungen mit dem KI-Anbieter, Bewertung der Drittlandübermittlung.
  - Keine Nutzung der Inhalte für Training (Vertragslage prüfen), Löschfristen.
  - Vor einer Öffnung für andere Familien: rechtliche Prüfung.

### 3. Gemeinsame technische Regeln
- **Server-only:** API-Schlüssel und Modellname (`ANTHROPIC_MODEL`) nur serverseitig, nie im Browser-Bundle (geprüft durch `security:bundle`).
- **Strukturierte Ausgaben:** Tool-Aufrufe und Modellantworten werden mit Zod validiert. Freitext von Schulquellen ist *untrusted content* und wird nie zur Anweisung (Schutz vor Prompt-Injection).
- **Feldweise Minimierung:** Die KI-Eingaben werden Feld für Feld gebaut und Personen pseudonymisiert („Kind A“).
- **Robustheit:** Rate-Limits pro Person und Kind, Kostenobergrenze, Timeouts. Bei Ausfall des KI-Dienstes bleibt die App vollständig nutzbar und meldet den Status ehrlich.
- **Audit:** `audit_events` für Vorschläge, Freigaben und Ablehnungen, ohne Prompt-Inhalte.

## Alternativen
- **Claude pusht Inhalte direkt ins Frontend:** verworfen. Die App wäre bei KI-Ausfall leer. Rechte würden vom Modell statt von der Datenbank abhängen. Es gäbe keine Historie, Freigabe oder Provenienz, und das Risiko von Mandantenlecks durch Fehler oder Prompt-Injection wäre hoch.
- **Kinder chatten direkt in einer Claude-App:** verworfen. Die Consumer-Bedingungen schließen unter 18-Jährige aus, und es gäbe keine Elternkontrolle.

## Konsequenzen
- Mehr Servercode (MCP-Server, OAuth, Moderation), dafür bleiben Rechte, Freigaben und Datenminimierung durchsetzbar und testbar.
- Die Planung „in Claude“ und die Freigabe in der App bilden einen klaren Kreislauf: Vorschlag, Prüfung, Freigabe, Termin.
- **Voraussetzungen:** Sprint 1 (Anmeldung, Profile), Sprint 2–3 (Aufgaben, Kalender, Schule). Ohne echte Daten hat die KI nichts Verlässliches zu planen.
- **Offene Prüfpunkte vor Umsetzung:**
  - Ob Remote-MCP-Connectors im genutzten Claude-Plan verfügbar sind.
  - Aktuelle Fassung der Anthropic-Leitlinien für Angebote an Minderjährige und der kommerziellen Bedingungen.
  - Hosting in der EU.
