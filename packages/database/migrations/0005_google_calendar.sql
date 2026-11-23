-- 0005_google_calendar.sql — Google Calendar (read-only) per parent via OAuth (ADR-0008).
--
-- * Refresh tokens live encrypted in Supabase Vault; the table only keeps the vault secret id.
-- * All writes and every token access go through srv_* functions that ONLY service_role (the Vercel server)
--   may execute. Browsers never see tokens, and end users cannot call these functions.
-- * Imported events belong to the connecting parent (visibility 'private' unless the parent shares later);
--   provenance per event via external_resource_mappings (rule 7), sync state per connection (no silent fail).
-- Rollback: packages/database/rollback/0005_google_calendar.down.sql

alter table public.integration_connections
  add column last_synced_at timestamptz,
  add column last_error text,
  add column updated_at timestamptz not null default now(),
  add column revoked_at timestamptz;
create unique index integration_connections_one_active
  on public.integration_connections(owner_person_id, provider, external_account_ref) where revoked_at is null;

alter table public.calendar_events add column location text;
alter table public.calendar_events add constraint calendar_events_location_len check (location is null or char_length(location) <= 500);
alter table public.calendar_events add constraint calendar_events_title_len check (char_length(title) <= 500);

-- Short-lived OAuth state (CSRF) + PKCE verifier. Single use, 10 minutes, state only as hash.
create table public.oauth_states (
  state_hash bytea primary key,
  person_id uuid not null references public.persons(id) on delete cascade,
  provider text not null,
  code_verifier text not null,
  return_to text not null default '/command/verbindungen',
  expires_at timestamptz not null
);
alter table public.oauth_states enable row level security;
alter table public.oauth_states force row level security;
revoke all on table public.oauth_states from anon, authenticated;

-- Parents see their own connections (no token column content is ever a token: only a vault id).
grant select (id, owner_person_id, provider, external_account_ref, status, created_at, last_synced_at, last_error, updated_at, revoked_at)
  on public.integration_connections to authenticated;
drop policy if exists integration_owner_read on public.integration_connections;
create policy integration_owner_read on public.integration_connections for select to authenticated
  using (owner_person_id = app_private.current_person_id());

