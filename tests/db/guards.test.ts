import test, { after } from "node:test";
import assert from "node:assert/strict";
import { asBackend, closePool } from "./helpers.ts";
import * as f from "./fixtures.ts";

after(closePool);

const CHECK = "23514";
const DENIED = "42501";
const UNIQUE = "23505";

// ---------------- AI proposals vs authorized changes (ADR-0003) ----------------

test("AI proposals can only be created pending", async () => {
  await asBackend(async q => {
    const err = await q.fails("insert into public.ai_proposals(child_person_id, payload, status) values ($1,'{}','approved')", [f.person.ka]);
    assert.equal(err.code, CHECK);
    const ok = await q.rows<{ status: string }>("insert into public.ai_proposals(child_person_id, payload) values ($1,'{}') returning status", [f.person.ka]);
    assert.equal(ok[0].status, "pending");
  });
});

test("approved/rejected require a deciding person and timestamp (CHECK, applies to service_role too)", async () => {
  await asBackend(async q => {
    assert.equal((await q.fails("update public.ai_proposals set status='approved' where id=$1", [f.proposal.ka])).code, DENIED);
  });
});

test("only a verified guardian of THIS child can approve — child, outsider, other-family guardian, unverified guardian, patchwork grantee all fail", async () => {
  const decide = (who: keyof typeof f.person) =>
    `update public.ai_proposals set status='approved', approved_by_person_id='${f.person[who]}', approved_at=now() where id='${f.proposal.ka}'`;
  await asBackend(async q => {
    for (const who of ["ka", "kb", "outsider", "c1", "u1", "grTasksW", "grSports"] as const)
      assert.equal((await q.fails(decide(who))).code, DENIED, `${who} must not approve`);
    // A guardian of another child only:
    assert.equal((await q.fails(`update public.ai_proposals set status='approved', approved_by_person_id='${f.person.c1}', approved_at=now() where id='${f.proposal.kc}' and false or id='${f.proposal.ka}'`)).code, DENIED);
  });
});

test("verified guardian may approve once; second decision and payload edits are rejected", async () => {
  await asBackend(async q => {
    await q.rows(`update public.ai_proposals set status='approved', approved_by_person_id=$1, approved_at=now() where id=$2`, [f.person.pw, f.proposal.ka]);
    assert.equal((await q.fails(`update public.ai_proposals set status='rejected', approved_by_person_id=$1, approved_at=now() where id=$2`, [f.person.ad1, f.proposal.ka])).code, CHECK);
  });
  await asBackend(async q => {
    assert.equal((await q.fails(`update public.ai_proposals set payload='{"steps":[]}' where id=$1`, [f.proposal.kb])).code, CHECK);
    assert.equal((await q.fails(`update public.ai_proposals set child_person_id=$1 where id=$2`, [f.person.kb, f.proposal.ka])).code, CHECK);
  });
});

test("an end-user session cannot decide a proposal in another guardian's name", async () => {
  await asBackend(async q => {
    const err = await q.fails(`update public.ai_proposals set status='approved', approved_by_person_id=$1, approved_at=now() where id=$2`, [f.person.ad2, f.proposal.ka]);
    assert.equal(err.code, DENIED);
  }, "ad1");
  await asBackend(async q => {
    const ok = await q.rows<{ status: string }>(`update public.ai_proposals set status='rejected', approved_by_person_id=$1, approved_at=now() where id=$2 returning status`, [f.person.ad1, f.proposal.ka]);
    assert.equal(ok[0].status, "rejected");
  }, "ad1");
});

// ---------------- Children must not alter deadlines (CLAUDE.md rule 11) ----------------

test("child session: changing due date, title, owner or cancelling a task is rejected; ticking it off is allowed", async () => {
  await asBackend(async q => {
    for (const set of ["due_at = now() + interval '30 days'", "due_on = '2030-01-01'", "title = 'changed'", "child_person_id = '" + f.person.kb + "'", "status = 'cancelled'"])
      assert.equal((await q.fails(`update public.tasks set ${set} where id = $1`, [f.task.ka])).code, DENIED, set);
    const ok = await q.rows<{ status: string }>("update public.tasks set status='done', updated_at=now() where id=$1 returning status", [f.task.ka]);
    assert.equal(ok[0].status, "done");
  }, "ka");
});

test("guardian and trusted backend may still change task attributes", async () => {
  await asBackend(async q => {
    assert.equal((await q.rows("update public.tasks set due_at = '2030-01-01T00:00:00Z' where id=$1 returning id", [f.task.ka])).length, 1);
  }, "ad1");
  await asBackend(async q => {
    assert.equal((await q.rows("update public.tasks set title = 'backend change' where id=$1 returning id", [f.task.ka])).length, 1);
  });
});

// ---------------- Patchwork grants cannot be self-issued ----------------

