import test from "node:test";
import assert from "node:assert/strict";
import { ForbiddenError, UnauthenticatedError, createAuthorizer, type AuthorizerPorts } from "../packages/auth/src/index.ts";
import { mayAccessChild } from "../packages/domain/src/authorization.ts";

const guardianships = [{ childId: "child-a", guardianId: "person-a", verified: true }];
const ports = (over: Partial<AuthorizerPorts> = {}): AuthorizerPorts => ({
  verifiedAuthUserId: async () => "auth-a",
  personIdForAuthUser: async id => (id === "auth-a" ? "person-a" : null),
  mayAccessChild: async (actorPersonId, childPersonId, scope, capability) => mayAccessChild({ actorPersonId, childPersonId, scope, capability, guardianships, grants: [] }),
  ...over
});

test("no verified session => 401, never an actor", async () => {
  await assert.rejects(createAuthorizer(ports({ verifiedAuthUserId: async () => null })).requireSignedIn(), UnauthenticatedError);
  await assert.rejects(createAuthorizer(ports({ verifiedAuthUserId: async () => "" })).requireSignedIn(), UnauthenticatedError);
});
test("auth account without a person is not an actor (account != person)", async () => {
  await assert.rejects(createAuthorizer(ports({ personIdForAuthUser: async () => null })).requireSignedIn(), UnauthenticatedError);
});
test("backend failures fail closed without leaking details", async () => {
  const boom = async () => { throw new Error("db password=hunter2 host=internal"); };
  await assert.rejects(createAuthorizer(ports({ verifiedAuthUserId: boom })).requireSignedIn(), (e: Error) => e instanceof UnauthenticatedError && !/hunter2|internal/.test(e.message));
  await assert.rejects(createAuthorizer(ports({ personIdForAuthUser: boom })).requireSignedIn(), UnauthenticatedError);
  const authz = createAuthorizer(ports({ mayAccessChild: boom }));
  await assert.rejects(authz.requireChildScope({ authUserId: "auth-a", personId: "person-a" }, "child-a", "tasks", "read"), (e: Error) => e instanceof ForbiddenError && !/hunter2|internal/.test(e.message));
});
test("verified guardian passes; wrong child, unknown child and missing scope all yield the same 403", async () => {
  const authz = createAuthorizer(ports());
  const actor = await authz.requireSignedIn();
  assert.deepEqual(actor, { authUserId: "auth-a", personId: "person-a" });
  await authz.requireChildScope(actor, "child-a", "tasks", "write");
  const errors: Error[] = [];
  for (const child of ["child-b", "does-not-exist", "", "../child-a", "child-a' or '1'='1"]) {
    try { await authz.requireChildScope(actor, child, "tasks", "read"); assert.fail(`expected 403 for ${child}`); } catch (e) { errors.push(e as Error); }
  }
  for (const e of errors) { assert.ok(e instanceof ForbiddenError); assert.equal(e.message, errors[0].message); }
});
test("a policy answer other than strict `true` is a denial", async () => {
  const authz = createAuthorizer(ports({ mayAccessChild: async () => "yes" as unknown as boolean }));
  await assert.rejects(authz.requireChildScope({ authUserId: "a", personId: "person-a" }, "child-a", "tasks", "read"), ForbiddenError);
});
test("forged/empty actors are rejected", async () => {
  const authz = createAuthorizer(ports());
  await assert.rejects(authz.requireChildScope({ authUserId: "x", personId: "" }, "child-a", "tasks", "read"), ForbiddenError);
  await assert.rejects(authz.requireChildScope(undefined as never, "child-a", "tasks", "read"), ForbiddenError);
});