-- ---------------------------------------------------------------- server-only functions
create or replace function public.srv_parent_person(p_auth_user uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.person_id from public.users u where u.auth_user_id = p_auth_user;
$$;

create or replace function public.srv_create_oauth_state(p_person uuid, p_provider text, p_state text, p_verifier text, p_return_to text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_return_to !~ '^/[a-z0-9/_-]*$' then raise exception 'invalid return path' using errcode = '22023'; end if;
  delete from public.oauth_states where expires_at < now();
  insert into public.oauth_states(state_hash, person_id, provider, code_verifier, return_to, expires_at)
    values (app_private.sha256(p_state), p_person, p_provider, p_verifier, p_return_to, now() + interval '10 minutes');
end;
$$;

create or replace function public.srv_consume_oauth_state(p_state text)
returns table (person_id uuid, provider text, code_verifier text, return_to text)
language plpgsql volatile security definer set search_path = '' as $$
begin
  return query
    delete from public.oauth_states s
    where s.state_hash = app_private.sha256(coalesce(p_state, '')) and s.expires_at > now()
    returning s.person_id, s.provider, s.code_verifier, s.return_to;
end;
$$;

-- Creates or refreshes the connection for (person, Google account) and stores the refresh token in Vault.
create or replace function public.srv_save_google_connection(p_person uuid, p_account text, p_refresh_token text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare con public.integration_connections; secret uuid;
begin
  if coalesce(p_refresh_token, '') = '' then raise exception 'missing refresh token' using errcode = '22023'; end if;
  select * into con from public.integration_connections
    where owner_person_id = p_person and provider = 'google_calendar' and external_account_ref = p_account and revoked_at is null for update;
  if con.id is null then
    secret := vault.create_secret(p_refresh_token, null, 'FamilyOS Google refresh token');
    insert into public.integration_connections(owner_person_id, provider, external_account_ref, status, encrypted_token_reference)
      values (p_person, 'google_calendar', p_account, 'connected', secret::text) returning * into con;
  else
    perform vault.update_secret(con.encrypted_token_reference::uuid, p_refresh_token);
    update public.integration_connections set status = 'connected', last_error = null, updated_at = now() where id = con.id;
  end if;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (p_person, 'integration.connected', 'integration_connection', con.id);
  return con.id;
end;
$$;

-- Active Google connections of a person incl. the decrypted refresh token (server use only).
create or replace function public.srv_google_connections(p_person uuid)
returns table (connection_id uuid, account text, refresh_token text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.external_account_ref, s.decrypted_secret
  from public.integration_connections c
  join vault.decrypted_secrets s on s.id = c.encrypted_token_reference::uuid
  where c.owner_person_id = p_person and c.provider = 'google_calendar' and c.revoked_at is null;
$$;

-- Replaces the imported events of one connection inside [p_from, p_to) with p_events (idempotent).
-- p_events: [{external_id, version, title, location, all_day, event_date, starts_at, ends_at}]
create or replace function public.srv_apply_google_events(p_connection uuid, p_from timestamptz, p_to timestamptz, p_events jsonb)
returns integer language plpgsql volatile security definer set search_path = '' as $$
declare con public.integration_connections; e jsonb; mapped uuid; n integer := 0; seen text[] := '{}';
begin
  select * into con from public.integration_connections where id = p_connection and revoked_at is null for update;
  if con.id is null then raise exception 'unknown connection' using errcode = '22023'; end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 2000 then raise exception 'invalid events' using errcode = '22023'; end if;
  for e in select * from jsonb_array_elements(p_events) loop
    seen := seen || (e->>'external_id');
    select internal_id into mapped from public.external_resource_mappings
      where connection_id = con.id and resource_kind = 'calendar_event' and external_id = e->>'external_id';
    if mapped is null then
      insert into public.calendar_events(owner_person_id, title, location, all_day, event_date, starts_at, ends_at, visibility, source)
        values (con.owner_person_id, left(e->>'title', 500), left(nullif(e->>'location', ''), 500), (e->>'all_day')::boolean,
                (e->>'event_date')::date, (e->>'starts_at')::timestamptz, (e->>'ends_at')::timestamptz, 'private', 'google_calendar')
        returning id into mapped;
      insert into public.external_resource_mappings(connection_id, resource_kind, external_id, internal_id, external_version)
        values (con.id, 'calendar_event', e->>'external_id', mapped, e->>'version');
    else
      update public.calendar_events set title = left(e->>'title', 500), location = left(nullif(e->>'location', ''), 500),
        all_day = (e->>'all_day')::boolean, event_date = (e->>'event_date')::date,
        starts_at = (e->>'starts_at')::timestamptz, ends_at = (e->>'ends_at')::timestamptz
        where id = mapped;
      update public.external_resource_mappings set external_version = e->>'version', last_seen_at = now()
        where connection_id = con.id and resource_kind = 'calendar_event' and external_id = e->>'external_id';
    end if;
    n := n + 1;
  end loop;
  -- Events of this connection in the window that Google no longer returns were deleted or moved out.
  with gone as (
    delete from public.external_resource_mappings m
    using public.calendar_events ev
    where m.connection_id = con.id and m.resource_kind = 'calendar_event' and m.internal_id = ev.id
      and not (m.external_id = any(seen))
      and coalesce(ev.starts_at, ev.event_date::timestamptz) >= p_from and coalesce(ev.starts_at, ev.event_date::timestamptz) < p_to
    returning m.internal_id
  )
  delete from public.calendar_events where id in (select internal_id from gone);
  insert into public.sync_runs(connection_id, outcome, ended_at) values (con.id, 'ok', now());
  update public.integration_connections set last_synced_at = now(), last_error = null, status = 'connected', updated_at = now() where id = con.id;
  return n;
end;
$$;

create or replace function public.srv_mark_sync_failed(p_connection uuid, p_error text, p_reauth boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  insert into public.sync_runs(connection_id, outcome, ended_at) values (p_connection, 'error', now());
  update public.integration_connections set last_error = left(p_error, 200),
    status = case when p_reauth then 'reauth_required' else 'error' end, updated_at = now()
    where id = p_connection;
end;
$$;

-- Disconnect: returns the refresh token once (for revocation at Google), then deletes it, the imported
-- events and their mappings. Only the owner may disconnect.
create or replace function public.srv_disconnect_google(p_person uuid, p_connection uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare con public.integration_connections; token text;
begin
  select * into con from public.integration_connections where id = p_connection and owner_person_id = p_person and revoked_at is null for update;
  if con.id is null then raise exception 'Forbidden' using errcode = '42501'; end if;
  select decrypted_secret into token from vault.decrypted_secrets where id = con.encrypted_token_reference::uuid;
  delete from public.calendar_events where id in
    (select internal_id from public.external_resource_mappings where connection_id = con.id and resource_kind = 'calendar_event');
  delete from public.external_resource_mappings where connection_id = con.id;
  delete from vault.secrets where id = con.encrypted_token_reference::uuid;
  update public.integration_connections set revoked_at = now(), status = 'disabled', encrypted_token_reference = null, updated_at = now()
    where id = con.id;
  insert into public.audit_events(actor_person_id, action, resource_type, resource_id)
    values (p_person, 'integration.disconnected', 'integration_connection', con.id);
  return token;
end;
$$;

do $$ declare f text; begin
  foreach f in array array[
    'public.srv_parent_person(uuid)', 'public.srv_create_oauth_state(uuid, text, text, text, text)',
    'public.srv_consume_oauth_state(text)', 'public.srv_save_google_connection(uuid, text, text)',
    'public.srv_google_connections(uuid)', 'public.srv_apply_google_events(uuid, timestamptz, timestamptz, jsonb)',
    'public.srv_mark_sync_failed(uuid, text, boolean)', 'public.srv_disconnect_google(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
