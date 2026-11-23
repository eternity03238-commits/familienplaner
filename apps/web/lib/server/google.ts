import "server-only";
/** Google OAuth (authorization code + PKCE) and Calendar API calls. Tokens are never logged. */
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { calendarsToSync, mapGoogleEvent, needsReconnect, type EventRow } from "../google/map.ts";
import type { GoogleEnv } from "./env.ts";

export const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.readonly"];
const b64url = (b: Buffer) => b.toString("base64url");
export const newSecret = () => b64url(randomBytes(32));
export const challengeFor = (verifier: string) => b64url(createHash("sha256").update(verifier).digest());

export function redirectUri(g: GoogleEnv, origin: string) {
  return g.redirectUri ?? `${origin}/api/google/callback`;
}

export function authUrl(g: GoogleEnv, origin: string, state: string, verifier: string, loginHint?: string) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: g.clientId, redirect_uri: redirectUri(g, origin), response_type: "code", scope: SCOPES.join(" "),
    access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
    code_challenge: challengeFor(verifier), code_challenge_method: "S256", ...(loginHint ? { login_hint: loginHint } : {})
  }).toString();
  return u.toString();
}

const TokenResponse = z.object({ access_token: z.string(), refresh_token: z.string().optional(), id_token: z.string().optional(), scope: z.string().optional() });
export class GoogleError extends Error { constructor(public code: string, public reconnect = false) { super(code); } }

async function tokenCall(params: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { const code = String((body as { error?: string }).error ?? `http_${res.status}`); throw new GoogleError(code, needsReconnect(code)); }
  return TokenResponse.parse(body);
}

export async function exchangeCode(g: GoogleEnv, origin: string, code: string, verifier: string) {
  const t = await tokenCall({ code, client_id: g.clientId, client_secret: g.clientSecret, redirect_uri: redirectUri(g, origin), grant_type: "authorization_code", code_verifier: verifier });
  if (!t.scope?.split(" ").includes("https://www.googleapis.com/auth/calendar.readonly")) throw new GoogleError("scope_missing");
  if (!t.refresh_token) throw new GoogleError("no_refresh_token");
  // The id_token comes straight from Google's token endpoint over TLS, so its payload can be read without re-verification.
  const email = t.id_token ? String(JSON.parse(Buffer.from(t.id_token.split(".")[1] ?? "", "base64url").toString("utf8")).email ?? "") : "";
  if (!email) throw new GoogleError("no_email");
  return { accessToken: t.access_token, refreshToken: t.refresh_token, email };
}

export async function refreshAccess(g: GoogleEnv, refreshToken: string) {
  return (await tokenCall({ client_id: g.clientId, client_secret: g.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" })).access_token;
}

export async function revoke(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => undefined);
}

async function api(accessToken: string, path: string, params: Record<string, string>) {
  const u = new URL(`https://www.googleapis.com/calendar/v3/${path}`);
  u.search = new URLSearchParams(params).toString();
  const res = await fetch(u, { headers: { authorization: `Bearer ${accessToken}` } });
  if (res.status === 401) throw new GoogleError("unauthorized", true);
  if (!res.ok) throw new GoogleError(`calendar_http_${res.status}`);
  return res.json() as Promise<{ items?: unknown[]; nextPageToken?: string }>;
}

/** All events of the visible calendars in [from, to), mapped to FamilyOS rows (at most 2000). */
export async function fetchEvents(accessToken: string, from: Date, to: Date): Promise<EventRow[]> {
  const list = await api(accessToken, "users/me/calendarList", { maxResults: "250", minAccessRole: "reader" });
  const rows: EventRow[] = [];
  for (const cal of calendarsToSync(list.items ?? [])) {
    let pageToken: string | undefined;
    do {
      const page = await api(accessToken, `calendars/${encodeURIComponent(cal.id)}/events`, {
        timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250",
        ...(pageToken ? { pageToken } : {})
      });
      for (const item of page.items ?? []) rows.push(...mapGoogleEvent(cal.id, item));
      pageToken = page.nextPageToken;
    } while (pageToken && rows.length < 2000);
    if (rows.length >= 2000) break;
  }
  const unique = new Map(rows.map(r => [r.external_id, r]));
  return [...unique.values()].slice(0, 2000);
}

export const syncWindow = (now = new Date()) => ({ from: new Date(now.getTime() - 86_400_000), to: new Date(now.getTime() + 60 * 86_400_000) });
