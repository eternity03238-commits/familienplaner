-- Rollback of 0004_family_onboarding.sql: removes onboarding RPCs, invite/pairing/device tables and
-- restores the 0002 definitions of current_person_id(), can_access_child() and the calendar policy.
-- WARNING: drops child devices, open invites and pairing codes. Persons/families created via the RPCs stay.

do $$ declare f text; begin
  foreach f in array array[
    'public.my_family()', 'public.create_family(text, text)', 'public.add_child(uuid, text)',
    'public.rename_person(uuid, text)', 'public.rename_family(uuid, text)',
    'public.create_family_invite(uuid)', 'public.accept_family_invite(text, text)',
    'public.create_child_pairing_code(uuid)', 'public.revoke_child_device(uuid)',
    'app_private.redeem_child_pairing(text, uuid, text)', 'app_private.require_fresh_account()',
    'app_private.is_adult_member(uuid, uuid)', 'app_private.require_person()',
    'app_private.new_secret()', 'app_private.sha256(text)', 'app_private.clean_name(text)'
  ] loop
    execute format('drop function if exists %s', f);
  end loop;
end $$;

drop policy if exists calendar_owner_read on public.calendar_events;
drop policy if exists child_devices_guardian_read on public.child_devices;
drop function if exists app_private.is_my_child(uuid);
revoke usage on schema app_private from service_role;

drop table if exists public.child_devices;
drop table if exists public.child_pairing_codes;
drop table if exists public.family_invites;

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
create policy calendar_owner_read on public.calendar_events for select to authenticated
  using (owner_person_id = app_private.current_person_id() or
    (visibility = 'shared_child' and app_private.can_access_child(owner_person_id, 'schedule'::public.access_scope, 'read'::public.access_capability)));
