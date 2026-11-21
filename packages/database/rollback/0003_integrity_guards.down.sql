-- Rollback for 0003_integrity_guards.sql (manual; never run against data you cannot lose).
drop trigger if exists access_grants_guard on public.access_grants;
drop trigger if exists tasks_actor_guard on public.tasks;
drop trigger if exists ai_proposals_guard on public.ai_proposals;
drop function if exists app_private.access_grants_guard();
drop function if exists app_private.tasks_actor_guard();
drop function if exists app_private.ai_proposals_guard();
alter table public.ai_proposals drop constraint if exists ai_proposals_status_consistency;
drop function if exists app_private.is_verified_guardian(uuid, uuid);
-- The explicit REVOKEs from `anon` on the 0002 helpers are intentionally kept (they only tighten access).
