/**
 * Seeds synthetic fixtures into a LOCAL disposable DB (plain Postgres + shim, or `supabase start`).
 * Destroys existing rows in the FamilyOS tables. Refuses non-local hosts.
 */
import { assertLocalDisposable, makeClient } from "./lib-db.ts";
import * as f from "../tests/db/fixtures.ts";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(2); }
const u = assertLocalDisposable(url);
const dbName = u.pathname.replace(/^\//, "");
if (!(dbName.endsWith("_test") || u.port === "54322")) {
  console.error(`Refusing to seed database "${dbName}": name must end in _test (or be the Supabase local DB on port 54322).`);
  process.exit(2);
}

const c = makeClient(url);
await c.connect();
const q = (sql: string, params: unknown[] = []) => c.query(sql, params);
try {
  await q("begin");
  await q(`truncate public.audit_events, public.ai_proposals, public.sync_runs, public.external_resource_mappings,
    public.integration_connections, public.calendar_events, public.routines, public.study_sessions, public.project_steps,
    public.projects, public.exams, public.task_completions, public.tasks, public.subjects, public.school_enrollments,
    public.schools, public.access_grants, public.child_guardianships, public.household_memberships,
    public.family_memberships, public.households, public.families, public.users, public.persons cascade`);
  await q("delete from auth.users where email like '%@familyos.test'");

  const names: Record<string, string> = {
    ad1: "Test Adult 1", ad2: "Test Adult 2", ka: "Test Child A", kb: "Test Child B", pw: "Test Patchwork Guardian",
    grSports: "Test Grantee Sports", grTasksW: "Test Grantee Tasks Write", grExpired: "Test Grantee Expired",
    grRevoked: "Test Grantee Revoked", outsider: "Test Outsider", c1: "Test Other-Family Adult", u1: "Test Unverified Guardian", kc: "Test Child C"
  };
  for (const [k, pid] of Object.entries(f.person)) await q("insert into public.persons(id, display_name) values ($1,$2)", [pid, names[k]]);
  for (const k of f.actorsWithPerson) {
    await q("insert into auth.users(id, email) values ($1,$2)", [f.auth[k], `${k}@familyos.test`]);
    await q("insert into public.users(auth_user_id, person_id) values ($1,$2)", [f.auth[k], f.person[k]]);
  }
  await q("insert into auth.users(id, email) values ($1,$2)", [f.auth.orphan, "orphan@familyos.test"]);

  await q("insert into public.families(id, name) values ($1,'Test Family 1'), ($2,'Test Family 2')", [f.family.f1, f.family.f2]);
  await q("insert into public.households(id, family_id, name) values ($1,$4,'H1'), ($2,$4,'H2 (patchwork)'), ($3,$5,'H3')",
    [f.household.h1, f.household.h2, f.household.h3, f.family.f1, f.family.f2]);
  for (const k of ["ad1", "ad2", "ka", "kb"] as const) {
    await q("insert into public.family_memberships values ($1,$2,$3)", [f.family.f1, f.person[k], k.startsWith("k") ? "child" : "adult"]);
    await q("insert into public.household_memberships values ($1,$2)", [f.household.h1, f.person[k]]);
  }
  // Same household as the family, but no guardianship/grant: household membership must grant nothing.
  await q("insert into public.household_memberships values ($1,$2)", [f.household.h1, f.person.outsider]);
  await q("insert into public.household_memberships values ($1,$2), ($1,$3)", [f.household.h2, f.person.pw, f.person.ka]);
  await q("insert into public.family_memberships values ($1,$2,'adult'), ($1,$3,'child'), ($1,$4,'adult')",
    [f.family.f2, f.person.c1, f.person.kc, f.person.u1]);

  const verified = "2026-01-01T00:00:00Z";
  for (const g of ["ad1", "ad2"] as const) for (const c2 of ["ka", "kb"] as const)
    await q("insert into public.child_guardianships(child_person_id, guardian_person_id, verified_at) values ($1,$2,$3)", [f.person[c2], f.person[g], verified]);
  await q("insert into public.child_guardianships(child_person_id, guardian_person_id, verified_at) values ($1,$2,$3)", [f.person.ka, f.person.pw, verified]);
  await q("insert into public.child_guardianships(child_person_id, guardian_person_id, verified_at) values ($1,$2,$3)", [f.person.kc, f.person.c1, verified]);
  await q("insert into public.child_guardianships(child_person_id, guardian_person_id, verified_at) values ($1,$2,null)", [f.person.kc, f.person.u1]);

  const grants: [string, keyof typeof f.person, string, string, string | null, string | null][] = [
    [f.grant.sports, "grSports", "sports", "read", null, null],
    [f.grant.tasksW, "grTasksW", "tasks", "write", null, null],
    [f.grant.expired, "grExpired", "tasks", "read", "2026-01-02T00:00:00Z", null],
    [f.grant.revoked, "grRevoked", "tasks", "read", null, "2026-01-03T00:00:00Z"]
  ];
  for (const [gid, who, scope, cap, exp, rev] of grants)
    await q(`insert into public.access_grants(id, subject_person_id, grantee_person_id, scope, capability, expires_at, revoked_at, granted_by)
      values ($1,$2,$3,$4,$5,$6,$7,$8)`, [gid, f.person.ka, f.person[who], scope, cap, exp, rev, f.person.ad1]);

  await q("insert into public.schools(id, name) values ($1,'Test School 1'), ($2,'Test School 2')", [f.school.s1, f.school.s2]);
  await q("insert into public.school_enrollments(id, child_person_id, school_id, class_label) values ($1,$2,$3,'5a'), ($4,$5,$6,'5b')",
    [f.enrollment.ka, f.person.ka, f.school.s1, f.enrollment.kb, f.person.kb, f.school.s2]);
  await q("insert into public.subjects(id, enrollment_id, name) values ($1,$2,'Math'), ($3,$4,'English')", [f.subject.ka, f.enrollment.ka, f.subject.kb, f.enrollment.kb]);
  for (const [k, tid] of Object.entries(f.task)) await q("insert into public.tasks(id, child_person_id, title, due_at) values ($1,$2,$3,'2026-12-01T10:00:00Z')", [tid, f.person[k as "ka"], `Task ${k}`]);
  for (const [k, eid] of Object.entries(f.exam)) await q("insert into public.exams(id, child_person_id, title, exam_on) values ($1,$2,$3,'2026-12-10')", [eid, f.person[k as "ka"], `Exam ${k}`]);
  for (const k of ["ka", "kb"] as const) {
    await q("insert into public.projects(id, child_person_id, title, due_on) values ($1,$2,$3,'2026-12-20')", [f.project[k], f.person[k], `Project ${k}`]);
    await q("insert into public.project_steps(id, project_id, title, position) values ($1,$2,'Step',0)", [f.step[k], f.project[k]]);
    await q("insert into public.study_sessions(id, child_person_id, starts_at, ends_at) values ($1,$2,'2026-12-02T15:00:00Z','2026-12-02T15:25:00Z')", [f.studySession[k], f.person[k]]);
  }
  for (const k of ["ka", "kb", "kc"] as const)
    await q("insert into public.ai_proposals(id, child_person_id, proposed_by_person_id, payload) values ($1,$2,$3,$4::jsonb)",
      [f.proposal[k], f.person[k], null, JSON.stringify({ steps: [{ title: "Synthetic step", estimatedMinutes: 25 }] })]);
  await q("insert into public.calendar_events(id, owner_person_id, title, starts_at, ends_at, visibility) values ($1,$2,'Adult 1 private','2026-12-03T10:00:00Z','2026-12-03T11:00:00Z','private')", [f.event.ad1Private, f.person.ad1]);
  await q("insert into public.calendar_events(id, owner_person_id, title, starts_at, ends_at, visibility) values ($1,$2,'Adult 2 private','2026-12-03T10:00:00Z','2026-12-03T11:00:00Z','private')", [f.event.ad2Private, f.person.ad2]);
  await q("insert into public.calendar_events(id, owner_person_id, title, starts_at, ends_at, visibility) values ($1,$2,'Child A shared','2026-12-03T10:00:00Z','2026-12-03T11:00:00Z','shared_child')", [f.event.kaShared, f.person.ka]);
  await q("insert into public.calendar_events(id, owner_person_id, title, starts_at, ends_at, visibility) values ($1,$2,'Child A private','2026-12-03T10:00:00Z','2026-12-03T11:00:00Z','private')", [f.event.kaPrivate, f.person.ka]);
  await q("insert into public.integration_connections(id, owner_person_id, provider) values ($1,$2,'google_calendar')", [f.connection.ad1, f.person.ad1]);
  await q("commit");
  console.log("seeded synthetic fixtures");
} catch (e) {
  await q("rollback").catch(() => undefined);
  console.error(e);
  process.exitCode = 1;
} finally {
  await c.end();
}
