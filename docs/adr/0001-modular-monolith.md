# ADR 0001: Modularer Monolith
Status: Accepted · 2026-11-21

**Kontext:** Initial vier Personen, mehrere Schulsysteme und KI-Automationen; spätere multi-family Skalierung.

**Entscheidung:** TypeScript-Monorepo, Next.js plus klare Pakete für Domain, Planning, Auth, Connectors, AI und Persistence. Datenbank PostgreSQL.

**Konsequenzen:** Schnellere lokale Entwicklung und einfachere konsistente Berechtigungsprüfung. Später können bestimmte Jobs/Connectoren in getrennte Worker ausgelagert werden. Keine voreiligen Microservices.
