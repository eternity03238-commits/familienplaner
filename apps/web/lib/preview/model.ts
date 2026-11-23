/**
 * Pure view-model logic for the GAMEPLAN design preview (no IO, no React, no network).
 * Mirrors the product's privacy rules on the UI side; the authoritative checks stay server-side + DB RLS.
 */
export const TIME_ZONE = "Europe/Berlin";

export type ChildKey = "A" | "B";
export type OwnerKey = ChildKey | "adult1" | "adult2" | "family";
export type EventKind = "school" | "sport" | "study" | "family" | "appointment";
export type SyncStatus = "synced" | "stale" | "not_connected" | "manual";

export interface Source {
  provider: "manual" | "google_calendar" | "school_import";
  label: string;
  status: SyncStatus;
  /** ISO timestamp of the last confirmed sync; never shown as "synced" without it. */
  lastSyncedAt?: string;
}

export interface PreviewEvent {
  id: string;
  title: string;
  detail?: string;
  kind: EventKind;
  owner: OwnerKey;
  visibility: "private" | "shared";
  allDay?: boolean;
  /** all-day events: local date YYYY-MM-DD */
  date?: string;
  startsAt?: string;
  endsAt?: string;
  source: Source;
}

export type MissionKind = "study" | "sport" | "project" | "everyday";
export interface Mission {
  id: string;
  child: ChildKey;
  kind: MissionKind;
  title: string;
  subject: string;
  estimateMinutes: number;
  dueOn: string;
  done: boolean;
  source: Source;
}

export type ProposalStatus = "pending" | "approved" | "rejected";
export interface StudyProposal {
  id: string;
  child: ChildKey;
  title: string;
  subject: string;
  reason: string;
  constraints: string[];
  /** Exactly what would be shared with an AI provider (data minimisation is visible). */
  sharedWithAi: string[];
  sessions: { startsAt: string; endsAt: string; minutes: number }[];
  status: ProposalStatus;
}

export type Viewer =
  | { kind: "guardian"; id: "adult1" | "adult2"; children: readonly ChildKey[] }
  | { kind: "child"; id: ChildKey };

export type ChildFilter = "all" | ChildKey;

export interface VisibleEvent extends PreviewEvent {
  /** true when the viewer may only know that the slot is busy */
  redacted: boolean;
}

/** Which events may a viewer see, and in which form? Fail closed: unknown owners are hidden. */
export function visibleEventsFor(viewer: Viewer, events: readonly PreviewEvent[]): VisibleEvent[] {
  const out: VisibleEvent[] = [];
  for (const e of events) {
    if (viewer.kind === "child") {
      if (e.owner === viewer.id || (e.owner === "family" && e.visibility === "shared")) out.push({ ...e, redacted: false });
      continue;
    }
    if (e.owner === viewer.id || e.owner === "family") { out.push({ ...e, redacted: false }); continue; }
    if (e.owner === "A" || e.owner === "B") {
      // guardians see a guarded child's shared events; a child's private events stay private (REPORT §5.1)
      if (viewer.children.includes(e.owner) && e.visibility === "shared") out.push({ ...e, redacted: false });
      continue;
    }
    if (e.owner === "adult1" || e.owner === "adult2") {
      // the other adult: shared in full, private only as "busy" without title/detail
      if (e.visibility === "shared") out.push({ ...e, redacted: false });
      else out.push({ ...e, title: "Privater Termin", detail: undefined, redacted: true });
    }
  }
  return out;
}

/** Child filter for the parent dashboard. Family-wide and own events always remain visible. */
export function applyChildFilter<T extends { owner?: OwnerKey; child?: ChildKey }>(items: readonly T[], filter: ChildFilter): T[] {
  if (filter === "all") return [...items];
  return items.filter(i => {
    const key = i.child ?? i.owner;
    return key === filter || (i.child === undefined && (key === "family" || key === "adult1" || key === "adult2"));
  });
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, ...opts });
const timeFmt = fmt({ hour: "2-digit", minute: "2-digit" });
const dayFmt = fmt({ weekday: "long", day: "numeric", month: "long" });
const shortDayFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const isoDateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatShortDay = (iso: string) => shortDayFmt.format(new Date(iso));
export const localDate = (iso: string) => isoDateFmt.format(new Date(iso));
/** Formats a local YYYY-MM-DD date without shifting it through UTC. */
export const formatLocalDate = (date: string) => shortDayFmt.format(new Date(`${date}T12:00:00Z`));

export interface RailGroup { allDay: VisibleEvent[]; timed: VisibleEvent[] }

/** One local day: all-day events separately, timed events chronologically. */
export function railForDay(events: readonly VisibleEvent[], day: string): RailGroup {
  const allDay = events.filter(e => e.allDay && e.date === day);
  const timed = events
    .filter(e => !e.allDay && e.startsAt && localDate(e.startsAt) === day)
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!) || a.id.localeCompare(b.id));
  return { allDay, timed };
}

