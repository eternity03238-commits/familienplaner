import test, { after } from "node:test";
import assert from "node:assert/strict";
import { asBackend, closePool } from "./helpers.ts";

after(closePool);

/** Schema-level invariants: a future migration that forgets RLS, search_path or grants fails here. */

const SELECTABLE_BY_AUTHENTICATED = ["ai_proposals", "calendar_events", "child_devices", "exams", "persons", "project_steps", "projects", "study_sessions", "tasks", "users"];

test("every public table has RLS enabled AND forced", async () => {
  await asBackend(async q => {
    const bad = await q.rows<{ relname: string }>(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p') and not (c.relrowsecurity and c.relforcerowsecurity)`);
    assert.deepEqual(bad, []);
    const count = await q.rows<{ n: string }>(`select count(*)::text n from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relkind='r'`);
    assert.equal(count[0].n, "28", "table inventory changed: extend 0002/0004/0005/this test deliberately");
  });
});

test("no extension objects (e.g. pgcrypto) are installed into the exposed public schema", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ extname: string; schema: string }>(`select e.extname, n.nspname schema from pg_extension e join pg_namespace n on n.oid = e.extnamespace where n.nspname = 'public'`);
    assert.deepEqual(rows, []);
  });
});

test("anon has no privilege at all on public tables; authenticated only SELECT on the minimal set", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ t: string; anon: string[]; auth: string[] }>(`
      select c.relname t,
        (select coalesce(array_agg(p order by p), '{}') from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('anon', c.oid, p)) anon,
        (select coalesce(array_agg(p order by p), '{}') from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('authenticated', c.oid, p)) auth
      from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relkind='r' order by 1`);
    for (const r of rows) {
      assert.deepEqual(r.anon, [], `anon privileges on ${r.t}`);
      assert.deepEqual(r.auth, SELECTABLE_BY_AUTHENTICATED.includes(r.t) ? ["SELECT"] : [], `authenticated privileges on ${r.t}`);
    }
  });
});

test("integration_connections: authenticated may read status columns only, never the vault reference (0005)", async () => {
  await asBackend(async q => {
    const cols = await q.rows<{ c: string }>(`select column_name c from information_schema.column_privileges
      where table_schema='public' and table_name='integration_connections' and grantee='authenticated' and privilege_type='SELECT' order by 1`);
    assert.ok(cols.length > 0 && !cols.some(r => r.c === "encrypted_token_reference"), JSON.stringify(cols));
  });
});

test("column-level privileges do not sneak in writes for API roles", async () => {
  await asBackend(async q => {
    const rows = await q.rows(`select table_name, column_name, grantee, privilege_type from information_schema.column_privileges
      where table_schema='public' and grantee in ('anon','authenticated') and privilege_type <> 'SELECT'`);
    assert.deepEqual(rows, []);
  });
});

test("all SECURITY DEFINER functions pin search_path (CLAUDE.md rule 14) and have no PUBLIC/anon execute", async () => {
  await asBackend(async q => {
    const fns = await q.rows<{ name: string; cfg: string[] | null }>(`select n.nspname || '.' || p.proname name, p.proconfig cfg
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.prosecdef and n.nspname in ('public','app_private')`);
    assert.ok(fns.length >= 6, `expected the FamilyOS definer functions, got ${fns.length}`);
    for (const fn of fns) assert.ok(fn.cfg?.some(c => /^search_path=("")?$|^search_path=''$/.test(c)), `${fn.name} must set search_path = ''`);
    const open = await q.rows<{ name: string }>(`select n.nspname || '.' || p.proname name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public','app_private') and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('public', p.oid, 'EXECUTE'))
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`);
    assert.deepEqual(open, []);
  });
});

test("only the three permission helpers are executable by authenticated; guard/trigger functions are internal", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ name: string }>(`select p.proname name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and has_function_privilege('authenticated', p.oid, 'EXECUTE') order by 1`);
    assert.deepEqual(rows.map(r => r.name), ["can_access_child", "current_person_id", "is_my_child"]);
  });
});

test("definer functions are owned by a role that bypasses RLS (otherwise FORCE RLS would silently deny every check)", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ name: string; owner: string; ok: boolean }>(`select p.proname name, r.rolname owner, (r.rolbypassrls or r.rolsuper) ok
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_roles r on r.oid = p.proowner
      where p.prosecdef and n.nspname = 'app_private'`);
    for (const r of rows) assert.ok(r.ok, `${r.name} is owned by ${r.owner}, which does not bypass RLS`);
  });
});

test("service_role is the only API role with write access (backend-only); anon/authenticated can not create objects", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ r: string; s: string; create_priv: boolean }>(`select r.rolname r, n.nspname s, has_schema_privilege(r.rolname, n.nspname, 'CREATE') create_priv
      from pg_roles r cross join pg_namespace n where r.rolname in ('anon','authenticated') and n.nspname in ('public','app_private')`);
    // Supabase historically grants CREATE on public to API roles on some versions; we require it to be absent.
    for (const r of rows) assert.equal(r.create_priv, false, `${r.r} must not have CREATE on schema ${r.s}`);
  });
});

test("public RPCs: end-user functions for authenticated only, srv_* for the server (service_role) only", async () => {
  await asBackend(async q => {
    const rows = await q.rows<{ name: string; auth: boolean; svc: boolean; anon: boolean }>(`select p.proname name,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') auth, has_function_privilege('service_role', p.oid, 'EXECUTE') svc,
        has_function_privilege('anon', p.oid, 'EXECUTE') anon
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1`);
    const user = rows.filter(r => !r.name.startsWith("srv_")), server = rows.filter(r => r.name.startsWith("srv_"));
    assert.deepEqual(user.map(r => r.name), ["accept_family_invite", "add_child", "create_child_pairing_code", "create_family",
      "create_family_invite", "my_family", "rename_family", "rename_person", "revoke_child_device"]);
    assert.deepEqual(server.map(r => r.name), ["srv_apply_google_events", "srv_consume_oauth_state", "srv_create_oauth_state",
      "srv_disconnect_google", "srv_google_connections", "srv_mark_sync_failed", "srv_parent_person", "srv_save_google_connection"]);
    for (const r of rows) assert.equal(r.anon, false, `${r.name}: anon must not execute`);
    for (const r of user) { assert.equal(r.auth, true, r.name); assert.equal(r.svc, false, `${r.name}: service_role has no business calling end-user RPCs`); }
    for (const r of server) { assert.equal(r.auth, false, `${r.name}: end users must never reach token functions`); assert.equal(r.svc, true, r.name); }
    const svc = await q.rows<{ name: string }>(`select p.proname name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private' and has_function_privilege('service_role', p.oid, 'EXECUTE') order by 1`);
    assert.deepEqual(svc.map(r => r.name), ["redeem_child_pairing"]);
  });
});
