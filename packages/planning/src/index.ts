/** Pure, deterministic greedy scheduler. All timestamps must be ISO offsets or UTC. */
export interface Interval { startMs: number; endMs: number }
export interface ScheduleRequest {
  available: readonly Interval[];
  occupied: readonly Interval[];
  totalMinutes: number;
  preferredBlockMinutes: number;
  maxDailyMinutes: number;
  timeZone?: string;
}
export interface PlannedSession { startMs: number; endMs: number; minutes: number; localDate: string }
export interface ScheduleResult { sessions: PlannedSession[]; unscheduledMinutes: number; warnings: string[] }
function localDate(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(ms);
  const v = (key: string) => parts.find(p => p.type === key)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}
/** Do not cross local midnight; callers must supply day-bounded candidate availability. */
export function planStudySessions(input: ScheduleRequest): ScheduleResult {
  const { totalMinutes, preferredBlockMinutes, maxDailyMinutes } = input;
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || !Number.isInteger(preferredBlockMinutes) || preferredBlockMinutes <= 0 ||
      !Number.isInteger(maxDailyMinutes) || maxDailyMinutes <= 0) throw new Error("Invalid learning limits");
  const timeZone = input.timeZone ?? "Europe/Berlin";
  const valid = (interval: Interval) => Number.isFinite(interval.startMs) && Number.isFinite(interval.endMs) && interval.endMs > interval.startMs;
  if (![...input.available, ...input.occupied].every(valid)) throw new Error("Invalid interval");
  const occupied: Interval[] = input.occupied.map(x => ({ ...x }));
  const scheduled: PlannedSession[] = [];
  const perDay = new Map<string, number>();
  let remaining = totalMinutes;
  for (const a of [...input.available].sort((x, y) => x.startMs - y.startMs)) {
    let pointer = a.startMs;
    while (pointer < a.endMs && remaining > 0) {
      const date = localDate(pointer, timeZone);
      const dayRoom = maxDailyMinutes - (perDay.get(date) ?? 0);
      if (dayRoom <= 0) break;
      const overlapping = occupied.filter(o => o.startMs < a.endMs && o.endMs > pointer).sort((x, y) => x.startMs - y.startMs)[0];
      if (overlapping?.startMs <= pointer && overlapping.endMs > pointer) { pointer = overlapping.endMs; continue; }
      const untilConflict = overlapping ? Math.min(a.endMs, overlapping.startMs) : a.endMs;
      const minutes = Math.min(preferredBlockMinutes, remaining, dayRoom, Math.floor((untilConflict - pointer) / 60_000));
      if (minutes < 5) { pointer = untilConflict; continue; }
      const endMs = pointer + minutes * 60_000;
      // Reject sessions crossing a local day boundary (DST-safe string comparison).
      if (localDate(endMs - 1, timeZone) !== date) { pointer = endMs; continue; }
      scheduled.push({ startMs: pointer, endMs, minutes, localDate: date });
      occupied.push({ startMs: pointer, endMs });
      perDay.set(date, (perDay.get(date) ?? 0) + minutes);
      remaining -= minutes;
      pointer = endMs;
    }
    if (remaining === 0) break;
  }
  return { sessions: scheduled, unscheduledMinutes: remaining,
    warnings: remaining > 0 ? [`${remaining} Minuten passen nicht in die verfügbaren Zeitfenster.`] : [] };
}
