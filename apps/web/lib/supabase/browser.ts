/**
 * Browser Supabase client. Uses only the public project URL and the publishable (anon) key, both safe in the
 * bundle by design: every read and write is enforced by RLS and the 0004 functions. Never a secret key here.
 * Without configuration the app stays in preview mode (GitHub Pages demo).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_RE = /^https:\/\/[a-z0-9]{20}\.supabase\.co$/;
let client: SupabaseClient | null | undefined;

export function supabaseConfig(env: Record<string, string | undefined> = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
}): { url: string; key: string } | null {
  // Tolerate what people paste from dashboards: surrounding quotes, spaces and a trailing slash.
  const tidy = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim();
  const url = tidy(env.url)?.replace(/\/+$/, ""), key = tidy(env.key);
  if (!url || !key) return null;
  if (!URL_RE.test(url)) throw new Error("NEXT_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co");
  if (/^sb_secret_/.test(key) || legacyJwtRole(key) !== null && legacyJwtRole(key) !== "anon") throw new Error("Refusing a secret Supabase key in the browser");
  return { url, key };
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const cfg = supabaseConfig();
  client = cfg ? createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: "pkce" } }) : null;
  return client;
}

/** Legacy keys are JWTs; only the anon one may ever reach the browser. */
function legacyJwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try { return String(JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))).role ?? ""); } catch { return ""; }
}
