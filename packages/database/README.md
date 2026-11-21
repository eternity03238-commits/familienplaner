# Datenbank-Migrationen

Die SQL-Dateien sind eine **Sprint-0-Entwurfsbasis** (0001 Schema, 0002 RLS, 0003 Integritätsschranken; Rollbacks unter `rollback/`, Test-Shim für Plain-Postgres unter `test-support/`, nie auf Supabase anwenden). Vor Einsatz mit persönlichen Informationen:

1. In lokaler Supabase-DB anwenden (`supabase db reset`; `supabase/migrations` verweist auf dieses Verzeichnis). *Auf Plain-Postgres + Shim bereits geprüft, echter Stack offen.*
2. RLS mit echten JWT-Sessions testen (`npm run test:db`), insbesondere Schutz von Personen und Child-Scopes.
3. Transaction/RPC für Task-Completion und Eltern-Onboarding bauen.
4. CRUD-Policies und API-Autorisierung separat implementieren.
5. Regeln zum Verifizieren von Erziehungsberechtigungen und Freigabe-Audit spezifizieren.

Die Tabellen sind standardmäßig RLS-geschützt. Direkte Schreibzugriffe wurden absichtlich noch nicht eingerichtet. Service-Role-Zugriffe sind ausschließlich trusted backend code vorbehalten.
