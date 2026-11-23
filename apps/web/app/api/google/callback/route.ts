/** GET /api/google/callback — Google redirects here. The one-time state binds the request to the parent. */
import { serverEnv } from "../../../../lib/server/env.ts";
import { adminClient } from "../../../../lib/server/admin.ts";
import { exchangeCode, GoogleError, revoke } from "../../../../lib/server/google.ts";
import { syncConnection } from "../../../../lib/server/sync.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const back = (origin: string, path: string, result: string) =>
  new Response(null, { status: 303, headers: { location: `${origin}${path}?google=${result}`, "cache-control": "no-store", "referrer-policy": "no-referrer" } });

export async function GET(req: Request) {
  const url = new URL(req.url), origin = url.origin;
  const env = serverEnv();
  if (!env?.google) return back(origin, "/command/verbindungen", "nicht-eingerichtet");
  const admin = adminClient(env);
  const { data } = await admin.rpc("srv_consume_oauth_state", { p_state: url.searchParams.get("state") ?? "" });
  const st = Array.isArray(data) ? data[0] as { person_id: string; code_verifier: string; return_to: string } | undefined : undefined;
  if (!st) return back(origin, "/command/verbindungen", "abgelaufen");
  if (url.searchParams.get("error") || !url.searchParams.get("code")) return back(origin, st.return_to, "abgebrochen");
  try {
    const t = await exchangeCode(env.google, origin, url.searchParams.get("code")!, st.code_verifier);
    const { data: id, error } = await admin.rpc("srv_save_google_connection", { p_person: st.person_id, p_account: t.email, p_refresh_token: t.refreshToken });
    if (error || typeof id !== "string") { await revoke(t.refreshToken); return back(origin, st.return_to, "fehler"); }
    const first = await syncConnection(admin, env.google, { connection_id: id, account: t.email, refresh_token: t.refreshToken }, t.accessToken);
    return back(origin, st.return_to, first.ok ? "verbunden" : "verbunden-ohne-termine");
  } catch (e) {
    return back(origin, st.return_to, e instanceof GoogleError && e.code === "scope_missing" ? "keine-berechtigung" : "fehler");
  }
}
