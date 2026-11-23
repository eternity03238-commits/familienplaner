import test, { after } from "node:test";
import assert from "node:assert/strict";
import { asAnon, asBackend, asService, asUser, closePool, ids, withIdentity } from "./helpers.ts";
import * as f from "./fixtures.ts";

after(closePool);
const sorted = (...x: string[]) => [...x].sort();

// ---- SECURITY.md Pflichtfälle, ausgeführt mit echten DB-Rollen + JWT-Claims (nicht simuliert) ----

test("anon: no table is readable (permission denied), even though RLS would also hide rows", async () => {
  await asAnon(async q => {
    for (const t of ["tasks", "exams", "projects", "persons", "users", "calendar_events", "ai_proposals", "access_grants", "child_guardianships"]) {
      const err = await q.fails(`select * from public.${t}`);
      assert.equal(err.code, "42501", `anon must not read ${t}`);
    }
  });
});

test("anon: cannot call the permission helpers", async () => {
  await asAnon(async q => {
    assert.equal((await q.fails("select app_private.current_person_id()")).code, "42501");
    assert.equal((await q.fails("select app_private.can_access_child($1,'tasks','read')", [f.person.ka])).code, "42501");
  });
});

test("authenticated JWT without a FamilyOS user row sees nothing", async () => {
  await withIdentity({ role: "authenticated", sub: f.auth.orphan }, async q => {
    for (const t of ["tasks", "exams", "projects", "study_sessions", "ai_proposals", "calendar_events", "persons", "users"])
      assert.equal((await q.rows(`select 1 from public.${t}`)).length, 0, `orphan must not see ${t}`);
  });
});

test("authenticated with a malformed/no subject sees nothing", async () => {
  await withIdentity({ role: "authenticated" }, async q => {
    assert.equal((await q.rows("select 1 from public.tasks")).length, 0);
    assert.equal((await q.rows<{ p: string | null }>("select app_private.current_person_id() p"))[0].p, null);
  });
});

test("guardian A sees exactly the tasks/exams/projects/sessions/proposals of her authorised children", async () => {
  await asUser("ad1")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), sorted(f.task.ka, f.task.kb));
    assert.deepEqual(await ids(q, "select id from public.exams"), sorted(f.exam.ka, f.exam.kb));
    assert.deepEqual(await ids(q, "select id from public.projects"), sorted(f.project.ka, f.project.kb));
    assert.deepEqual(await ids(q, "select id from public.project_steps"), sorted(f.step.ka, f.step.kb));
    assert.deepEqual(await ids(q, "select id from public.study_sessions"), sorted(f.studySession.ka, f.studySession.kb));
    assert.deepEqual(await ids(q, "select id from public.ai_proposals"), sorted(f.proposal.ka, f.proposal.kb));
  });
});

test("guardian of another family cannot read child A or B; sees only her own child", async () => {
  await asUser("c1")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), [f.task.kc]);
    assert.deepEqual(await ids(q, "select id from public.exams"), [f.exam.kc]);
    assert.deepEqual(await ids(q, "select id from public.ai_proposals"), [f.proposal.kc]);
    assert.deepEqual(await ids(q, "select id from public.persons"), sorted(f.person.c1, f.person.kc));
  });
});

test("unverified guardianship grants nothing", async () => {
  await asUser("u1")(async q => {
    for (const t of ["tasks", "exams", "projects", "study_sessions", "ai_proposals"]) assert.equal((await q.rows(`select 1 from public.${t}`)).length, 0, t);
    assert.deepEqual(await ids(q, "select id from public.persons"), [f.person.u1]);
  });
});

test("user without any relation to a household member sees nothing, even sharing a household", async () => {
  await asUser("outsider")(async q => {
    for (const t of ["tasks", "exams", "projects", "study_sessions", "ai_proposals"]) assert.equal((await q.rows(`select 1 from public.${t}`)).length, 0, t);
    assert.deepEqual(await ids(q, "select id from public.persons"), [f.person.outsider]);
  });
});

