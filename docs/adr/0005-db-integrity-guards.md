# ADR 0005: Integritätsschranken in der Datenbank (Defense in Depth)
Status: Accepted · 2026-11-21 (Sprint 0, Migration `0003_integrity_guards.sql`)

**Kontext:** RLS schützt nur Sitzungen der API-Rollen. Trusted Backend-Code (`service_role`) umgeht RLS. ADR-0003 verlangt, dass KI-Vorschläge nie ohne Freigabe zu autorisierten Änderungen werden; CLAUDE.md Leitplanke 11 verbietet, dass Kinder Fristen unbemerkt ändern; `access_grants` (Patchwork) dürfen nicht selbst ausgestellt werden.

**Entscheidung:** Trigger und CHECK-Constraints, die für *jede* Rolle gelten:
1. `ai_proposals`: nur `pending` anlegbar; genau eine Entscheidung (`approved`/`rejected`) durch einen *verifizierten Erziehungsberechtigten dieses Kindes*; Payload und Zuordnung unveränderlich; bei Endnutzer-Sitzung nur im eigenen Namen.
2. `tasks`: Kind-Sitzungen dürfen nur `status` (open/done) ändern, nie Frist, Titel, Zuordnung oder `cancelled`.
3. `access_grants`: nur durch verifizierte Erziehungsberechtigte des Kindes ausstellbar, danach unveränderlich außer Widerruf; Widerruf endgültig.
Vertrauenswürdiger Backend-Code ohne Endnutzer-JWT (`auth.uid()` ist NULL) bleibt von (2) ausgenommen, unterliegt aber (1) und (3).

**Konsequenzen:** Zusätzliche Trigger-Logik (Rollback-Skript `packages/database/rollback/`), dafür greifen die Regeln auch bei Fehlern in späteren RPC-/API-Schichten. Die Anwendungsschicht muss diese Regeln zusätzlich prüfen (bessere Fehlermeldungen); die DB ist die letzte Instanz.
