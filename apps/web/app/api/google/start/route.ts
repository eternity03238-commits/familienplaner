/** POST /api/google/start — signed-in parent asks for the Google consent URL (Bearer token, no cookies). */
import { serverEnv } from "../../../../lib/server/env.ts";
import { adminClient, json, parentFromRequest } from "../../../../lib/server/admin.ts";
import { authUrl, newSecret } from "../../../../lib/server/google.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const env = serverEnv();
  if (!env?.google) return json(503, { error: "Google ist auf dem Server noch nicht eingerichtet." });
  const admin = adminClient(env);
  const parent = await parentFromRequest(req, admin);
  if (!parent) return json(401, { error: "Bitte neu anmelden." });
  const state = newSecret(), verifier = newSecret();
  const { error } = await admin.rpc("srv_create_oauth_state", { p_person: parent.person, p_provider: "google_calendar", p_state: state, p_verifier: verifier, p_return_to: "/command/verbindungen" });
  if (error) return json(500, { error: "Das hat nicht geklappt. Bitte noch einmal versuchen." });
  return json(200, { url: authUrl(env.google, new URL(req.url).origin, state, verifier) });
}
