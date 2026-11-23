/** POST /api/google/sync — refreshes the signed-in parent's Google calendars into FamilyOS. */
import { serverEnv } from "../../../../lib/server/env.ts";
import { adminClient, json, parentFromRequest } from "../../../../lib/server/admin.ts";
import { syncConnection } from "../../../../lib/server/sync.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const env = serverEnv();
  if (!env?.google) return json(503, { error: "Google ist auf dem Server noch nicht eingerichtet." });
  const admin = adminClient(env);
  const parent = await parentFromRequest(req, admin);
  if (!parent) return json(401, { error: "Bitte neu anmelden." });
  const { data, error } = await admin.rpc("srv_google_connections", { p_person: parent.person });
  if (error) return json(500, { error: "Das hat nicht geklappt. Bitte noch einmal versuchen." });
  const results = [];
  for (const c of (data ?? []) as { connection_id: string; account: string; refresh_token: string }[]) results.push(await syncConnection(admin, env.google, c));
  return json(200, { results });
}
