-- LOCAL TEST SHIM — NOT a migration, never applied to Supabase.
-- Recreates the minimal Supabase surface the FamilyOS migrations rely on, so the
-- migrations and RLS policies can be exercised on a plain PostgreSQL server
-- (e.g. CI service container) when the full Supabase stack (Docker + registries) is unavailable.
-- Mirrors Supabase semantics: roles anon/authenticated/service_role/authenticator,
-- auth.users, auth.uid()/auth.role()/auth.jwt() reading `request.jwt.claims`,
-- and default table privileges in `public` (which migration 0002 must revoke).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator noinherit login; end if;
end $$;
grant anon, authenticated, service_role to authenticator;

create schema if not exists auth;
create schema if not exists extensions;
create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  created_at timestamptz not null default now()
);
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (auth.jwt() ->> 'sub')), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true), (auth.jwt() ->> 'role'))
$$;
grant usage on schema auth, public, extensions to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant all on auth.users to service_role;

-- Supabase grants everything on new public objects to the API roles; RLS + 0002 narrow this down.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
