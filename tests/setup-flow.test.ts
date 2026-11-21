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
  assert.match(f.blocker(s)!, /E-Mail/);
  s = { ...s, codeSent: true };
  assert.match(f.blocker(s)!, /Code/);
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

test("email and code validation", () => {
  assert.ok(f.validEmail(" eltern@example.com "));
  assert.ok(!f.validEmail("eltern@example"));
  assert.ok(f.validCode("123456"));
  assert.ok(!f.validCode("12345a"));
});