/** Running event (started, not ended) and the next event that starts after `now`. Redacted slots are never "next". */
export function currentAndNext(events: readonly VisibleEvent[], now: string): { current?: VisibleEvent; next?: VisibleEvent } {
  const t = Date.parse(now);
  const timed = events.filter(e => !e.allDay && !e.redacted && e.startsAt && e.endsAt)
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!) || a.id.localeCompare(b.id));
  return {
    current: timed.find(e => Date.parse(e.startsAt!) <= t && Date.parse(e.endsAt!) > t),
    next: timed.find(e => Date.parse(e.startsAt!) > t)
  };
}

export function minutesUntil(iso: string, now: string): number {
  return Math.round((Date.parse(iso) - Date.parse(now)) / 60_000);
}

export function progress(missions: readonly Mission[]): { done: number; total: number; label: string } {
  const done = missions.filter(m => m.done).length;
  return { done, total: missions.length, label: `${done} von ${missions.length} erledigt` };
}

/** Children may only flip done/open on their own missions (CLAUDE.md rule 11): nothing else changes. */
export function toggleMission(missions: readonly Mission[], id: string, actor: Viewer): Mission[] {
  return missions.map(m => {
    if (m.id !== id) return m;
    const allowed = actor.kind === "child" ? actor.id === m.child : actor.children.includes(m.child);
    return allowed ? { ...m, done: !m.done } : m;
  });
}

/** A decision is final; only guardians of that child can decide. Returns the unchanged list otherwise. */
export function decideProposal(proposals: readonly StudyProposal[], id: string, decision: "approved" | "rejected", actor: Viewer): StudyProposal[] {
  return proposals.map(p => {
    if (p.id !== id || p.status !== "pending") return p;
    if (actor.kind !== "guardian" || !actor.children.includes(p.child)) return p;
    return { ...p, status: decision };
  });
}

export function sourceText(s: Source, now: string): string {
  switch (s.status) {
    case "manual": return `${s.label} · manuell eingetragen`;
    case "not_connected": return `${s.label} · nicht verbunden`;
    case "stale": return `${s.label} · Abgleich veraltet${s.lastSyncedAt ? `, zuletzt ${relative(s.lastSyncedAt, now)}` : ""}`;
    case "synced": return s.lastSyncedAt ? `${s.label} · abgeglichen ${relative(s.lastSyncedAt, now)}` : `${s.label} · Abgleich unbestätigt`;
  }
}

function relative(iso: string, now: string): string {
  const m = Math.max(0, -minutesUntil(iso, now));
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `am ${formatShortDay(iso)}`;
}

export const kindLabel: Record<EventKind, string> = {
  school: "Schule", sport: "Sport", study: "Lernen", family: "Familie", appointment: "Termin"
};

export interface Stage { title: string; minutes: number; description: string; dueOn: string; done: boolean }

/** Toggles one expedition stage. Only the owning child or a guardian may do it; nothing but `done` changes. */
export function toggleStage(stages: readonly Stage[], index: number, actor: Viewer, owner: ChildKey): Stage[] {
  const allowed = actor.kind === "child" ? actor.id === owner : actor.children.includes(owner);
  if (!allowed || index < 0 || index >= stages.length) return [...stages];
  return stages.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
}

/** Monday-to-Friday local dates of the week containing `day` (YYYY-MM-DD, Europe/Berlin). */
export function workWeek(day: string): string[] {
  const d = new Date(`${day}T12:00:00Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

const weekdayFmt = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", weekday: "short" });
export const weekdayShort = (date: string) => weekdayFmt.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
export const dayOfMonth = (date: string) => String(Number(date.slice(8, 10)));

export interface LoadWarning { child: ChildKey; minutes: number; text: string }
/**
 * Workload hint per child for one local day: planned study blocks + open missions due by the next day.
 * Product rule: rather show a conflict than overfill the plan. Threshold is a setting (default 60 extra minutes).
 */
export function loadWarnings(events: readonly PreviewEvent[], missions: readonly Mission[], day: string, thresholdMinutes = 60): LoadWarning[] {
  const next = new Date(`${day}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDay = next.toISOString().slice(0, 10);
  const out: LoadWarning[] = [];
  for (const child of ["A", "B"] as const) {
    const study = events.filter(e => e.owner === child && e.kind === "study" && e.startsAt && e.endsAt && localDate(e.startsAt) === day)
      .reduce((n, e) => n + (Date.parse(e.endsAt!) - Date.parse(e.startsAt!)) / 60_000, 0);
    const open = missions.filter(m => m.child === child && !m.done && m.kind !== "everyday" && m.dueOn <= nextDay).reduce((n, m) => n + m.estimateMinutes, 0);
    const sport = events.some(e => e.owner === child && e.kind === "sport" && e.startsAt && localDate(e.startsAt) === day);
    const minutes = Math.round(study + open);
    if (minutes > thresholdMinutes || (sport && minutes >= thresholdMinutes * 0.75))
      out.push({ child, minutes, text: `Kind ${child}: etwa ${minutes} Minuten Lernen und Aufgaben${sport ? " neben dem Training" : ""}. Lieber einen Block verschieben als den Nachmittag überfüllen.` });
  }
  return out;
}