test("child A: reads own data, never child B's (sibling isolation)", async () => {
  await asUser("ka")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), [f.task.ka]);
    assert.deepEqual(await ids(q, "select id from public.exams"), [f.exam.ka]);
    assert.deepEqual(await ids(q, "select id from public.projects"), [f.project.ka]);
    assert.deepEqual(await ids(q, "select id from public.persons"), [f.person.ka]);
    assert.equal((await q.rows("select 1 from public.tasks where child_person_id = $1", [f.person.kb])).length, 0);
  });
  await asUser("kb")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), [f.task.kb]);
  });
});

test("patchwork guardian (second household) sees child A only, not sibling B", async () => {
  await asUser("pw")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), [f.task.ka]);
    assert.deepEqual(await ids(q, "select id from public.exams"), [f.exam.ka]);
    assert.deepEqual(await ids(q, "select id from public.persons"), sorted(f.person.pw, f.person.ka));
  });
});

test("patchwork grant sports.read: tasks.read denied, sports.write denied, nothing else readable", async () => {
  await asUser("grSports")(async q => {
    const can = async (scope: string, cap: string) =>
      (await q.rows<{ ok: boolean }>("select app_private.can_access_child($1,$2::public.access_scope,$3::public.access_capability) ok", [f.person.ka, scope, cap]))[0].ok;
    assert.equal(await can("sports", "read"), true);
    assert.equal(await can("sports", "write"), false);
    assert.equal(await can("tasks", "read"), false);
    assert.equal(await can("exams", "read"), false);
    assert.equal((await q.rows("select 1 from public.tasks")).length, 0);
    assert.equal((await q.rows("select 1 from public.exams")).length, 0);
  });
});

test("patchwork grant tasks.write implies tasks.read only for that scope and child", async () => {
  await asUser("grTasksW")(async q => {
    assert.deepEqual(await ids(q, "select id from public.tasks"), [f.task.ka]);
    assert.equal((await q.rows("select 1 from public.exams")).length, 0);
    assert.equal((await q.rows("select 1 from public.tasks where child_person_id = $1", [f.person.kb])).length, 0);
  });
});

test("expired and revoked grants deny access", async () => {
  for (const who of ["grExpired", "grRevoked"] as const)
    await asUser(who)(async q => assert.equal((await q.rows("select 1 from public.tasks")).length, 0, who));
});

test("adult private events stay private; guardians see all events of their children (ADR-0007)", async () => {
  await asUser("ad1")(async q => {
    const ev = await ids(q, "select id from public.calendar_events");
    assert.ok(ev.includes(f.event.ad1Private));
    assert.ok(!ev.includes(f.event.ad2Private), "other adult's private event must stay private");
    assert.ok(ev.includes(f.event.kaShared), "guardian sees shared child events");
    assert.ok(ev.includes(f.event.kaPrivate), "guardians see every event of their child (ADR-0007)");
  });
  await asUser("ad2")(async q => {
    const ev = await ids(q, "select id from public.calendar_events");
    assert.ok(!ev.includes(f.event.ad1Private));
  });
  await asUser("ka")(async q => {
    assert.deepEqual(await ids(q, "select id from public.calendar_events"), sorted(f.event.kaShared, f.event.kaPrivate));
  });
  await asUser("kb")(async q => assert.deepEqual(await ids(q, "select id from public.calendar_events"), [], "sibling sees nothing of child A"));
  await asUser("outsider")(async q => assert.deepEqual(await ids(q, "select id from public.calendar_events"), []));
  // A scoped grantee without guardianship still only sees shared events, and only with the schedule scope.
  await asUser("grSports")(async q => assert.ok(!(await ids(q, "select id from public.calendar_events")).includes(f.event.kaPrivate)));
});

