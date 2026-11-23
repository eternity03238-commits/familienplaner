import type { Capability, Scope } from "../../domain/src/index.ts";

export interface AuthenticatedActor { authUserId: string; personId: string }

/** Implementations MUST check database identity and record-specific permissions. */
export interface Authorizer {
  requireSignedIn(): Promise<AuthenticatedActor>;
  requireChildScope(actor: AuthenticatedActor, childPersonId: string, scope: Scope, capability: Capability): Promise<void>;
}

/** 401: no verified session. Deliberately carries no detail about why. */
export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor() { super("Not signed in"); this.name = "UnauthenticatedError"; }
}
/** 403: identical for "no such child", "not your child" and "scope not granted" (no IDOR/BOLA oracle). */
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() { super("Forbidden"); this.name = "ForbiddenError"; }
}

/**
 * Ports an application adapter must provide. The Supabase-backed adapter is Sprint 1 work; this skeleton
 * fixes the fail-closed contract without any production account or network access.
 */
export interface AuthorizerPorts {
  /** Must validate the session server-side (e.g. `supabase.auth.getUser()`); never trust an unverified cookie or JWT payload. */
  verifiedAuthUserId(): Promise<string | null>;
  /** Maps the auth account to exactly one person (ADR-0002); null when the account has no person. */
  personIdForAuthUser(authUserId: string): Promise<string | null>;
  /** Object- and scope-level decision, backed by the same rules as DB RLS (`app_private.can_access_child`). */
  mayAccessChild(actorPersonId: string, childPersonId: string, scope: Scope, capability: Capability): Promise<boolean>;
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.length > 0;

export function createAuthorizer(ports: AuthorizerPorts): Authorizer {
  return {
    async requireSignedIn() {
      let authUserId: string | null;
      let personId: string | null;
      try {
        authUserId = await ports.verifiedAuthUserId();
        personId = nonEmpty(authUserId) ? await ports.personIdForAuthUser(authUserId) : null;
      } catch {
        throw new UnauthenticatedError(); // fail closed, never leak backend errors
      }
      if (!nonEmpty(authUserId) || !nonEmpty(personId)) throw new UnauthenticatedError();
      return { authUserId, personId };
    },
    async requireChildScope(actor, childPersonId, scope, capability) {
      if (!nonEmpty(actor?.personId) || !nonEmpty(childPersonId)) throw new ForbiddenError();
      let allowed: boolean;
      try {
        allowed = await ports.mayAccessChild(actor.personId, childPersonId, scope, capability);
      } catch {
        throw new ForbiddenError();
      }
      if (allowed !== true) throw new ForbiddenError();
    }
  };
}
