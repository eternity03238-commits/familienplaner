import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleEnv } from "./env.ts";
import { fetchEvents, GoogleError, refreshAccess, syncWindow } from "./google.ts";

export interface SyncResult { account: string; ok: boolean; events?: number; reconnect?: boolean }

/** Syncs one connection. Never claims success without the database confirming the write (no silent fail). */
export async function syncConnection(admin: SupabaseClient, g: GoogleEnv, c: { connection_id: string; account: string; refresh_token: string }, accessToken?: string): Promise<SyncResult> {
  const { from, to } = syncWindow();
  try {
    const token = accessToken ?? await refreshAccess(g, c.refresh_token);
    const rows = await fetchEvents(token, from, to);
    const { data, error } = await admin.rpc("srv_apply_google_events", { p_connection: c.connection_id, p_from: from.toISOString(), p_to: to.toISOString(), p_events: rows });
    if (error) throw new GoogleError("db_write_failed");
    return { account: c.account, ok: true, events: Number(data) };
  } catch (e) {
    const err = e instanceof GoogleError ? e : new GoogleError("unexpected");
    await admin.rpc("srv_mark_sync_failed", { p_connection: c.connection_id, p_error: err.code, p_reauth: err.reconnect });
    return { account: c.account, ok: false, reconnect: err.reconnect };
  }
}
