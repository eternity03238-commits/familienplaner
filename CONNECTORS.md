# CONNECTORS.md — Integrationen und Prüfpunkte

## Google Calendar (erster Provider, Sprint 2)
- Offizieller Google OAuth und Calendar API.
- Start mit minimalen Scopes (zunächst read-only; Schreibzugriff später getrennt).
- Initial-Sync, Delta-/syncToken-Verarbeitung, Push-Webhook-Signale, Cursor-Persistenz, Mapping, Konflikt-/Resync-Strategie.
- **Umgesetzt (ADR-0008, 23.11.2026):** OAuth mit PKCE, nur lesend, Token im Supabase Vault, Abgleich −1/+60 Tage über `/api/google/*`. Noch offen: Push-Webhooks, syncToken-Deltas, Kalenderauswahl in der App, Teilen mit der Familie.

## LernSax (Name aus Nutzereingabe „lernlax“ noch zu bestätigen)
Abonnierbare Feeds / WebDAV / IMAP sind je nach Einrichtung möglich; konkrete Schul- und Kontofunktionen separat prüfen. Kein ungeprüftes Auslesen von Loginseiten.

## beste.schule
API-Dokumentation existiert; konkrete OAuth-Rechte, personenbezogene Endpunkte und Zugriffszusagen vor Implementation überprüfen.

## VP Plan / DLS
Ohne URL, Schulinstanz, technische Produktkennung und offiziell erlaubte Zugriffsoptionen kein Connector-Code. Für die Zwischenzeit: manueller Import von erlaubten Kalenderdateien, Fotos oder CSV.

## Vertragsprinzip
`Connector` ist providerneutral mit `listChanges(cursor)`, `health()`; spätere `write`-Fähigkeiten ausdrücklich optional. Ergebnisse enthalten stabilen Provider-Identifier, Provenienz, Zeitstempel und Fehlerstatus. Secrets werden serverseitig verwaltet.

## Testanforderungen
Authentifizierung verloren; Webhook doppelt; Cursor invalid; Termine verschoben; Schule wechselt; Berechtigungen widerrufen; Quelle löscht Aufgabe; privat vs. gemeinsam. Immer fehleroffen berichten, nie „synchronisiert“ behaupten, wenn keine Bestätigung existiert.
