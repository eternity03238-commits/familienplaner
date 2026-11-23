-- 0003_integrity_guards.sql — Sprint 0 hardening (defense in depth below API/RPC code and RLS).
--
-- Why: RLS only constrains end-user sessions. Triggers and CHECK constraints fire for EVERY role
-- (including service_role used by trusted backend code and jobs), so a bug or a compromised server
-- path cannot silently bypass the rules that keep AI proposals separate from authorized changes
-- (ADR-0003), keep children from altering deadlines (CLAUDE.md rule 11) and keep Patchwork grants
-- (DATA_MODEL: access_grants) from being self-issued.
--
-- Rollback: packages/database/rollback/0003_integrity_guards.down.sql
-- Trigger functions are SECURITY DEFINER with a fixed search_path (CLAUDE.md rule 14) and are not
-- executable by any API role; they fire as part of the table operation.

-- Internal helper: is `p_person` a verified guardian of child `p_child`?
create or replace function app_private.is_verified_guardian(p_child uuid, p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_person is not null and exists (
    select 1 from public.child_guardianships cg
    where cg.child_person_id = p_child and cg.guardian_person_id = p_person and cg.verified_at is not null
  );
$$;
revoke all on function app_private.is_verified_guardian(uuid, uuid) from public, anon, authenticated;

-- Make the "no API role beyond authenticated" intent of 0002 explicit as well.
revoke all on function app_private.current_person_id() from anon;
revoke all on function app_private.can_access_child(uuid, public.access_scope, public.access_capability) from anon;

-- 1) AI proposals: pending -> approved|rejected exactly once, decided by a verified guardian.
--    approved_by_person_id / approved_at record the deciding guardian for BOTH decisions.
alter table public.ai_proposals add constraint ai_proposals_status_consistency check (
  (status = 'pending' and approved_by_person_id is null and approved_at is null)
  or (status in ('approved', 'rejected') and approved_by_person_id is not null and approved_at is not null)
);

create or replace function app_private.ai_proposals_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor uuid := app_private.current_person_id();
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.approved_by_person_id is not null or new.approved_at is not null then
      raise exception 'AI proposals must be created as pending' using errcode = '23514';
    end if;
    return new;
  end if;
  if old.status <> 'pending' then
    raise exception 'Decided AI proposals are immutable' using errcode = '23514';
  end if;
  if new.id is distinct from old.id or new.child_person_id is distinct from old.child_person_id
     or new.proposed_by_person_id is distinct from old.proposed_by_person_id
     or new.payload is distinct from old.payload or new.created_at is distinct from old.created_at then
    raise exception 'AI proposal payload and ownership are immutable' using errcode = '23514';
  end if;
  if new.status <> 'pending' then
    if not app_private.is_verified_guardian(new.child_person_id, new.approved_by_person_id) then
      raise exception 'Only a verified guardian of the child may decide an AI proposal' using errcode = '42501';
    end if;
    if auth.uid() is not null and new.approved_by_person_id is distinct from actor then
      raise exception 'An AI proposal can only be decided in the name of the signed-in guardian' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function app_private.ai_proposals_guard() from public, anon, authenticated;
create trigger ai_proposals_guard before insert or update on public.ai_proposals
  for each row execute function app_private.ai_proposals_guard();

-- 2) Tasks: a child may only tick off (open <-> done) their own tasks, never change deadlines,
--    title, ownership or cancel. Sessions without an end-user JWT (trusted backend) are not restricted here.
create or replace function app_private.tasks_actor_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor uuid;
begin
  if auth.uid() is null then return new; end if;
  actor := app_private.current_person_id();
  if actor is not null and actor = old.child_person_id and (
       new.status = 'cancelled'
       or (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at')
     ) then
    raise exception 'Children may only mark their own tasks open or done' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function app_private.tasks_actor_guard() from public, anon, authenticated;
create trigger tasks_actor_guard before update on public.tasks
  for each row execute function app_private.tasks_actor_guard();

-- 3) Access grants (Patchwork): issued only by a verified guardian of the child, never self-issued,
--    immutable except for revocation (audit trail); revocation is final.
create or replace function app_private.access_grants_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor uuid := app_private.current_person_id();
begin
  if tg_op = 'INSERT' then
    if not app_private.is_verified_guardian(new.subject_person_id, new.granted_by) then
      raise exception 'Grants can only be issued by a verified guardian of the child' using errcode = '42501';
    end if;
    if auth.uid() is not null and new.granted_by is distinct from actor then
      raise exception 'A grant can only be issued in the name of the signed-in guardian' using errcode = '42501';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - 'revoked_at') is distinct from (to_jsonb(old) - 'revoked_at') then
    raise exception 'Grants are immutable; revoke and issue a new grant' using errcode = '23514';
  end if;
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'Revocation of a grant is final' using errcode = '23514';
  end if;
  if auth.uid() is not null and not app_private.is_verified_guardian(old.subject_person_id, actor) then
    raise exception 'Only a verified guardian may revoke a grant' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function app_private.access_grants_guard() from public, anon, authenticated;
create trigger access_grants_guard before insert or update on public.access_grants
  for each row execute function app_private.access_grants_guard();
