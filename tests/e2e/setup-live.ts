/**
 * End-to-end check of the live setup backend against the local Supabase stack (CI job `supabase-local`).
 * Real GoTrue email + password sign-up (no confirmation mail), real PostgREST RPCs, real RLS.
 * Synthetic addresses only (@familyos.test). Never point this at a hosted project.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { liveBackend } from "../../apps/web/lib/setup/backend.ts";

const API = process.env.SUPABASE_API_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.SUPABASE_ANON_KEY;
if (!KEY) throw new Error("SUPABASE_ANON_KEY missing (supabase status -o env)");
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(API)) throw new Error("e2e runs only against the local stack");

const run = Date.now().toString(36);
const client = () => createClient(API, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const PW = `Test-${run}-Passwort!`;
async function signIn(email: string) {
  const sb = client();
  const b = liveBackend(sb);
  await b.signUp(email, PW);
  return { sb, b };
}

const p1 = await signIn(`eltern1-${run}@familyos.test`);
assert.equal(await p1.b.loadFamily(), null, "new account has no family");
await p1.b.createFamily("Familie E2E", "Erwachsene Eins");
const fam = await p1.b.loadFamily();
assert.ok(fam && fam.myId, "family and own person visible after create");
const mia = await p1.b.addChild(fam!.familyId, "Kind Alpha");
await p1.b.addChild(fam!.familyId, "Kind Beta");
await p1.b.renamePerson(mia, "Kind Alpha Neu");
await p1.b.renameFamily(fam!.familyId, "Familie E2E Neu");
await assert.rejects(p1.b.createFamily("Zweite", "X"), /schon zu einer Familie/, "no second family");
const token = await p1.b.createInvite(fam!.familyId);
assert.match(token, /^[A-Za-z0-9_-]{32}$/);

const p2 = await signIn(`eltern2-${run}@familyos.test`);
assert.equal(await p2.b.acceptInvite(token, "Erwachsene Zwei"), fam!.familyId);
const seen = await p2.b.loadFamily();
assert.equal(seen?.familyName, "Familie E2E Neu");
assert.deepEqual(seen?.children.map(c => c.name).sort(), ["Kind Alpha Neu", "Kind Beta"]);

const stranger = await signIn(`fremd-${run}@familyos.test`);
await assert.rejects(stranger.b.acceptInvite(token, "Zu spät"), /Einladung/, "invite is single use");
assert.equal(await stranger.b.loadFamily(), null);
await assert.rejects(stranger.b.addChild(fam!.familyId, "Eindringling"), /Berechtigung/);
const leak = await stranger.sb.from("persons").select("id");
assert.equal(leak.error, null);
assert.equal(leak.data?.length, 0, "RLS: stranger sees no persons");

// Returning parent signs in with the password; wrong password and duplicate sign-up give clear messages.
const again = liveBackend(client());
await assert.rejects(again.signIn(`eltern1-${run}@familyos.test`, "falsch-falsch"), /stimmen nicht/);
await assert.rejects(again.signUp(`eltern1-${run}@familyos.test`, PW), /schon ein Konto|stimmen nicht/);
await again.signIn(`eltern1-${run}@familyos.test`, PW);
assert.equal((await again.loadFamily())?.familyName, "Familie E2E Neu", "returning parent sees the family");

const anon = client();
const anonCall = await anon.rpc("my_family");
assert.ok(anonCall.error, "anon cannot call RPCs");

console.log("e2e setup ok: email+password sign-up/sign-in, create family, children, rename, invite, accept, isolation");
