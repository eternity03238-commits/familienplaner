-- Rollback of 0005_google_calendar.sql. WARNING: deletes imported Google events, their mappings and the
-- stored refresh tokens (Vault). Revoke the grants at Google separately (myaccount.google.com/permissions).
do $$ declare f text; begin
  foreach f in array array[
    'public.srv_parent_person(uuid)', 'public.srv_create_oauth_state(uuid, text, text, text, text)',
    'public.srv_consume_oauth_state(text)', 'public.srv_save_google_connection(uuid, text, text)',
    'public.srv_google_connections(uuid)', 'public.srv_apply_google_events(uuid, timestamptz, timestamptz, jsonb)',
    'public.srv_mark_sync_failed(uuid, text, boolean)', 'public.srv_disconnect_google(uuid, uuid)'
  ] loop
    execute format('drop function if exists %s', f);
  end loop;
end $$;
delete from vault.secrets where id in (select encrypted_token_reference::uuid from public.integration_connections where provider = 'google_calendar' and encrypted_token_reference is not null);
delete from public.calendar_events where id in (select internal_id from public.external_resource_mappings m join public.integration_connections c on c.id = m.connection_id where c.provider = 'google_calendar');
delete from public.sync_runs where connection_id in (select id from public.integration_connections where provider = 'google_calendar');
delete from public.integration_connections where provider = 'google_calendar';
drop policy if exists integration_owner_read on public.integration_connections;
revoke select on public.integration_connections from authenticated;
drop table if exists public.oauth_states;
alter table public.calendar_events drop constraint if exists calendar_events_title_len;
alter table public.calendar_events drop constraint if exists calendar_events_location_len;
alter table public.calendar_events drop column if exists location;
drop index if exists public.integration_connections_one_active;
alter table public.integration_connections drop column if exists revoked_at, drop column if exists updated_at,
  drop column if exists last_error, drop column if exists last_synced_at;
