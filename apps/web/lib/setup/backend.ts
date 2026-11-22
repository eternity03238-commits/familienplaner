/**
 * Setup backend: one interface, two implementations.
 *  - preview: nothing leaves the browser (GitHub Pages demo, no Supabase configured)
 *  - live: Supabase email OTP + the 0004 RPCs (create_family, add_child, rename_person, invites)
 * Errors are mapped to short German sentences that say what to do next.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../supabase/browser.ts";

export interface ExistingFamily { familyId: string; familyName: string; myId: string; myName: string; children: { id: string; name: string }[] }
export interface SetupBackend {
  mode: "preview" | "live";
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  loadFamily(): Promise<ExistingFamily | null>;
  createFamily(familyName: string, myName: string): Promise<string>;
  addChild(familyId: string, name: string): Promise<string>;
  renamePerson(personId: string, name: string): Promise<void>;
  renameFamily(familyId: string, name: string): Promise<void>;
  createInvite(familyId: string): Promise<string>;
  acceptInvite(token: string, myName: string): Promise<string>;
}

export class SetupError extends Error {}

/** Map Supabase/Postgres errors to user-facing German text. Never echoes server messages verbatim. */
export function explain(e: unknown): string {
  const o = (e ?? {}) as { code?: string; status?: number; message?: string };
  const msg = String(o.message ?? "");
  if (o.status === 429 || /rate limit/i.test(msg)) return "Gerade wurden zu viele Codes angefordert. Bitte in ein paar Minuten noch einmal versuchen.";
  if (/expired|invalid.*(otp|token)|otp.*(expired|invalid)/i.test(msg) || o.code === "otp_expired") return "Der Code stimmt nicht oder ist abgelaufen. Fordere einfach einen neuen an.";
  if (/email_address_not_authorized|not authorized/i.test(msg)) return "An diese Adresse kann noch keine E-Mail verschickt werden. Der Mailversand ist erst für die Inhaberin freigeschaltet.";
  if (o.code === "22023" && /invite/i.test(msg)) return "Diese Einladung ist abgelaufen oder wurde schon benutzt. Bitte um einen neuen Link.";
  if (o.code === "22023") return "Bitte die Eingabe prüfen: Namen dürfen 1 bis 60 Zeichen haben.";
  if (o.code === "23505") return "Dieses Konto gehört schon zu einer Familie.";
  if (o.code === "42501") return "Dafür fehlt die Berechtigung. Bitte neu anmelden.";
  if (/fetch|network/i.test(msg)) return "Keine Verbindung. Bitte Internet prüfen und noch einmal tippen.";
  return "Das hat nicht geklappt. Bitte noch einmal versuchen.";
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export function previewBackend(): SetupBackend {
  let n = 0;
  return {
    mode: "preview",
    async sendCode() { await wait(250); },
    async verifyCode() { await wait(250); },
    async loadFamily() { return null; },
    async createFamily() { await wait(200); return "preview-family"; },
    async addChild() { await wait(80); return `preview-child-${++n}`; },
    async renamePerson() { await wait(80); },
    async renameFamily() { await wait(80); },
    async createInvite() { await wait(150); return "vorschau"; },
    async acceptInvite() { await wait(200); return "preview-family"; }
  };
}

async function call<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  let res: { data: unknown; error: unknown };
  try { res = await p; } catch (e) { throw new SetupError(explain(e)); }
  if (res.error) throw new SetupError(explain(res.error));
  return res.data as T;
}

export function liveBackend(sb: SupabaseClient): SetupBackend {
  return {
    mode: "live",
    async sendCode(email) { await call(sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })); },
    async verifyCode(email, code) { await call(sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" })); },
    async loadFamily() {
      const rows = await call<{ family_id: string; family_name: string; person_id: string; display_name: string; role: string; is_me: boolean }[]>(sb.rpc("my_family"));
      if (!rows?.length) return null;
      const me = rows.find(r => r.is_me);
      return {
        familyId: rows[0].family_id, familyName: rows[0].family_name, myId: me?.person_id ?? "", myName: me?.display_name ?? "",
        children: rows.filter(r => r.role === "child").map(r => ({ id: r.person_id, name: r.display_name }))
      };
    },
    async createFamily(familyName, myName) { return call<string>(sb.rpc("create_family", { p_family_name: familyName, p_my_name: myName })); },
    async addChild(familyId, name) { return call<string>(sb.rpc("add_child", { p_family_id: familyId, p_name: name })); },
    async renamePerson(personId, name) { await call(sb.rpc("rename_person", { p_person: personId, p_name: name })); },
    async renameFamily(familyId, name) { await call(sb.rpc("rename_family", { p_family_id: familyId, p_name: name })); },
    async createInvite(familyId) { return call<string>(sb.rpc("create_family_invite", { p_family_id: familyId })); },
    async acceptInvite(token, myName) { return call<string>(sb.rpc("accept_family_invite", { p_token: token, p_my_name: myName })); }
  };
}

export function setupBackend(): SetupBackend {
  const sb = getSupabase();
  return sb ? liveBackend(sb) : previewBackend();
}

/** Invite links carry the token in the URL fragment, which is never sent to any server or log. */
export const inviteLink = (origin: string, base: string, token: string) => `${origin}${base}/einrichten/#einladung=${encodeURIComponent(token)}`;
export function readInviteToken(hash: string): string | null {
  const m = /(?:^#|&)einladung=([A-Za-z0-9_=-]{16,80})(?:&|$)/.exec(hash);
  return m ? decodeURIComponent(m[1]) : null;
}
