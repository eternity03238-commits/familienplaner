/**
 * Sprint 1 onboarding (migration 0004, ADR-0007) with real DB roles and JWT claims.
 * Synthetic accounts only (@familyos.test). Each test runs in one transaction that is rolled back.
 */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, closePool } from "./helpers.ts";
import * as f from "./fixtures.ts";

after(closePool);

type Who = { sub: string } | "service" | "super";
interface S {
  as(who: Who): Promise<void>;
  one<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T>;
  rows<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  fails(sql: string, params?: unknown[]): Promise<string | undefined>;
  account(): Promise<{ sub: string }>;
}

/** One rolled-back transaction in which the test can switch identities like separate API requests. */
async function scenario(fn: (s: S) => Promise<void>) {
  const c = await pool.connect();
  let n = 0;
  const s: S = {
    async as(who) {
      await c.query("reset role");
      if (who === "super") { await c.query("select set_config('request.jwt.claims', '{}', true)"); return; }
      const claims = who === "service" ? { role: "service_role" } : { sub: who.sub, role: "authenticated" };
      await c.query(`set local role ${who === "service" ? "service_role" : "authenticated"}`);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    },
    async rows(sql, params = []) { return (await c.query(sql, params)).rows; },
    async one(sql, params = []) { return (await c.query(sql, params)).rows[0]; },
    async fails(sql, params = []) {
      const sp = `sp_${n++}`;
      await c.query(`savepoint ${sp}`);
      try { await c.query(sql, params); } catch (e) {
        await c.query(`rollback to savepoint ${sp}`);
        return (e as { code?: string }).code;
      }
      throw new Error(`expected failure: ${sql}`);
    },
    async account() {
      const sub = randomUUID();
      await c.query("reset role");
      await c.query("insert into auth.users(id, email) values ($1, $2)", [sub, `${sub.slice(0, 8)}@familyos.test`]);
      return { sub };
    }
  };
  try { await c.query("begin"); await fn(s); } finally { await c.query("rollback").catch(() => undefined); c.release(); }
}

/** Parent 1 creates the family, two children, invites parent 2 who accepts. */
async function family(s: S) {
  const p1 = await s.account(), p2 = await s.account();
  await s.as(p1);
  const { fam } = await s.one<{ fam: string }>("select public.create_family('Testfamilie', 'Erwachsene Eins') fam");
  const { a } = await s.one<{ a: string }>("select public.add_child($1, 'Kind Alpha') a", [fam]);
  const { b } = await s.one<{ b: string }>("select public.add_child($1, 'Kind Beta') b", [fam]);
  const { token } = await s.one<{ token: string }>("select public.create_family_invite($1) token", [fam]);
  await s.as(p2);
  assert.equal((await s.one<{ x: string }>("select public.accept_family_invite($1, 'Erwachsene Zwei') x", [token])).x, fam);
  return { p1, p2, fam, a, b, token };
}

/** Parent creates a code, trusted server creates the device account and redeems it. */
async function pairDevice(s: S, parent: { sub: string }, child: string) {
  await s.as(parent);
  const { code } = await s.one<{ code: string }>("select public.create_child_pairing_code($1) code", [child]);
  const device = await s.account();
  await s.as("service");
  await s.one("select app_private.redeem_child_pairing($1, $2, 'iPad') x", [code, device.sub]);
  return { device, code };
}

test("onboarding: create family, children, invite partner; my_family shows names and roles to members", async () => {
  await scenario(async s => {
    const { p1, p2, fam } = await family(s);
    for (const who of [p1, p2]) {
      await s.as(who);
      const members = await s.rows<{ family_id: string; display_name: string; role: string }>("select * from public.my_family()");
      assert.deepEqual(members.map(m => `${m.role}:${m.display_name}`).sort(),
        ["adult:Erwachsene Eins", "adult:Erwachsene Zwei", "child:Kind Alpha", "child:Kind Beta"]);
      assert.ok(members.every(m => m.family_id === fam));
    }
  });
});

