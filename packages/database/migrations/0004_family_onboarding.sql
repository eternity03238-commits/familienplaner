-- 0004_family_onboarding.sql — Sprint 1: Familie anlegen, Partner einladen, Kindergeräte koppeln (ADR-0007).
--
-- Clients still get NO direct INSERT/UPDATE/DELETE on family tables. Every write goes through a small
-- SECURITY DEFINER function with a fixed search_path (CLAUDE.md rule 14), explicit EXECUTE grants and an
-- audit entry. Secrets (invite tokens, pairing codes) are returned once and stored only as SHA-256.
--
-- Decisions encoded here (ADR-0007):
--   * Guardians see ALL calendar events of their children (no private child events in the MVP).
--   * Members of a family can see name and role of the other members via public.my_family().
--   * A child's device gets its own auth account, mapped to the child's person via child_devices.
--     Revoking the device removes access immediately (current_person_id() ignores revoked devices).
--   * MVP guardianship: the parent who adds a child, and every adult who joins the family by invite,
--     become guardians (verified_at = time of the in-app declaration). A legal proof of custody is
--     still open (sprint0/REPORT.md §5.5).
--
-- Rollback: packages/database/rollback/0004_family_onboarding.down.sql

-- ---------------------------------------------------------------- tables
create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references public.persons(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.persons(id),
  check ((used_at is null) = (used_by is null))
);
create table public.child_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  child_person_id uuid not null references public.persons(id) on delete cascade,
  code_hash bytea not null unique,
  created_by uuid not null references public.persons(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create table public.child_devices (
  id uuid primary key default gen_random_uuid(),
  child_person_id uuid not null references public.persons(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  label text not null default 'Gerät' check (char_length(label) between 1 and 60),
  created_by uuid not null references public.persons(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index child_devices_child_idx on public.child_devices(child_person_id) where revoked_at is null;

do $$ declare t text; begin
  foreach t in array array['family_invites', 'child_pairing_codes', 'child_devices'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- identity helpers
-- A session maps to a person either through public.users (parents) or an active child device.
create or replace function app_private.current_person_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select u.person_id from public.users u where u.auth_user_id = auth.uid() limit 1),
    (select d.child_person_id from public.child_devices d where d.auth_user_id = auth.uid() and d.revoked_at is null limit 1)
  );
$$;

create or replace function app_private.can_access_child(
  target_person uuid, requested_scope public.access_scope, requested_capability public.access_capability
) returns boolean
language sql stable security definer set search_path = '' as $$
  with me as (select app_private.current_person_id() as pid)
  select exists (
    select 1 from me where me.pid is not null and (
      (me.pid = target_person and requested_capability = 'read'::public.access_capability)
      or exists (
        select 1 from public.child_guardianships cg
        where cg.child_person_id = target_person and cg.guardian_person_id = me.pid and cg.verified_at is not null
      )
      or exists (
        select 1 from public.access_grants g
        where g.subject_person_id = target_person and g.grantee_person_id = me.pid
          and g.scope = requested_scope
          and (g.capability = requested_capability or g.capability = 'write'::public.access_capability)
          and g.revoked_at is null and (g.expires_at is null or g.expires_at > now())
      )
    )
  );
$$;

-- Is the signed-in person a verified guardian of `p_child`? (callable from RLS policies)
create or replace function app_private.is_my_child(p_child uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app_private.is_verified_guardian(p_child, app_private.current_person_id());
$$;
revoke all on function app_private.is_my_child(uuid) from public, anon;
grant execute on function app_private.is_my_child(uuid) to authenticated;

create or replace function app_private.clean_name(p_name text) returns text
language plpgsql immutable set search_path = '' as $$
declare v text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if char_length(v) < 1 or char_length(v) > 60 then
    raise exception 'Name must be 1 to 60 characters' using errcode = '22023';
  end if;
  return v;
end;
$$;
revoke all on function app_private.clean_name(text) from public, anon, authenticated;

create or replace function app_private.sha256(p_secret text) returns bytea
language sql immutable set search_path = '' as $$
  select extensions.digest(convert_to(p_secret, 'UTF8'), 'sha256');
$$;
revoke all on function app_private.sha256(text) from public, anon, authenticated;

create or replace function app_private.new_secret() returns text
language sql volatile set search_path = '' as $$
  select translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/', '-_');
$$;
revoke all on function app_private.new_secret() from public, anon, authenticated;

create or replace function app_private.require_person() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := app_private.current_person_id();
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  return me;
end;
$$;
revoke all on function app_private.require_person() from public, anon, authenticated;

create or replace function app_private.is_adult_member(p_family uuid, p_person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_memberships m
                 where m.family_id = p_family and m.person_id = p_person and m.role in ('adult', 'guardian'));
$$;
revoke all on function app_private.is_adult_member(uuid, uuid) from public, anon, authenticated;

-- Account must be new: no person yet and not a child device.
create or replace function app_private.require_fresh_account() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.users where auth_user_id = auth.uid())
     or exists (select 1 from public.child_devices where auth_user_id = auth.uid()) then
    raise exception 'Account already belongs to a family' using errcode = '23505';
  end if;
  return auth.uid();
end;
$$;
revoke all on function app_private.require_fresh_account() from public, anon, authenticated;

-- ---------------------------------------------------------------- read policies
-- Guardians see every event of their children; Patchwork grantees still need visibility = shared_child.
drop policy calendar_owner_read on public.calendar_events;
create policy calendar_owner_read on public.calendar_events for select to authenticated
  using (owner_person_id = app_private.current_person_id()
         or app_private.is_my_child(owner_person_id)
         or (visibility = 'shared_child' and app_private.can_access_child(owner_person_id, 'schedule'::public.access_scope, 'read'::public.access_capability)));

-- Parents can list (not change) the devices of their children.
grant select on public.child_devices to authenticated;
create policy child_devices_guardian_read on public.child_devices for select to authenticated
  using (app_private.is_my_child(child_person_id));

-- ---------------------------------------------------------------- family overview (read)
create or replace function public.my_family()
returns table (family_id uuid, family_name text, person_id uuid, display_name text, role public.family_role, is_me boolean)
language sql stable security definer set search_path = '' as $$
  select f.id, f.name, p.id, p.display_name, m.role, p.id = app_private.current_person_id()
  from public.family_memberships mine
  join public.families f on f.id = mine.family_id
  join public.family_memberships m on m.family_id = f.id
  join public.persons p on p.id = m.person_id
  where mine.person_id = app_private.current_person_id()
  order by (m.role = 'child'), p.display_name;
$$;

-- ---------------------------------------------------------------- onboarding writes
create or replace function public.create_family(p_family_name text, p_my_name text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := app_private.require_fresh_account(); me uuid; fam uuid; hh uuid;
begin
  insert into public.persons(display_name) values (app_private.clean_name(p_my_name)) returning id into me;
  insert into public.users(auth_user_id, person_id) values (uid, me);
  insert into public.families(name) values (app_private.clean_name(p_family_name)) returning id into fam;
  insert into public.households(family_id, name) values (fam, 'Zuhause') returning id into hh;
  insert into public.family_memberships(family_id, person_id, role) values (fam, me, 'adult');
  insert into public.household_memberships(household_id, person_id) values (hh, me);
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'family.created', 'family', fam);
  return fam;
end;
$$;

create or replace function public.add_child(p_family_id uuid, p_name text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person(); child uuid;
begin
  if not app_private.is_adult_member(p_family_id, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  insert into public.persons(display_name) values (app_private.clean_name(p_name)) returning id into child;
  insert into public.family_memberships(family_id, person_id, role) values (p_family_id, child, 'child');
  insert into public.household_memberships(household_id, person_id)
    select h.id, child from public.households h where h.family_id = p_family_id order by h.created_at limit 1;
  -- Every adult of the family becomes guardian (MVP: the family consists of the parents).
  insert into public.child_guardianships(child_person_id, guardian_person_id, relationship, verified_at)
    select child, m.person_id, 'parent_declared', now() from public.family_memberships m
    where m.family_id = p_family_id and m.role in ('adult', 'guardian');
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'child.added', 'person', child);
  return child;
end;
$$;

create or replace function public.rename_person(p_person uuid, p_name text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person();
begin
  if p_person is distinct from me and not app_private.is_verified_guardian(p_person, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.persons set display_name = app_private.clean_name(p_name) where id = p_person;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'person.renamed', 'person', p_person);
end;
$$;

create or replace function public.rename_family(p_family_id uuid, p_name text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person();
begin
  if not app_private.is_adult_member(p_family_id, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.families set name = app_private.clean_name(p_name) where id = p_family_id;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'family.renamed', 'family', p_family_id);
end;
$$;

-- ---------------------------------------------------------------- partner invite (7 days, single use)
create or replace function public.create_family_invite(p_family_id uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person(); secret text := app_private.new_secret();
begin
  if not app_private.is_adult_member(p_family_id, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  insert into public.family_invites(family_id, token_hash, created_by, expires_at)
    values (p_family_id, app_private.sha256(secret), me, now() + interval '7 days');
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'family.invite_created', 'family', p_family_id);
  return secret;
end;
$$;

create or replace function public.accept_family_invite(p_token text, p_my_name text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := app_private.require_fresh_account(); inv public.family_invites; me uuid;
begin
  select * into inv from public.family_invites
    where token_hash = app_private.sha256(coalesce(p_token, '')) for update;
  -- One generic error for unknown, used and expired invites (no oracle).
  if inv.id is null or inv.used_at is not null or inv.expires_at <= now() then
    raise exception 'Invite is not valid' using errcode = '22023';
  end if;
  insert into public.persons(display_name) values (app_private.clean_name(p_my_name)) returning id into me;
  insert into public.users(auth_user_id, person_id) values (uid, me);
  insert into public.family_memberships(family_id, person_id, role) values (inv.family_id, me, 'adult');
  insert into public.household_memberships(household_id, person_id)
    select h.id, me from public.households h where h.family_id = inv.family_id order by h.created_at limit 1;
  insert into public.child_guardianships(child_person_id, guardian_person_id, relationship, verified_at)
    select m.person_id, me, 'parent_declared', now() from public.family_memberships m
    where m.family_id = inv.family_id and m.role = 'child'
    on conflict do nothing;
  update public.family_invites set used_at = now(), used_by = me where id = inv.id;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'family.invite_accepted', 'family', inv.family_id);
  return inv.family_id;
end;
$$;

-- ---------------------------------------------------------------- child devices (10 min, single use)
create or replace function public.create_child_pairing_code(p_child uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person(); secret text := app_private.new_secret();
begin
  if not app_private.is_verified_guardian(p_child, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  -- Only the newest code of a child is valid.
  update public.child_pairing_codes set expires_at = now()
    where child_person_id = p_child and used_at is null and expires_at > now();
  insert into public.child_pairing_codes(child_person_id, code_hash, created_by, expires_at)
    values (p_child, app_private.sha256(secret), me, now() + interval '10 minutes');
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'child_device.code_created', 'person', p_child);
  return secret;
end;
$$;

-- Called ONLY by the trusted server route after it created a fresh auth account for the device.
create or replace function app_private.redeem_child_pairing(p_code text, p_device_auth_user uuid, p_label text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare c public.child_pairing_codes; dev uuid;
begin
  select * into c from public.child_pairing_codes
    where code_hash = app_private.sha256(coalesce(p_code, '')) for update;
  if c.id is null or c.used_at is not null or c.expires_at <= now() then
    raise exception 'Pairing code is not valid' using errcode = '22023';
  end if;
  if exists (select 1 from public.users where auth_user_id = p_device_auth_user)
     or exists (select 1 from public.child_devices where auth_user_id = p_device_auth_user) then
    raise exception 'Device account is already in use' using errcode = '23505';
  end if;
  insert into public.child_devices(child_person_id, auth_user_id, label, created_by)
    values (c.child_person_id, p_device_auth_user, app_private.clean_name(coalesce(nullif(p_label, ''), 'Gerät')), c.created_by)
    returning id into dev;
  update public.child_pairing_codes set used_at = now() where id = c.id;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (c.created_by, 'child_device.paired', 'child_device', dev);
  return c.child_person_id;
end;
$$;

create or replace function public.revoke_child_device(p_device uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := app_private.require_person(); child uuid;
begin
  select d.child_person_id into child from public.child_devices d where d.id = p_device;
  if child is null or not app_private.is_verified_guardian(child, me) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  update public.child_devices set revoked_at = coalesce(revoked_at, now()) where id = p_device;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (me, 'child_device.revoked', 'child_device', p_device);
end;
$$;

-- ---------------------------------------------------------------- explicit execute rights
do $$ declare f text; begin
  foreach f in array array[
    'public.my_family()', 'public.create_family(text, text)', 'public.add_child(uuid, text)',
    'public.rename_person(uuid, text)', 'public.rename_family(uuid, text)',
    'public.create_family_invite(uuid)', 'public.accept_family_invite(text, text)',
    'public.create_child_pairing_code(uuid)', 'public.revoke_child_device(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function app_private.redeem_child_pairing(text, uuid, text) from public, anon, authenticated;
grant usage on schema app_private to service_role;
grant execute on function app_private.redeem_child_pairing(text, uuid, text) to service_role;
