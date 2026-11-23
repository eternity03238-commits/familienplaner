/** POST /api/google/disconnect {connectionId} — deletes token and imported events, revokes access at Google. */
import { z } from "zod";
import { serverEnv } from "../../../../lib/server/env.ts";
import { adminClient, json, parentFromRequest } from "../../../../lib/server/admin.ts";
import { revoke } from "../../../../lib/server/google.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Body = z.object({ connectionId: z.string().uuid() });

export async function POST(req: Request) {
  const env = serverEnv();
  if (!env) return json(503, { error: "Der Server ist noch nicht eingerichtet." });
  const admin = adminClient(env);
  const parent = await parentFromRequest(req, admin);
  if (!parent) return json(401, { error: "Bitte neu anmelden." });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return json(400, { error: "Ungültige Anfrage." });
  const { data, error } = await admin.rpc("srv_disconnect_google", { p_person: parent.person, p_connection: body.data.connectionId });
  if (error) return json(error.code === "42501" ? 403 : 500, { error: "Trennen hat nicht geklappt." });
  if (typeof data === "string" && data) await revoke(data);
  return json(200, { ok: true });
}
