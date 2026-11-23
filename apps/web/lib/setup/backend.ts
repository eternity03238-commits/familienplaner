/**
 * Setup backend: one interface, two implementations.
 *  - preview: nothing leaves the browser (GitHub Pages demo, no Supabase configured)
 *  - live: Supabase email + password (no confirmation mail, ADR-0007 update) + the 0004 RPCs (create_family, add_child, rename_person, invites)
 * Errors are mapped to short German sentences that say what to do next.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../supabase/browser.ts";

export interface ExistingFamily { familyId: string; familyName: string; myId: string; myName: string; children: { id: string; name: string }[] }
export interface SetupBackend {
  mode: "preview" | "live";
  /** Creates the account and signs in. Requires "Confirm email" to be off (no mail is sent). */
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  /** Leaves the page for Google (live) and comes back to /einrichten with ?code=…; preview signs in directly. */
  signInWithGoogle(returnUrl: string): Promise<"redirected" | "signed-in">;
  /** Finishes the Google sign-in after the redirect (PKCE code exchange). */
  completeGoogle(code: string): Promise<void>;
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
  if (o.code === "invalid_credentials" || /invalid login credentials/i.test(msg)) return "E-Mail-Adresse oder Passwort stimmen nicht. Noch kein Konto? Dann wähle „Neu hier“.";
  if (o.code === "user_already_exists" || o.code === "email_exists" || /already registered/i.test(msg)) return "Für diese E-Mail-Adresse gibt es schon ein Konto. Wähle „Ich habe ein Konto“.";
  if (o.code === "weak_password" || /password should/i.test(msg)) return "Das Passwort ist zu kurz oder zu einfach. Nimm mindestens 8 Zeichen oder den Vorschlag deines iPhones.";
  if (o.code === "email_not_confirmed" || o.code === "confirmation_required") return "Die Anmeldung ist noch nicht freigeschaltet: In Supabase muss „Confirm email“ ausgeschaltet sein.";
  if (o.code === "provider_disabled" || /provider is not enabled/i.test(msg)) return "Die Anmeldung mit Google ist in Supabase noch nicht eingeschaltet.";
  if (/code verifier|flow_state|bad_code_verifier|invalid flow state/i.test(msg)) return "Die Google-Anmeldung hat zu lange gedauert oder wurde in einem anderen Fenster gestartet. Bitte noch einmal tippen.";
  if (o.code === "signup_disabled" || /signups not allowed/i.test(msg)) return "Neue Konten sind gerade gesperrt. Bitte in Supabase die Registrierung erlauben.";
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
    async signUp() { await wait(250); },
    async signIn() { await wait(250); },
    async signInWithGoogle() { await wait(250); return "signed-in"; },
    async completeGoogle() { await wait(100); },
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
    async signUp(email, password) {
      const data = await call<{ session: unknown }>(sb.auth.signUp({ email: email.trim(), password }));
      // With "Confirm email" on, Supabase creates the user but no session (and would try to send a mail).
      if (!data?.session) throw new SetupError(explain({ code: "confirmation_required" }));
    },
    async signIn(email, password) { await call(sb.auth.signInWithPassword({ email: email.trim(), password })); },
    async signInWithGoogle(returnUrl) {
      await call(sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: returnUrl, queryParams: { prompt: "select_account" } } }));
      return "redirected";
    },
    async completeGoogle(code) { await call(sb.auth.exchangeCodeForSession(code)); },
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

/** Reads the result of a Google sign-in redirect from the query string (code or a German error). */
export function readOAuthReturn(search: string): { code: string } | { error: string } | null {
  const q = new URLSearchParams(search);
  const code = q.get("code");
  if (code && /^[A-Za-z0-9_-]{8,512}$/.test(code)) return { code };
  if (q.get("error") || q.get("error_description")) {
    return { error: q.get("error") === "access_denied" ? "Anmeldung mit Google abgebrochen. Du kannst es jederzeit noch einmal versuchen." : "Die Anmeldung mit Google hat nicht geklappt. Bitte noch einmal versuchen." };
  }
  return null;
}