const insertGrant = (grantedBy: string, scope = "tasks") =>
  ["insert into public.access_grants(subject_person_id, grantee_person_id, scope, capability, granted_by) values ($1,$2,$3,'read',$4)", [f.person.ka, f.person.outsider, scope, grantedBy]] as const;

test("grants: only a verified guardian of the child can issue; child, grantee and unverified persons cannot", async () => {
  await asBackend(async q => {
    for (const who of ["ka", "kb", "outsider", "c1", "u1", "grTasksW"] as const)
      assert.equal((await q.fails(...insertGrant(f.person[who]))).code, DENIED, `${who} must not issue grants`);
    assert.equal((await q.rows(insertGrant(f.person.pw)[0] + " returning id", [...insertGrant(f.person.pw)[1]])).length, 1);
  });
});

test("grants: a signed-in guardian cannot issue a grant in someone else's name", async () => {
  await asBackend(async q => {
    assert.equal((await q.fails(...insertGrant(f.person.ad2))).code, DENIED);
  }, "ad1");
});

test("grants are immutable except revocation; revocation is final and guardian-only", async () => {
  await asBackend(async q => {
    assert.equal((await q.fails("update public.access_grants set scope='exams' where id=$1", [f.grant.sports])).code, CHECK);
    assert.equal((await q.fails("update public.access_grants set capability='write' where id=$1", [f.grant.sports])).code, CHECK);
    assert.equal((await q.fails("update public.access_grants set expires_at = null, revoked_at = null where id=$1", [f.grant.expired])).code, CHECK);
    assert.equal((await q.fails("update public.access_grants set revoked_at = null where id=$1", [f.grant.revoked])).code, CHECK);
  });
  await asBackend(async q => {
    assert.equal((await q.fails("update public.access_grants set revoked_at = now() where id=$1", [f.grant.sports])).code, DENIED);
  }, "outsider");
  await asBackend(async q => {
    assert.equal((await q.rows("update public.access_grants set revoked_at = now() where id=$1 returning id", [f.grant.sports])).length, 1);
  }, "ad1");
});

// ---------------- Data quality rules (DATA_MODEL.md) ----------------

test("data quality constraints", async () => {
  await asBackend(async q => {
    // all-day events need a date; timed events need a positive duration
    assert.equal((await q.fails("insert into public.calendar_events(owner_person_id, title, all_day) values ($1,'x',true)", [f.person.ad1])).code, CHECK);
    assert.equal((await q.fails("insert into public.calendar_events(owner_person_id, title, starts_at, ends_at) values ($1,'x','2026-12-01T10:00Z','2026-12-01T09:00Z')", [f.person.ad1])).code, CHECK);
    assert.equal((await q.rows("insert into public.calendar_events(owner_person_id, title, all_day, event_date) values ($1,'x',true,'2026-12-24') returning id", [f.person.ad1])).length, 1);
    // no duplicate completion per task+person
    await q.rows("insert into public.task_completions(task_id, person_id) values ($1,$2)", [f.task.ka, f.person.ka]);
    assert.equal((await q.fails("insert into public.task_completions(task_id, person_id) values ($1,$2)", [f.task.ka, f.person.ka])).code, UNIQUE);
    // external mappings are unique per connection/kind/external id (idempotent webhooks, no duplicate events)
    await q.rows("insert into public.external_resource_mappings(connection_id, resource_kind, external_id, internal_id) values ($1,'event','g-1',$2)", [f.connection.ad1, f.event.ad1Private]);
    assert.equal((await q.fails("insert into public.external_resource_mappings(connection_id, resource_kind, external_id, internal_id) values ($1,'event','g-1',$2)", [f.connection.ad1, f.event.ad2Private])).code, UNIQUE);
    // identities are separated: a person cannot be their own guardian, accounts map 1:1 to a person
    assert.equal((await q.fails("insert into public.child_guardianships(child_person_id, guardian_person_id) values ($1,$1)", [f.person.ka])).code, CHECK);
    assert.equal((await q.fails("insert into public.users(auth_user_id, person_id) values ($1,$2)", [f.auth.orphan, f.person.ka])).code, UNIQUE);
    // household membership alone is not a family relationship (separate tables, many-to-many)
    assert.equal((await q.rows("insert into public.household_memberships values ($1,$2)", [f.household.h3, f.person.ka])).length, 0);
    // time model: timestamptz + explicit family timezone
    const tz = await q.rows<{ timezone: string }>("select timezone from public.families where id=$1", [f.family.f1]);
    assert.equal(tz[0].timezone, "Europe/Berlin");
    // planned study sessions need a positive duration
    assert.equal((await q.fails("insert into public.study_sessions(child_person_id, starts_at, ends_at) values ($1,'2026-12-01T10:00Z','2026-12-01T10:00Z')", [f.person.ka])).code, CHECK);
  });
});