test("both parents become verified guardians of both children and see their data via RLS", async () => {
  await scenario(async s => {
    const { p1, p2, a, b } = await family(s);
    await s.as("super");
    await s.rows("insert into public.tasks(child_person_id, title) values ($1,'Aufgabe A'), ($2,'Aufgabe B')", [a, b]);
    await s.rows("insert into public.calendar_events(owner_person_id, title, all_day, event_date) values ($1,'Privat A',true,'2026-12-01')", [a]);
    for (const who of [p1, p2]) {
      await s.as(who);
      assert.equal((await s.rows("select 1 from public.tasks")).length, 2);
      assert.equal((await s.rows("select 1 from public.calendar_events")).length, 1, "guardian sees child's private event");
    }
  });
});

test("another family sees nothing and cannot act on this family", async () => {
  await scenario(async s => {
    const { fam, a } = await family(s);
    const stranger = await s.account();
    await s.as(stranger);
    await s.one("select public.create_family('Andere', 'Fremd') x");
    assert.ok((await s.rows<{ family_id: string }>("select * from public.my_family()")).every(m => m.family_id !== fam));
    assert.equal(await s.fails("select public.add_child($1, 'Eindringling')", [fam]), "42501");
    assert.equal(await s.fails("select public.create_family_invite($1)", [fam]), "42501");
    assert.equal(await s.fails("select public.create_child_pairing_code($1)", [a]), "42501");
    assert.equal(await s.fails("select public.rename_person($1, 'X')", [a]), "42501");
    assert.equal(await s.fails("select public.rename_family($1, 'X')", [fam]), "42501");
    assert.equal((await s.rows("select 1 from public.persons where id = $1", [a])).length, 0);
  });
});

test("invite: single use, expires, unknown tokens give the same error, accounts cannot join twice", async () => {
  await scenario(async s => {
    const { p1, fam, token } = await family(s);
    const late = await s.account();
    await s.as(late);
    assert.equal(await s.fails("select public.accept_family_invite($1, 'Zu spät')", [token]), "22023", "used invite");
    assert.equal(await s.fails("select public.accept_family_invite('nope', 'X')"), "22023", "unknown invite, same code");
    await s.as(p1);
    const { t2 } = await s.one<{ t2: string }>("select public.create_family_invite($1) t2", [fam]);
    assert.equal(await s.fails("select public.accept_family_invite($1, 'Doppelt')", [t2]), "23505", "already in a family");
    await s.as("super");
    await s.rows("update public.family_invites set expires_at = now() - interval '1 second' where used_at is null");
    await s.as(late);
    assert.equal(await s.fails("select public.accept_family_invite($1, 'Abgelaufen')", [t2]), "22023", "expired invite");
    await s.as("super");
    const stored = await s.rows<{ token_hash: Buffer }>("select token_hash from public.family_invites");
    assert.ok(stored.every(r => !r.token_hash.toString("utf8").includes(t2)), "only hashes are stored");
  });
});

test("a person cannot create a second family; names are validated", async () => {
  await scenario(async s => {
    const { p1 } = await family(s);
    await s.as(p1);
    assert.equal(await s.fails("select public.create_family('Zweite', 'Ich')"), "23505");
    const fresh = await s.account();
    await s.as(fresh);
    assert.equal(await s.fails("select public.create_family('   ', 'Ich')"), "22023");
    assert.equal(await s.fails("select public.create_family('Ok', $1)", ["x".repeat(61)]), "22023");
  });
});

test("child device: pairing gives the child its own view only; sibling and parent data stay hidden", async () => {
  await scenario(async s => {
    const { p1, a, b } = await family(s);
    await s.as("super");
    await s.rows("insert into public.tasks(child_person_id, title) values ($1,'Aufgabe A'), ($2,'Aufgabe B')", [a, b]);
    const { device } = await pairDevice(s, p1, a);
    await s.as(device);
    assert.equal((await s.one<{ p: string }>("select app_private.current_person_id() p")).p, a);
    assert.deepEqual((await s.rows<{ title: string }>("select title from public.tasks")).map(r => r.title), ["Aufgabe A"]);
    assert.equal((await s.rows("select 1 from public.child_devices")).length, 0, "children cannot list devices");
    assert.equal(await s.fails("select public.add_child((select family_id from public.my_family() limit 1), 'X')"), "42501", "a child is no adult");
    assert.equal(await s.fails("select public.create_child_pairing_code($1)", [b]), "42501");
    assert.equal(await s.fails("select public.create_family('Neu', 'Kind')"), "23505", "device account cannot start a family");
  });
});

