"use client";
/**
 * Browser side of the Google connection. Talks to our own /api/google/* routes with the Supabase access token;
 * reads connection status and events through RLS. Never sees Google tokens.
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../supabase/browser.ts";

export interface Connection { id: string; account: string; status: string; lastSyncedAt: string | null; lastError: string | null }
export interface CalEvent { id: string; title: string; location: string | null; allDay: boolean; date: string | null; startsAt: string | null; endsAt: string | null; source: string }

type ApiBody = { error?: string; url?: string; results?: { ok: boolean; reconnect?: boolean }[] };
async function authed(path: string, body?: unknown): Promise<{ ok: boolean; data: ApiBody }> {
  const sb = getSupabase();
  const token = (await sb?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, data: { error: "Bitte neu anmelden." } };
  try {
    const res = await fetch(path, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, data: (await res.json().catch(() => ({}))) as ApiBody };
  } catch { return { ok: false, data: { error: "Keine Verbindung. Bitte Internet prüfen." } }; }
}

export async function startGoogle(): Promise<string | null> {
  const r = await authed("/api/google/start");
  if (r.ok && typeof r.data.url === "string" && r.data.url.startsWith("https://accounts.google.com/")) { window.location.assign(r.data.url); return null; }
  return r.data.error ?? "Das hat nicht geklappt. Bitte noch einmal versuchen.";
}
export async function syncGoogle(): Promise<{ ok: boolean; reconnect: boolean; message?: string }> {
  const r = await authed("/api/google/sync");
  const results = r.data.results ?? [];
  return { ok: r.ok && results.every(x => x.ok), reconnect: results.some(x => x.reconnect), message: r.ok ? undefined : r.data.error };
}
export async function disconnectGoogle(connectionId: string): Promise<string | null> {
  const r = await authed("/api/google/disconnect", { connectionId });
  return r.ok ? null : r.data.error ?? "Trennen hat nicht geklappt.";
}

export function useConnections() {
  const [state, setState] = useState<{ loading: boolean; items: Connection[] }>({ loading: true, items: [] });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from("integration_connections").select("id, external_account_ref, status, last_synced_at, last_error, revoked_at").eq("provider", "google_calendar").is("revoked_at", null);
      if (alive) setState({ loading: false, items: (data ?? []).map(c => ({ id: c.id, account: c.external_account_ref ?? "", status: c.status, lastSyncedAt: c.last_synced_at, lastError: c.last_error })) });
    })();
    return () => { alive = false; };
  }, [tick]);
  return { ...state, reload: useCallback(() => setTick(t => t + 1), []) };
}

/** Events overlapping [from, to) visible to the signed-in person (RLS). */
export function useEvents(from: string, to: string) {
  const [state, setState] = useState<{ loading: boolean; events: CalEvent[] }>({ loading: true, events: [] });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const [timed, allDay] = await Promise.all([
        sb.from("calendar_events").select("id, title, location, all_day, event_date, starts_at, ends_at, source").eq("all_day", false).lt("starts_at", to).gt("ends_at", from).order("starts_at").limit(500),
        sb.from("calendar_events").select("id, title, location, all_day, event_date, starts_at, ends_at, source").eq("all_day", true).gte("event_date", from.slice(0, 10)).lt("event_date", to.slice(0, 10)).order("event_date").limit(500)
      ]);
      const rows = [...(allDay.data ?? []), ...(timed.data ?? [])];
      if (alive) setState({ loading: false, events: rows.map(e => ({ id: e.id, title: e.title, location: e.location, allDay: e.all_day, date: e.event_date, startsAt: e.starts_at, endsAt: e.ends_at, source: e.source })) });
    })();
    return () => { alive = false; };
  }, [from, to, tick]);
  return { ...state, reload: useCallback(() => setTick(t => t + 1), []) };
}

const TZ = "Europe/Berlin";
export const berlinDate = (iso: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
export const timeOf = (iso: string) => new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const dayLabel = (ymd: string) => new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${ymd}T12:00:00Z`));
export const sinceText = (iso: string | null, now = Date.now()) => {
  if (!iso) return "noch nie";
  const min = Math.round((now - Date.parse(iso)) / 60000);
  return min < 1 ? "gerade eben" : min < 60 ? `vor ${min} Min.` : min < 1440 ? `vor ${Math.round(min / 60)} Std.` : `am ${new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "numeric", month: "numeric" }).format(new Date(iso))}`;
};

/** Groups events by Berlin calendar day for [fromDay, fromDay + days). */
export function byDay(events: CalEvent[], fromDay: string, days: number) {
  const out: { day: string; events: CalEvent[] }[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.parse(`${fromDay}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
    const list = events.filter(e => (e.allDay ? e.date === day : e.startsAt && berlinDate(e.startsAt) <= day && berlinDate(new Date(Date.parse(e.endsAt!) - 1)) >= day));
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
    out.push({ day, events: list });
  }
  return out;
}
