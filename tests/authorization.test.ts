import test from "node:test";
import assert from "node:assert/strict";
import { mayAccessChild } from "../packages/domain/src/authorization.ts";
import type { AccessGrant, GuardianRelationship } from "../packages/domain/src/index.ts";
const guardianships: GuardianRelationship[] = [{ childId: "child-a", guardianId: "parent-a", verified: true }, { childId: "child-b", guardianId: "parent-b", verified: false }];
const grants: AccessGrant[] = [{ subjectChildId: "child-a", granteePersonId: "patchwork-a", scope: "sports", capability: "read", expiresAt: "2030-01-01T00:00:00Z" }];
const check = (actorPersonId: string | null, childPersonId = "child-a", scope: "tasks" | "sports" = "tasks", capability: "read" | "write" = "read", now = new Date("2026-11-21T12:00:00Z")) =>
  mayAccessChild({ actorPersonId, childPersonId, scope, capability, guardianships, grants, now });
test("anonymous user denied", () => assert.equal(check(null), false));
test("verified guardian reads and writes child's tasks", () => { assert.equal(check("parent-a"), true); assert.equal(check("parent-a", "child-a", "tasks", "write"), true); });
test("other parent cannot read unrelated child", () => assert.equal(check("parent-b"), false));
test("unverified guardian denied", () => assert.equal(check("parent-b", "child-b"), false));
test("child can read own but not sibling's tasks", () => { assert.equal(check("child-a"), true); assert.equal(check("child-a", "child-b"), false); });
test("child cannot edit arbitrary task attributes", () => assert.equal(check("child-a", "child-a", "tasks", "write"), false));
test("patchwork grant scoped to sports read", () => { assert.equal(check("patchwork-a", "child-a", "sports"), true); assert.equal(check("patchwork-a", "child-a", "tasks"), false); assert.equal(check("patchwork-a", "child-a", "sports", "write"), false); });
test("expired and revoked grants denied", () => { assert.equal(check("patchwork-a", "child-a", "sports", "read", new Date("2031-01-01")), false); assert.equal(mayAccessChild({ actorPersonId: "patchwork-a", childPersonId: "child-a", scope: "sports", capability: "read", guardianships, grants: [{ ...grants[0], revokedAt: "2026-11-20" }], now: new Date("2026-11-21") }), false); });
