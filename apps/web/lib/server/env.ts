import "server-only";
/** Server-only configuration. Missing values disable the feature with a clear message instead of failing silently. */
export interface GoogleEnv { clientId: string; clientSecret: string; redirectUri?: string }
export interface ServerEnv { supabaseUrl: string; supabaseSecret: string; google: GoogleEnv | null }

export function serverEnv(env: Record<string, string | undefined> = process.env): ServerEnv | null {
  const tidy = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;
  const supabaseUrl = tidy(env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, "");
  const supabaseSecret = tidy(env.SUPABASE_SECRET_KEY);
  if (!supabaseUrl || !supabaseSecret) return null;
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(supabaseUrl) && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(supabaseUrl)) return null;
  const clientId = tidy(env.GOOGLE_CLIENT_ID), clientSecret = tidy(env.GOOGLE_CLIENT_SECRET);
  return { supabaseUrl, supabaseSecret, google: clientId && clientSecret ? { clientId, clientSecret, redirectUri: tidy(env.GOOGLE_REDIRECT_URI) } : null };
}