test("tables without any read policy stay invisible to authenticated users", async () => {
  await asUser("ad1")(async q => {
    for (const t of ["access_grants", "child_guardianships", "families", "households", "family_memberships", "household_memberships",
      "schools", "school_enrollments", "subjects", "task_completions", "routines", "external_resource_mappings", "sync_runs", "audit_events"])
      assert.equal((await q.fails(`select 1 from public.${t}`)).code, "42501", t);
    // 0005: only the own connections are readable (status columns only).
    const foreign = await q.rows("select id from public.integration_connections where owner_person_id <> app_private.current_person_id()");
    assert.deepEqual(foreign, []);
  });
});

test("authenticated users can not write ANY table (no direct client writes in Sprint 0)", async () => {
  const tables = ["persons", "users", "families", "households", "family_memberships", "household_memberships", "child_guardianships", "access_grants",
    "schools", "school_enrollments", "subjects", "tasks", "task_completions", "exams", "projects", "project_steps", "study_sessions", "routines",
    "calendar_events", "integration_connections", "external_resource_mappings", "sync_runs", "ai_proposals", "audit_events"];
  const firstColumn = new Map((await asBackend(q => q.rows<{ t: string; c: string }>(
    "select table_name t, column_name c from information_schema.columns where table_schema='public' and ordinal_position = 1"))).map(r => [r.t, r.c]));
  for (const actor of ["ad1", "ka", "pw", "grTasksW"] as const) {
    await asUser(actor)(async q => {
      for (const t of tables) {
        const col = firstColumn.get(t);
        assert.ok(col, `no column found for ${t}`);
        assert.equal((await q.fails(`insert into public.${t} default values`)).code, "42501", `${actor} insert ${t}`);
        assert.equal((await q.fails(`update public.${t} set ${col} = ${col}`)).code, "42501", `${actor} update ${t}`);
        assert.equal((await q.fails(`delete from public.${t}`)).code, "42501", `${actor} delete ${t}`);
        assert.equal((await q.fails(`truncate public.${t}`)).code, "42501", `${actor} truncate ${t}`);
      }
    });
  }
});

test("child cannot mutate a task due date directly (no UPDATE privilege) nor self-issue a grant or guardianship", async () => {
  await asUser("ka")(async q => {
    assert.equal((await q.fails("update public.tasks set due_at = now() + interval '30 days' where id = $1", [f.task.ka])).code, "42501");
    assert.equal((await q.fails("insert into public.access_grants(subject_person_id, grantee_person_id, scope, capability, granted_by) values ($1,$2,'tasks','write',$1)", [f.person.ka, f.person.outsider])).code, "42501");
    assert.equal((await q.fails("insert into public.child_guardianships(child_person_id, guardian_person_id, verified_at) values ($1,$2,now())", [f.person.ka, f.person.outsider])).code, "42501");
  });
});

test("AI cannot create proposals, sessions or calendar events through an end-user session", async () => {
  await asUser("ad1")(async q => {
    assert.equal((await q.fails("insert into public.ai_proposals(child_person_id, payload) values ($1,'{}')", [f.person.ka])).code, "42501");
    assert.equal((await q.fails("update public.ai_proposals set status='approved' where id=$1", [f.proposal.ka])).code, "42501");
    assert.equal((await q.fails("insert into public.study_sessions(child_person_id, starts_at, ends_at) values ($1, now(), now() + interval '25 minutes')", [f.person.ka])).code, "42501");
    assert.equal((await q.fails("insert into public.calendar_events(owner_person_id, title, starts_at, ends_at) values ($1,'x', now(), now() + interval '1 hour')", [f.person.ka])).code, "42501");
  });
});

test("sanity: the service role (trusted backend only) bypasses RLS, proving the denials above are real", async () => {
  await asService(async q => {
    assert.equal((await q.rows("select 1 from public.tasks")).length, 3);
    assert.equal((await q.rows("select 1 from public.access_grants")).length, 4);
  });
});
