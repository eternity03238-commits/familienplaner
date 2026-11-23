import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as f from "../apps/web/lib/setup/flow.ts";

test("names follow the database rule (0004 clean_name): trimmed, collapsed, 1–60 chars", () => {
  assert.equal(f.cleanName("  Familie   Sommer "), "Familie Sommer");
  assert.equal(f.cleanName("   "), null);
  assert.equal(f.cleanName("x".repeat(60))?.length, 60);
  assert.equal(f.cleanName("x".repeat(61)), null);
  const sql = readFileSync(new URL("../packages/database/migrations/0004_family_onboarding.sql", import.meta.url), "utf8");
  assert.match(sql, /char_length\(v\) > 60/, "UI limit and DB limit must stay identical");
});

test("five numbered steps, then the summary", () => {
  assert.equal(f.STEP_COUNT, 5);
  assert.deepEqual(f.STEPS.map(f.stepNumber), [1, 2, 3, 4, 5, null]);
  assert.equal(f.next("geraete"), "fertig");
  assert.equal(f.next("fertig"), "fertig");
  assert.equal(f.prev("konto"), "konto");
});

test("each step explains what is missing instead of silently blocking", () => {
  let s: f.SetupState = { ...f.initialState };
  assert.match(f.blocker(s)!, /E-Mail-Adresse und Passwort/);
  assert.equal(s.accountMode, "neu", "first visit creates an account");
  s = { ...s, signedIn: true };
  assert.equal(f.blocker(s), null);
  s = { ...s, step: "familie", familyName: "Sommer" };
  assert.match(f.blocker(s)!, /Vornamen/);
  s = { ...s, myName: "Alex", step: "kinder" };
  assert.match(f.blocker(s)!, /mindestens ein Kind/);
  s = f.renameChild(s, "k1", "Mia");
  assert.equal(f.blocker(s), null);
  assert.equal(f.blocker({ ...s, step: "partner" }), null, "inviting the partner is optional");
  assert.equal(f.blocker({ ...s, step: "geraete" }), null, "pairing devices is optional");
});

test("children: add, rename, remove; empty rows are ignored; at most 8", () => {
  let s = f.addChild(f.renameChild(f.initialState, "k1", "Mia"));
  assert.equal(s.children.length, 2);
  assert.deepEqual(f.namedChildren(s).map(c => c.name), ["Mia"]);
  s = f.renameChild(s, s.children[1].key, "  Ben ");
  assert.deepEqual(f.namedChildren(s).map(c => c.name), ["Mia", "Ben"]);
  s = { ...s, pairedChildKeys: [s.children[1].key] };
  s = f.removeChild(s, s.children[1].key);
  assert.deepEqual(s.pairedChildKeys, [], "removing a child also forgets its device state");
  for (let i = 0; i < 20; i++) s = f.addChild(s);
  assert.equal(s.children.length, f.MAX_CHILDREN);
  assert.equal(new Set(s.children.map(c => c.key)).size, s.children.length, "keys stay unique");
  assert.equal(f.removeChild({ ...f.initialState }, "k1").children.length, 1, "always one input row");
});

test("email and password validation (no mail is ever sent)", () => {
  assert.ok(f.validEmail(" eltern@example.com "));
  assert.ok(!f.validEmail("eltern@example"));
  assert.ok(f.validPassword("abcdefgh"));
  assert.ok(!f.validPassword("1234567"));
  assert.ok(!f.validPassword("x".repeat(73)), "bcrypt limit");
});

test("only new or renamed children are written; saved names are not re-sent", () => {
  let s: f.SetupState = { ...f.initialState, children: [{ key: "k1", name: "Mia", id: "p1", savedName: "Mia" }, { key: "k2", name: "Benjamin", id: "p2", savedName: "Ben" }, { key: "k3", name: " Lea " }, { key: "k4", name: "" }] };
  assert.deepEqual(f.pendingChildWrites(s), [{ kind: "rename", key: "k2", id: "p2", name: "Benjamin" }, { kind: "add", key: "k3", name: "Lea" }]);
  s = { ...s, children: s.children.map(c => (c.id ? { ...c, savedName: c.name } : c)) };
  assert.equal(f.pendingChildWrites(s).length, 1);
});

test("partner joining by invite only enters a first name", () => {
  const s: f.SetupState = { ...f.initialState, step: "familie", invite: "x".repeat(32), signedIn: true };
  assert.deepEqual(f.stepsFor(s), ["konto", "familie", "fertig"]);
  assert.match(f.blocker(s)!, /Vornamen/);
  assert.equal(f.blocker({ ...s, myName: "Sam" }), null, "no family name needed when joining");
});
