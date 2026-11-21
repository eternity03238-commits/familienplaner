# ADR 0004: Connector-first, keine ungeprüften Scraper
Status: Accepted · 2026-11-21 (nachgetragen in Sprint 0; in ARCHITECTURE.md bereits referenziert)

**Kontext:** Schulplattformen (LernSax, VP Plan, beste.schule, DLS) bieten teils keine dokumentierten, für Eltern freigegebenen Schnittstellen. Zugangsdaten von Familien und Kindern sind besonders schützenswert (CLAUDE.md Leitplanke 6).

**Entscheidung:** Integrationen laufen ausschließlich über einen providerneutralen Connector-Vertrag (`listChanges(cursor)`, `health()`, Schreiben nur als getrennte, freigabepflichtige Fähigkeit). Pro Anbieter vor jeder Implementierung: offizielle API/Feed-Dokumentation, erlaubte Zugriffswege, Rechte und Datenschutzprüfung. Keine Credential-Scraper, keine Umgehung von Nutzungsbedingungen. Bis dahin: manueller Import (Kalenderdatei, CSV, Foto).

**Konsequenzen:** Langsamere Anbindung einzelner Schulen, dafür nachvollziehbare Provenienz (Quelle, Sync-Status, externe ID) und kein stilles „synchronisiert“ ohne Bestätigung. Siehe `CONNECTORS.md`.
