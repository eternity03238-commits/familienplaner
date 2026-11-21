import test, { after } from "node:test";
import assert from "node:assert/strict";
import { asUser, asBackend, closePool } from "./helpers.ts";
import * as f from "./fixtures.ts";
import { mayAccessChild } from "../../packages/domain/src/authorization.ts";
import type { AccessGrant, Capability, GuardianRelationship, Scope } from "../../packages/domain/src/index.ts";

after(closePool);

/**
 * CLAUDE.md Sprint 0 step 3 — compare domain and DB models. The pure TypeScript policy
 * (`mayAccessChild`) and the SQL policy (`app_private.can_access_child`) must agree for every
 * combination of actor × child × scope × capability on the same data.
 */
test("domain mayAccessChild() and DB app_private.can_access_child() agree on all combinations", async () => {
  const { guardianships, grants } = await asBackend(async q => ({
    guardianships: (await q.rows<{ child_person_id: string; guardian_person_id: string; verified_at: Date | null }>("select * from public.child_guardianships"))
      .map((r): GuardianRelationship => ({ childId: r.child_person_id, guardianId: r.guardian_person_id, verified: r.verified_at !== null })),
    grants: (await q.rows<{ subject_person_id: string; grantee_person_id: string; scope: Scope; capability: Capability; expires_at: Date | null; revoked_at: Date | null }>("select * from public.access_grants"))
      .map((r): AccessGrant => ({ subjectChildId: r.subject_person_id, granteePersonId: r.grantee_person_id, scope: r.scope, capability: r.capability, expiresAt: r.expires_at?.toISOString() ?? null, revokedAt: r.revoked_at?.toISOString() ?? null }))
  }));
  const scopes: Scope[] = ["school", "tasks", "sports", "exams", "projects", "schedule"];
  const caps: Capability[] = ["read", "write"];
  const children = [f.person.ka, f.person.kb, f.person.kc] as const;
  let compared = 0;
  for (const actor of f.actorsWithPerson) {
    await asUser(actor)(async q => {
      for (const child of children) for (const scope of scopes) for (const capability of caps) {
        const db = (await q.rows<{ ok: boolean }>("select app_private.can_access_child($1,$2::public.access_scope,$3::public.access_capability) ok", [child, scope, capability]))[0].ok;
        const domain = mayAccessChild({ actorPersonId: f.person[actor], childPersonId: child, scope, capability, guardianships, grants });
        assert.equal(domain, db, `mismatch actor=${actor} child=${child} scope=${scope} cap=${capability}: domain=${domain} db=${db}`);
        compared++;
      }
    });
  }
  assert.equal(compared, f.actorsWithPerson.length * 3 * 6 * 2);
});
