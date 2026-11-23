import type { AccessGrant, Capability, GuardianRelationship, Scope, UUID } from "./index.ts";

/** Pure policy simulation for unit tests. DB RLS is authoritative in production. */
export function mayAccessChild(input: {
  actorPersonId: UUID | null;
  childPersonId: UUID;
  scope: Scope;
  capability: Capability;
  guardianships: readonly GuardianRelationship[];
  grants: readonly AccessGrant[];
  now?: Date;
}): boolean {
  const { actorPersonId, childPersonId, scope, capability, guardianships, grants } = input;
  if (!actorPersonId) return false;
  // Child self-service: scoped reading only. Completion is separately authorized server-side.
  if (actorPersonId === childPersonId) return capability === "read";
  if (guardianships.some(g => g.childId === childPersonId && g.guardianId === actorPersonId && g.verified)) return true;
  const now = input.now ?? new Date();
  return grants.some(g => g.subjectChildId === childPersonId && g.granteePersonId === actorPersonId && g.scope === scope &&
    (g.capability === "write" || capability === "read") && g.revokedAt == null &&
    (g.expiresAt == null || new Date(g.expiresAt).getTime() > now.getTime()));
}
