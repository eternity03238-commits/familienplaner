# ROADMAP.md — AI-DLC und Meilensteine

## Definition AI-DLC
Für dieses Projekt: **AI-driven Development Life Cycle** (projektinterner Begriff, kein behaupteter einheitlicher Industriestandard). `Discover → Design → Develop → Validate → Deploy → Improve`. Claude unterstützt Planung/Code/Tests; Freigaben, Qualitätsprüfungen und Rechte verbleiben kontrolliert.

## Sprint 0 — Grundlage
- Dokumentation, Domänenschichten, DB-Draft, SQL-RLS, Next.js-PWA-Skeleton und Kerntests.
- Nächste Arbeiten: Dependencies installieren; `npm run check` und `npm run build`; Supabase lokal; SQL/JWT-RLS-Integrationstests; Deployment/Datenschutzentscheidung.
- Gate: alle Checks und DB-Rechttests grün, keine echten Daten in Logs.

## Sprint 1 — Rollen & Familie
- Auth, sichere Sessions, zwei Eltern-Identitäten, zwei Kinderprofile, Familien- und Haushaltszuordnung.
- Gate: sicherer Cross-User-/Cross-Child-Isolationstest.

## Sprint 2 — Tasks und Google Kalender
- Aufgaben/Routinen, Checkliste, Familienwoche, Google OAuth + initialer/inkrementeller Sync, Conflict-Handling.
- Gate: kein Duplikat bei doppeltem Webhook, nach Tokenablauf transparente Recovery.

## Sprint 3 — Schulmanager
- Zwei getrennte Schulkontexte, Fächer, Klassenarbeiten, Hausaufgaben, Sport, Projektfristen, manuelle Eingabe.
- Gate: keine falschen Fächer-/Kind-Zuordnungen; Quellen sichtbar.

## Sprint 4 — KI-Lernplanung
- Validierte strukturierte KI-Vorschläge, Planungsengine, harte Zeitkonflikte, kindgerechte Lastgrenzen, Approval-Flow.
- Redaktioneller [Lernmethodenkatalog](docs/learning/LERNMETHODEN.md), kurze Lernkarten in Explore und optionale Wiederholungsvorschläge in Command.
- Gate: nachvollziehbare Methodenwahl nach Lernziel, freiwillige Teilnahme und Übernahme in den Kalender erst nach Freigabe.

## Sprint 5 — Connectoren / Automation
- Offiziell zugängliche Schul-APIs/Feeds (nach Prüfen), nachvollziehbare Jobs, Benachrichtigungen, Foto-/Dokumentimport.
- Gate: Consent, API-Ratenbegrenzungen und sichere Fehlerbehandlung.

## Sprint 6 — Familien-Pilot
- PWA-iPhone-Tests, Datenschutz, Backup/Restore, Observability, Accessibility, reales Nutzungspilot mit Zustimmung.

## Erweiterungswellen (nicht vor MVP)
A. Patchwork-Multihousehold-Freigaben, Revocation und Einladungen.
B. Weitere Kalender- und Login-Anbieter.
C. Weitere Familienmitglieder, skalierter Multi-Tenant-Betrieb und erweiterte Integrationen.

## Prioritäten
Sicherheit, Datenqualität, zuverlässige Synchronisierung > Automatisierungsgrad > KI-Komfortfunktionen. Keine künstlichen Termine oder falsche Fortschrittsbehauptungen.
