import test from "node:test";
import assert from "node:assert/strict";
import { mayAccessChild } from "../packages/domain/src/authorization.ts";
import type { AccessGrant, Capability, GuardianRelationship, Scope } from "../packages/domain/src/index.ts";

const NOW = new Date("2026-11-21T12:00:00Z");
const guardianships: GuardianRelationship[] = [
  { childId: "child-a", guardianId: "parent-a", verified: true },
  { childId: "child-a", guardianId: "parent-pw", verified: true },
  { childId: "child-b", guardianId: "parent-a", verified: true }
];
const grant = (over: Partial<AccessGrant> = {}): AccessGrant => ({ subjectChildId: "child-a", granteePersonId: "grantee", scope: "tasks", capability: "read", expiresAt: null, revokedAt: null, ...over });
const check = (actorPersonId: string | null, o: { child?: string; scope?: Scope; cap?: Capability; grants?: AccessGrant[]; g?: GuardianRelationship[] } = {}) =>
  mayAccessChild({ actorPersonId, childPersonId: o.child ?? "child-a", scope: o.scope ?? "tasks", capability: o.cap ?? "read", guardianships: o.g ?? guardianships, grants: o.grants ?? [], now: NOW });

test("empty-string and unknown actors are denied", () => {
  assert.equal(check(""), false);
  assert.equal(check("nobody"), false);
});
test("co-guardians in different households are isolated from siblings they do not guard", () => {
  assert.equal(check("parent-pw", { child: "child-a" }), true);
  assert.equal(check("parent-pw", { child: "child-b" }), false);
});
test("a grant for child A never opens child B", () => {
  const g = [grant({ capability: "write" })];
  assert.equal(check("grantee", { child: "child-a", grants: g }), true);
  assert.equal(check("grantee", { child: "child-b", grants: g }), false);
});
test("a grant for another grantee does not apply", () => assert.equal(check("someone-else", { grants: [grant()] }), false));
test("scope must match exactly; read grant never allows write; write grant allows read", () => {
  assert.equal(check("grantee", { grants: [grant()], scope: "exams" }), false);
  assert.equal(check("grantee", { grants: [grant()], cap: "write" }), false);
  assert.equal(check("grantee", { grants: [grant({ capability: "write" })], cap: "read" }), true);
});
test("grant expiry boundary: expires exactly now => denied", () => {
  assert.equal(check("grantee", { grants: [grant({ expiresAt: NOW.toISOString() })] }), false);
  assert.equal(check("grantee", { grants: [grant({ expiresAt: "2026-11-21T12:00:01Z" })] }), true);
});
test("unparsable expiry fails closed", () => assert.equal(check("grantee", { grants: [grant({ expiresAt: "not-a-date" })] }), false));
test("revoked grant stays denied even when it has not expired", () => assert.equal(check("grantee", { grants: [grant({ revokedAt: "2026-11-01T00:00:00Z" })] }), false));
test("unverified guardianship never authorises, even together with a matching-looking grant for another scope", () => {
  const g = [{ childId: "child-a", guardianId: "pending", verified: false }];
  assert.equal(check("pending", { g, grants: [grant({ granteePersonId: "pending", scope: "sports" })] }), false);
});
test("a child may read own data but never write any scope, nor read another child's", () => {
  for (const scope of ["school", "tasks", "sports", "exams", "projects", "schedule"] as Scope[]) {
    assert.equal(check("child-a", { scope }), true);
    assert.equal(check("child-a", { scope, cap: "write" }), false);
    assert.equal(check("child-a", { scope, child: "child-b" }), false);
  }
});
test("household membership is not a domain concept for authorization: no input can grant access through it", () => {
  // mayAccessChild has no household/family parameter by design (ADR-0002).
  assert.equal(mayAccessChild.length, 1);
  assert.equal(check("same-household-member"), false);
});
