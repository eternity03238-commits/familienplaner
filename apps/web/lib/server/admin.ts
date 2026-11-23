import "server-only";
/**
 * Supabase client with the secret key (service_role). Server routes only; never imported by client code
 * (`server-only` makes a client import a build error). Only srv_* functions are called with it.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ServerEnv } from "./env.ts";

export function adminClient(env: ServerEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseSecret, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Resolves the signed-in parent from the `Authorization: Bearer <access token>` header (no cookies → no CSRF). */
export async function parentFromRequest(req: Request, admin: SupabaseClient): Promise<{ person: string; email: string } | null> {
  const token = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: person, error: e2 } = await admin.rpc("srv_parent_person", { p_auth_user: data.user.id });
  if (e2 || typeof person !== "string") return null;
  return { person, email: data.user.email ?? "" };
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
