"use client";
/**
 * Live session for the parent views. Build-time decision between preview (no Supabase configured) and live.
 * Reads only through RLS (my_family RPC); nothing here can see another family.
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabase, supabaseConfig } from "../supabase/browser.ts";

export const LIVE = supabaseConfig() !== null;

export interface Member { personId: string; name: string; role: "adult" | "guardian" | "child"; isMe: boolean }
export interface LiveFamily { familyId: string; familyName: string; members: Member[] }
export type LiveState =
  | { kind: "preview" }
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "noFamily"; email: string }
  | { kind: "ready"; email: string; family: LiveFamily }
  | { kind: "error" };

export function toFamily(rows: { family_id: string; family_name: string; person_id: string; display_name: string; role: string; is_me: boolean }[]): LiveFamily | null {
  if (!rows.length) return null;
  return {
    familyId: rows[0].family_id,
    familyName: rows[0].family_name,
    members: rows.map(r => ({ personId: r.person_id, name: r.display_name, role: r.role as Member["role"], isMe: r.is_me }))
  };
}

export function useLiveSession(): { state: LiveState; signOut: () => Promise<void>; reload: () => void } {
  const [state, setState] = useState<LiveState>(LIVE ? { kind: "loading" } : { kind: "preview" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    const load = async () => {
      const { data: auth } = await sb.auth.getUser();
      if (!alive) return;
      if (!auth.user) { setState({ kind: "signedOut" }); return; }
      const { data, error } = await sb.rpc("my_family");
      if (!alive) return;
      if (error) { setState({ kind: "error" }); return; }
      const family = toFamily(data ?? []);
      setState(family ? { kind: "ready", email: auth.user.email ?? "", family } : { kind: "noFamily", email: auth.user.email ?? "" });
    };
    void load();
    const { data: sub } = sb.auth.onAuthStateChange(event => { if (event === "SIGNED_OUT" || event === "SIGNED_IN") void load(); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [tick]);

  const signOut = useCallback(async () => { await getSupabase()?.auth.signOut(); }, []);
  const reload = useCallback(() => setTick(t => t + 1), []);
  return { state, signOut, reload };
}