test("pairing code: single use, 10 minutes, newest code only, only via service role", async () => {
  await scenario(async s => {
    const { p1, p2, a } = await family(s);
    const { code } = await pairDevice(s, p1, a);
    const second = await s.account();
    await s.as("service");
    assert.equal(await s.fails("select app_private.redeem_child_pairing($1, $2, 'x')", [code, second.sub]), "22023", "used code");
    await s.as(p1);
    const { c1 } = await s.one<{ c1: string }>("select public.create_child_pairing_code($1) c1", [a]);
    await s.as(p2);
    const { c2 } = await s.one<{ c2: string }>("select public.create_child_pairing_code($1) c2", [a]);
    await s.as("service");
    assert.equal(await s.fails("select app_private.redeem_child_pairing($1, $2, 'x')", [c1, second.sub]), "22023", "superseded code");
    await s.as(second);
    assert.equal(await s.fails("select app_private.redeem_child_pairing($1, $2, 'x')", [c2, second.sub]), "42501", "end users cannot redeem");
    await s.as("super");
    await s.rows("update public.child_pairing_codes set expires_at = now() - interval '1 second' where used_at is null");
    await s.as("service");
    assert.equal(await s.fails("select app_private.redeem_child_pairing($1, $2, 'x')", [c2, second.sub]), "22023", "expired code");
    const parentAccount = p2.sub;
    await s.as(p1);
    const { c3 } = await s.one<{ c3: string }>("select public.create_child_pairing_code($1) c3", [a]);
    await s.as("service");
    assert.equal(await s.fails("select app_private.redeem_child_pairing($1, $2, 'x')", [c3, parentAccount]), "23505", "a parent account cannot become a child device");
  });
});

test("revoking a device removes access immediately; only guardians can revoke", async () => {
  await scenario(async s => {
    const { p1, p2, a } = await family(s);
    await s.as("super");
    await s.rows("insert into public.tasks(child_person_id, title) values ($1,'Aufgabe A')", [a]);
    const { device } = await pairDevice(s, p1, a);
    await s.as(p2);
    const devices = await s.rows<{ id: string; label: string }>("select id, label from public.child_devices");
    assert.deepEqual(devices.map(d => d.label), ["iPad"], "co-parent sees the device");
    const stranger = await s.account();
    await s.as(stranger);
    await s.one("select public.create_family('Andere', 'Fremd') x");
    assert.equal(await s.fails("select public.revoke_child_device($1)", [devices[0].id]), "42501");
    assert.equal((await s.rows("select 1 from public.child_devices")).length, 0, "strangers do not see devices");
    await s.as(p2);
    await s.one("select public.revoke_child_device($1) x", [devices[0].id]);
    await s.as(device);
    assert.equal((await s.one<{ p: string | null }>("select app_private.current_person_id() p")).p, null);
    assert.equal((await s.rows("select 1 from public.tasks")).length, 0);
  });
});

test("every onboarding write leaves an audit entry without secrets", async () => {
  await scenario(async s => {
    const { p1, a, token } = await family(s);
    const { code } = await pairDevice(s, p1, a);
    await s.as("super");
    const actions = (await s.rows<{ action: string }>("select action from public.audit_events order by occurred_at, action")).map(r => r.action);
    for (const want of ["family.created", "child.added", "family.invite_created", "family.invite_accepted", "child_device.code_created", "child_device.paired"])
      assert.ok(actions.includes(want), want);
    const dump = JSON.stringify(await s.rows("select * from public.audit_events"));
    assert.ok(!dump.includes(token) && !dump.includes(code), "no invite token or pairing code in the audit log");
  });
});

test("anon cannot call any onboarding function", async () => {
  await scenario(async s => {
    await s.as("super");
    await s.rows("set local role anon");
    for (const sql of ["select public.my_family()", "select public.create_family('a','b')", `select public.add_child('${f.family.f1}','x')`,
      "select public.accept_family_invite('x','y')", `select public.create_child_pairing_code('${f.person.ka}')`])
      assert.equal(await s.fails(sql), "42501", sql);
  });
});
