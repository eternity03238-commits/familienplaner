-- Deny by default for API roles, then explicitly permit strictly required reads.
-- Sprint-0 baseline: no client-side direct writes to family data.
create or replace function app_private.current_person_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.person_id from public.users u where u.auth_user_id = auth.uid() limit 1;
$$;
create or replace function app_private.can_access_child(
  target_person uuid, requested_scope public.access_scope, requested_capability public.access_capability
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u
    where u.auth_user_id = auth.uid() and (
      (u.person_id = target_person and requested_capability = 'read'::public.access_capability)
      or exists (
        select 1 from public.child_guardianships cg
        where cg.child_person_id = target_person and cg.guardian_person_id = u.person_id and cg.verified_at is not null
      )
      or exists (
        select 1 from public.access_grants g
        where g.subject_person_id = target_person and g.grantee_person_id = u.person_id
          and g.scope = requested_scope
          and (g.capability = requested_capability or g.capability = 'write'::public.access_capability)
          and g.revoked_at is null and (g.expires_at is null or g.expires_at > now())
      )
    )
  );
$$;
-- Keep only the authenticated role able to invoke permission helpers.
revoke all on function app_private.current_person_id() from public;
revoke all on function app_private.can_access_child(uuid, public.access_scope, public.access_capability) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_person_id() to authenticated;
grant execute on function app_private.can_access_child(uuid, public.access_scope, public.access_capability) to authenticated;

-- Protect every exposed table (including tables with no read/write policies yet).
do $$ declare t text; begin
  foreach t in array array[
    'persons','users','families','households','family_memberships','household_memberships',
    'child_guardianships','access_grants','schools','school_enrollments','subjects',
    'tasks','task_completions','exams','projects','project_steps','study_sessions',
    'routines','calendar_events','integration_connections','external_resource_mappings',
    'sync_runs','ai_proposals','audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke all on table public.%I from authenticated', t);
  end loop;
end $$;
-- Only minimal tables are selectable in Sprint 0; no direct client writes.
grant select on public.persons, public.users, public.tasks, public.exams,
  public.projects, public.project_steps, public.study_sessions,
  public.calendar_events, public.ai_proposals to authenticated;
create policy user_self_read on public.users for select to authenticated
  using (auth_user_id = auth.uid());
create policy person_self_or_guardian_read on public.persons for select to authenticated
  using (id = app_private.current_person_id() or
         app_private.can_access_child(id, 'school'::public.access_scope, 'read'::public.access_capability));
create policy task_child_scope_read on public.tasks for select to authenticated
  using (app_private.can_access_child(child_person_id, 'tasks'::public.access_scope, 'read'::public.access_capability));
create policy exams_child_scope_read on public.exams for select to authenticated
  using (app_private.can_access_child(child_person_id, 'exams'::public.access_scope, 'read'::public.access_capability));
create policy projects_child_scope_read on public.projects for select to authenticated
  using (app_private.can_access_child(child_person_id, 'projects'::public.access_scope, 'read'::public.access_capability));
create policy project_steps_by_project on public.project_steps for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and
    app_private.can_access_child(p.child_person_id, 'projects'::public.access_scope, 'read'::public.access_capability)));
create policy sessions_by_child on public.study_sessions for select to authenticated
  using (app_private.can_access_child(child_person_id, 'schedule'::public.access_scope, 'read'::public.access_capability));
-- Calendar events require exact owner self or a scope grant. Household membership grants nothing.
create policy calendar_owner_read on public.calendar_events for select to authenticated
  using (owner_person_id = app_private.current_person_id() or
    (visibility = 'shared_child' and app_private.can_access_child(owner_person_id, 'schedule'::public.access_scope, 'read'::public.access_capability)));
create policy proposals_child_read on public.ai_proposals for select to authenticated
  using (app_private.can_access_child(child_person_id, 'projects'::public.access_scope, 'read'::public.access_capability));

-- No direct INSERT / UPDATE / DELETE for authenticated users until auditable API and RPC flows exist.
-- IMPORTANT: service_role bypasses RLS; never expose it to clients or AI agents.
