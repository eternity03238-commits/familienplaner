/**
 * Creates a fresh, disposable PostgreSQL database with the Supabase compat shim and all migrations.
 * Usage: DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
 *        DATABASE_TEST_NAME=familyos_test node --experimental-strip-types scripts/db-prepare.ts
 * Prints the resulting DATABASE_URL on stdout's last line.
 */
import { join } from "node:path";
import { MIGRATIONS_DIR, SHIM_FILE, applySqlFile, assertLocalDisposable, makeClient, migrationFiles } from "./lib-db.ts";

const adminUrl = process.env.DATABASE_ADMIN_URL;
const name = process.env.DATABASE_TEST_NAME ?? "familyos_test";
if (!adminUrl) { console.error("DATABASE_ADMIN_URL is required (local superuser connection)."); process.exit(2); }
if (!/^[a-z0-9_]+_test$/.test(name)) { console.error("DATABASE_TEST_NAME must match [a-z0-9_]+_test"); process.exit(2); }
const admin = assertLocalDisposable(adminUrl);

const adminClient = makeClient(adminUrl);
await adminClient.connect();
await adminClient.query(`drop database if exists ${name} with (force)`);
await adminClient.query(`create database ${name}`);
await adminClient.end();

const target = new URL(admin.toString());
target.pathname = `/${name}`;
const client = makeClient(target.toString());
await client.connect();
await client.query("set client_min_messages = warning");
await applySqlFile(client, SHIM_FILE);
for (const f of migrationFiles()) {
  await applySqlFile(client, join(MIGRATIONS_DIR, f));
  console.error(`applied ${f}`);
}
await client.end();
console.log(target.toString());
