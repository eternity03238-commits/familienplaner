/**
 * Verifies the reversible-migration strategy on a scratch DB: apply all migrations, run rollbacks in
 * reverse order, check the rolled-back objects are gone and baseline RLS is intact, then re-apply.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { MIGRATIONS_DIR, ROOT, SHIM_FILE, applySqlFile, assertLocalDisposable, makeClient, migrationFiles } from "./lib-db.ts";

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) { console.error("DATABASE_ADMIN_URL is required"); process.exit(2); }
const admin = assertLocalDisposable(adminUrl);
const name = "familyos_rollback_test";
const a = makeClient(adminUrl);
await a.connect();
await a.query(`drop database if exists ${name} with (force)`);
await a.query(`create database ${name}`);
await a.end();
const target = new URL(admin.toString());
target.pathname = `/${name}`;
const c = makeClient(target.toString());
await c.connect();
await c.query("set client_min_messages = warning");
const count = async (sql: string) => Number((await c.query(sql)).rows[0].n);
try {
  await applySqlFile(c, SHIM_FILE);
  for (const f of migrationFiles()) await applySqlFile(c, join(MIGRATIONS_DIR, f));
  const guards = "select count(*) n from pg_trigger where tgname in ('ai_proposals_guard','tasks_actor_guard','access_grants_guard') and not tgisinternal";
  assert.equal(await count(guards), 3);
  const rollbacks = readdirSync(join(ROOT, "packages/database/rollback")).filter(f => f.endsWith(".down.sql")).sort().reverse();
  for (const r of rollbacks) await applySqlFile(c, join(ROOT, "packages/database/rollback", r));
  assert.equal(await count(guards), 0, "guard triggers must be gone after rollback");
  assert.equal(await count("select count(*) n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app_private' and p.proname in ('is_verified_guardian','ai_proposals_guard','tasks_actor_guard','access_grants_guard')"), 0);
  assert.equal(await count("select count(*) n from pg_constraint where conname='ai_proposals_status_consistency'"), 0);
  assert.equal(await count("select count(*) n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity"), 24, "RLS baseline from 0002 must survive rollback of 0003");
  for (const f of migrationFiles().slice(2)) await applySqlFile(c, join(MIGRATIONS_DIR, f));
  assert.equal(await count(guards), 3, "guards must be re-creatable after rollback");
  console.log("rollback check ok: 0003 applies, rolls back cleanly and re-applies; 0001/0002 RLS baseline intact");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await c.end();
  const a2 = makeClient(adminUrl);
  await a2.connect();
  await a2.query(`drop database if exists ${name} with (force)`);
  await a2.end();
}
