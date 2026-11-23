/**
 * Google Calendar → FamilyOS event rows (pure, no IO). Input is validated with Zod before mapping.
 * Rules: cancelled events are dropped; all-day events become one row per day (date only, rule 8),
 * timed events keep UTC instants; zero-length events get 15 minutes so `ends_at > starts_at` holds.
 */
import { z } from "zod";

const When = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), dateTime: z.string().optional(), timeZone: z.string().optional() });
export const GoogleEvent = z.object({
  id: z.string().min(1).max(1024),
  status: z.string().optional(),
  etag: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  start: When.optional(),
  end: When.optional()
});
export type GoogleEvent = z.infer<typeof GoogleEvent>;

export interface EventRow {
  external_id: string; version: string | null; title: string; location: string;
  all_day: boolean; event_date: string | null; starts_at: string | null; ends_at: string | null;
}

const MAX_DAYS = 31;
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

export function mapGoogleEvent(calendarId: string, raw: unknown): EventRow[] {
  const parsed = GoogleEvent.safeParse(raw);
  if (!parsed.success) return [];
  const e = parsed.data;
  if (e.status === "cancelled" || !e.start) return [];
  const base = { version: e.etag ?? null, title: (e.summary?.trim() || "(Ohne Titel)").slice(0, 500), location: (e.location ?? "").slice(0, 500) };
  const id = `${calendarId}:${e.id}`;
  if (e.start.date) {
    const endExclusive = e.end?.date && e.end.date > e.start.date ? e.end.date : addDays(e.start.date, 1);
    const rows: EventRow[] = [];
    for (let d = e.start.date, i = 0; d < endExclusive && i < MAX_DAYS; d = addDays(d, 1), i++) {
      rows.push({ ...base, external_id: rows.length ? `${id}:${d}` : id, all_day: true, event_date: d, starts_at: null, ends_at: null });
    }
    return rows;
  }
  const start = Date.parse(e.start.dateTime ?? "");
  if (Number.isNaN(start)) return [];
  let end = Date.parse(e.end?.dateTime ?? "");
  if (Number.isNaN(end) || end <= start) end = start + 15 * 60_000;
  return [{ ...base, external_id: id, all_day: false, event_date: null, starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString() }];
}

export const GoogleCalendarListEntry = z.object({
  id: z.string().min(1), summary: z.string().optional(), selected: z.boolean().optional(), hidden: z.boolean().optional(),
  accessRole: z.string().optional(), primary: z.boolean().optional()
});
export type GoogleCalendarListEntry = z.infer<typeof GoogleCalendarListEntry>;

/** Calendars shown in the user's Google Calendar (primary first), at most 10. */
export function calendarsToSync(entries: unknown[]): GoogleCalendarListEntry[] {
  return entries.map(e => GoogleCalendarListEntry.safeParse(e)).flatMap(r => (r.success ? [r.data] : []))
    .filter(c => c.primary || (c.selected && !c.hidden))
    .sort((a, b) => Number(!!b.primary) - Number(!!a.primary))
    .slice(0, 10);
}

/** Classifies Google token errors: invalid_grant means the user revoked access or the token expired → reconnect. */
export const needsReconnect = (oauthError: string | undefined) => oauthError === "invalid_grant" || oauthError === "unauthorized_client";
