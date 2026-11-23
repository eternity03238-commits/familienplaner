/** Migration 0005 (Google Calendar read-only, ADR-0008) with real roles. Synthetic data only. */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, closePool } from "./helpers.ts";

after(closePool);

async function tx(fn: (q: (sql: string, p?: unknown[]) => Promise<Record<string, unknown>[]>, as: (who: "super" | "service" | { sub: string }) => Promise<void>, fails: (sql: string, p?: unknown[]) => Promise<string | undefined>) => Promise<void>) {
  const c = await pool.connect(); let n = 0;
  const q = async (sql: string, p: unknown[] = []) => (await c.query(sql, p)).rows;
  const as = async (who: "super" | "service" | { sub: string }) => {
    await c.query("reset role");
    if (who === "super") return;
    await c.query(`set local role ${who === "service" ? "service_role" : "authenticated"}`);
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(who === "service" ? { role: "service_role" } : { sub: who.sub, role: "authenticated" })]);
  };
  const fails = async (sql: string, p: unknown[] = []) => {
    const sp = `s${n++}`; await c.query(`savepoint ${sp}`);
    try { await c.query(sql, p); } catch (e) { await c.query(`rollback to savepoint ${sp}`); return (e as { code?: string }).code; }
    throw new Error(`expected failure: ${sql}`);
  };
  try { await c.query("begin"); await fn(q, as, fails); } finally { await c.query("rollback").catch(() => undefined); c.release(); }
}

async function parent(q: (sql: string, p?: unknown[]) => Promise<Record<string, unknown>[]>, as: (w: "super" | "service" | { sub: string }) => Promise<void>) {
  const sub = randomUUID();
  await as("super");
  await q("insert into auth.users(id, email) values ($1, $2)", [sub, `${sub.slice(0, 8)}@familyos.test`]);
  await as({ sub });
  await q("select public.create_family('Testfamilie', 'Elternteil')");
  await as("super");
  const [{ person_id }] = await q("select person_id from public.users where auth_user_id = $1", [sub]);
  return { sub, person: person_id as string };
}

const ev = (id: string, title: string, start: string, end: string) => ({ external_id: id, version: "v1", title, location: "", all_day: false, event_date: null, starts_at: start, ends_at: end });

test("oauth state: single use, 10 minutes, stored only as hash, return path validated", async () => {
  await tx(async (q, as, fails) => {
    const p = await parent(q, as);
    await as("service");
    await q("select public.srv_create_oauth_state($1, 'google_calendar', 'state-abc-123456789', 'verifier', '/command/verbindungen')", [p.person]);
    assert.equal(await fails("select public.srv_create_oauth_state($1, 'google_calendar', 's2-xxxxxxxxxxxxxxxx', 'v', 'https://evil.example')", [p.person]), "22023");
    const first = await q("select * from public.srv_consume_oauth_state('state-abc-123456789')");
    assert.equal(first[0].person_id, p.person);
    assert.equal((await q("select * from public.srv_consume_oauth_state('state-abc-123456789')")).length, 0, "single use");
    await q("select public.srv_create_oauth_state($1, 'google_calendar', 'old-state-xxxxxxxxx', 'v', '/command')", [p.person]);
    await as("super");
    await q("update public.oauth_states set expires_at = now() - interval '1 second'");
    const raw = await q("select state_hash from public.oauth_states");
    assert.ok(raw.every(r => !(r.state_hash as Buffer).toString("utf8").includes("old-state")), "hash only");
    await as("service");
    assert.equal((await q("select * from public.srv_consume_oauth_state('old-state-xxxxxxxxx')")).length, 0, "expired");
  });
});

