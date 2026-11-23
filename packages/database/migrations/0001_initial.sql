-- FamilyOS Sprint 0. Run on a disposable/local Supabase DB first.
-- Extensions live in `extensions`, never in `public` (public functions would be exposed as RPC by the Supabase API).
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists app_private;

create type public.family_role as enum ('adult', 'child', 'guardian', 'guest');
create type public.access_scope as enum ('school', 'tasks', 'sports', 'exams', 'projects', 'schedule');
create type public.access_capability as enum ('read', 'write');
create type public.task_status as enum ('open', 'done', 'cancelled');
create type public.proposal_status as enum ('pending', 'approved', 'rejected');

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 120),
  birth_date date, created_at timestamptz not null default now()
);
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  person_id uuid not null unique references public.persons(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null, timezone text not null default 'Europe/Berlin',
  created_at timestamptz not null default now()
);
create table public.households (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete restrict,
  name text not null, created_at timestamptz not null default now()
);
create table public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  role public.family_role not null,
  primary key (family_id, person_id)
);
create table public.household_memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  primary key (household_id, person_id)
);
create table public.child_guardianships (
  child_person_id uuid not null references public.persons(id) on delete cascade,
  guardian_person_id uuid not null references public.persons(id) on delete cascade,
  relationship text not null default 'guardian',
  verified_at timestamptz,
  primary key (child_person_id, guardian_person_id),
  check (child_person_id <> guardian_person_id)
);
create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  subject_person_id uuid not null references public.persons(id) on delete cascade,
  grantee_person_id uuid not null references public.persons(id) on delete cascade,
  scope public.access_scope not null, capability public.access_capability not null,
  expires_at timestamptz, revoked_at timestamptz,
  granted_by uuid not null references public.persons(id),
  created_at timestamptz not null default now(),
  check (subject_person_id <> grantee_person_id)
);
create index access_grants_target_idx on public.access_grants(subject_person_id, grantee_person_id, scope) where revoked_at is null;

create table public.schools (
  id uuid primary key default gen_random_uuid(), name text not null,
  timezone text not null default 'Europe/Berlin', provider_hint text
);
create table public.school_enrollments (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  school_id uuid not null references public.schools(id), class_label text not null,
  active_from date, active_until date
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.school_enrollments(id) on delete cascade,
  name text not null, unique(enrollment_id, name)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  subject_id uuid references public.subjects(id), title text not null,
  details text, task_kind text not null default 'homework',
  due_at timestamptz, due_on date,
  status public.task_status not null default 'open',
  provenance text not null default 'manual',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (char_length(title) between 1 and 500)
);
create index tasks_child_due_idx on public.tasks(child_person_id, due_at);
create table public.task_completions (
  task_id uuid not null references public.tasks(id) on delete cascade,
  person_id uuid not null references public.persons(id),
  completed_at timestamptz not null default now(),
  primary key(task_id, person_id)
);
create table public.exams (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  subject_id uuid references public.subjects(id), title text not null,
  exam_on date not null, topics jsonb not null default '[]'::jsonb,
  provenance text not null default 'manual', created_at timestamptz not null default now()
);
create index exams_child_date_idx on public.exams(child_person_id, exam_on);
create table public.projects (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  title text not null, due_on date not null, status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.project_steps (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  title text not null, position integer not null check(position >= 0), estimate_minutes int check (estimate_minutes between 0 and 1440),
  status public.task_status not null default 'open', unique (project_id, position)
);
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  exam_id uuid references public.exams(id), project_id uuid references public.projects(id),
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'planned', approved_at timestamptz,
  check (ends_at > starts_at)
);
create index study_sessions_child_start_idx on public.study_sessions(child_person_id, starts_at);
create table public.routines (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.persons(id),
  title text not null, recurrence_rule text not null, active boolean not null default true
);
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), owner_person_id uuid not null references public.persons(id),
  family_id uuid references public.families(id), title text not null,
  starts_at timestamptz, ends_at timestamptz, all_day boolean not null default false,
  event_date date, visibility text not null default 'private', source text not null default 'manual',
  check ((all_day = true and event_date is not null) or (all_day = false and starts_at is not null and ends_at > starts_at))
);
create index calendar_owner_start_idx on public.calendar_events(owner_person_id, starts_at);
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(), owner_person_id uuid not null references public.persons(id),
  provider text not null, external_account_ref text, status text not null default 'disabled',
  encrypted_token_reference text, created_at timestamptz not null default now()
);
create table public.external_resource_mappings (
  id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.integration_connections(id) on delete cascade,
  resource_kind text not null, external_id text not null, internal_id uuid not null,
  external_version text, last_seen_at timestamptz not null default now(),
  unique (connection_id, resource_kind, external_id)
);
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.integration_connections(id),
  cursor text, outcome text not null, started_at timestamptz not null default now(), ended_at timestamptz
);
create table public.ai_proposals (
  id uuid primary key default gen_random_uuid(), child_person_id uuid not null references public.persons(id),
  proposed_by_person_id uuid references public.persons(id),
  payload jsonb not null, status public.proposal_status not null default 'pending',
  approved_by_person_id uuid references public.persons(id), approved_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_person_id uuid references public.persons(id),
  action text not null, resource_type text not null, resource_id uuid,
  occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