test("connection: token in vault, owner sees status but never the token; sync is idempotent and removes vanished events", async () => {
  await tx(async (q, as) => {
    const p = await parent(q, as);
    await as("service");
    const [{ id }] = await q("select public.srv_save_google_connection($1, 'eltern@example.com', 'refresh-1') id", [p.person]);
    const again = await q("select public.srv_save_google_connection($1, 'eltern@example.com', 'refresh-2') id", [p.person]);
    assert.equal(again[0].id, id, "same account → same connection, token rotated");
    assert.deepEqual((await q("select refresh_token from public.srv_google_connections($1)", [p.person])).map(r => r.refresh_token), ["refresh-2"]);
    const from = "2026-11-22T00:00:00Z", to = "2026-12-22T00:00:00Z";
    const events = [ev("cal:a", "Zahnarzt", "2026-11-24T10:00:00Z", "2026-11-24T11:00:00Z"), ev("cal:b", "Elternabend", "2026-11-25T18:00:00Z", "2026-11-25T19:00:00Z"),
      { external_id: "cal:c", version: "v1", title: "Ferien", location: "", all_day: true, event_date: "2026-12-01", starts_at: null, ends_at: null }];
    assert.equal((await q("select public.srv_apply_google_events($1, $2, $3, $4::jsonb) n", [id, from, to, JSON.stringify(events)]))[0].n, 3);
    await q("select public.srv_apply_google_events($1, $2, $3, $4::jsonb)", [id, from, to, JSON.stringify(events)]);
    await as({ sub: p.sub });
    assert.equal((await q("select 1 from public.calendar_events")).length, 3, "idempotent: no duplicates");
    const con = await q("select status, last_synced_at, external_account_ref from public.integration_connections");
    assert.equal(con[0].status, "connected"); assert.ok(con[0].last_synced_at);
    await as("service");
    await q("select public.srv_apply_google_events($1, $2, $3, $4::jsonb)", [id, from, to, JSON.stringify([{ ...events[0], title: "Zahnarzt (verschoben)" }])]);
    await as({ sub: p.sub });
    assert.deepEqual((await q("select title from public.calendar_events")).map(r => r.title), ["Zahnarzt (verschoben)"], "updated and vanished events removed");
  });
});

test("token functions are unreachable for end users; other families see nothing", async () => {
  await tx(async (q, as, fails) => {
    const p = await parent(q, as), other = await parent(q, as);
    await as("service");
    const [{ id }] = await q("select public.srv_save_google_connection($1, 'eltern@example.com', 'refresh-secret') id", [p.person]);
    await q("select public.srv_apply_google_events($1, now() - interval '1 day', now() + interval '30 days', $2::jsonb)", [id, JSON.stringify([ev("x:1", "Privat", new Date(Date.now() + 3600e3).toISOString(), new Date(Date.now() + 7200e3).toISOString())])]);
    await as({ sub: p.sub });
    for (const sql of ["select * from public.srv_google_connections($1)", "select public.srv_parent_person($1)"])
      assert.equal(await fails(sql, [p.person]), "42501", sql);
    assert.equal(await fails("select encrypted_token_reference from public.integration_connections"), "42501", "vault id column not selectable");
    assert.equal(await fails("select * from vault.decrypted_secrets"), "42501");
    await as({ sub: other.sub });
    assert.equal((await q("select 1 from public.integration_connections")).length, 0);
    assert.equal((await q("select 1 from public.calendar_events")).length, 0, "other family sees no imported events");
    await as("service");
    assert.equal(await fails("select public.srv_disconnect_google($1, $2)", [other.person, id]), "42501", "only the owner disconnects");
  });
});

test("disconnect deletes token, imported events and mappings; reconnect starts clean", async () => {
  await tx(async (q, as) => {
    const p = await parent(q, as);
    await as("service");
    const [{ id }] = await q("select public.srv_save_google_connection($1, 'eltern@example.com', 'refresh-x') id", [p.person]);
    await q("select public.srv_apply_google_events($1, now() - interval '1 day', now() + interval '30 days', $2::jsonb)", [id, JSON.stringify([ev("x:1", "A", new Date(Date.now() + 3600e3).toISOString(), new Date(Date.now() + 7200e3).toISOString())])]);
    const [{ t }] = await q("select public.srv_disconnect_google($1, $2) t", [p.person, id]);
    assert.equal(t, "refresh-x", "token returned once for revocation at Google");
    assert.equal((await q("select 1 from public.srv_google_connections($1)", [p.person])).length, 0);
    await as("super");
    assert.equal((await q("select 1 from vault.secrets")).length, 0);
    assert.equal((await q("select 1 from public.external_resource_mappings")).length, 0);
    assert.equal((await q("select 1 from public.calendar_events where source = 'google_calendar'")).length, 0);
    const audit = (await q("select action from public.audit_events where action like 'integration.%' order by occurred_at")).map(r => r.action);
    assert.deepEqual(audit, ["integration.connected", "integration.disconnected"]);
    assert.ok(!JSON.stringify(await q("select * from public.audit_events")).includes("refresh-x"), "no token in audit");
    await as("service");
    const [{ id: id2 }] = await q("select public.srv_save_google_connection($1, 'eltern@example.com', 'refresh-y') id", [p.person]);
    assert.notEqual(id2, id);
  });
});
