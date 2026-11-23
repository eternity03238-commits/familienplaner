import test from "node:test";
import assert from "node:assert/strict";
import { planStudySessions, type Interval } from "../packages/planning/src/index.ts";

const t = (s: string) => new Date(s).getTime();
const base = { preferredBlockMinutes: 25, maxDailyMinutes: 60 };
const overlaps = (a: Interval, b: Interval) => a.startMs < b.endMs && a.endMs > b.startMs;
const berlinDate = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);

test("never overlaps any occupied interval, including overlapping and unsorted occupied blocks", () => {
  const occupied = [
    { startMs: t("2026-11-23T15:30:00Z"), endMs: t("2026-11-23T16:10:00Z") },
    { startMs: t("2026-11-23T14:20:00Z"), endMs: t("2026-11-23T15:40:00Z") },
    { startMs: t("2026-11-23T13:50:00Z"), endMs: t("2026-11-23T14:05:00Z") }
  ];
  const r = planStudySessions({ ...base, available: [{ startMs: t("2026-11-23T13:00:00Z"), endMs: t("2026-11-23T18:00:00Z") }], occupied, totalMinutes: 60 });
  assert.equal(r.unscheduledMinutes, 0);
  for (const s of r.sessions) for (const o of occupied) assert.equal(overlaps(s, o), false, `session ${new Date(s.startMs).toISOString()} overlaps occupied`);
});

test("sessions never overlap each other or leave the available window", () => {
  const window = { startMs: t("2026-11-24T14:00:00Z"), endMs: t("2026-11-24T16:00:00Z") };
  const r = planStudySessions({ ...base, maxDailyMinutes: 240, available: [window], occupied: [], totalMinutes: 110 });
  const sorted = [...r.sessions].sort((a, b) => a.startMs - b.startMs);
  sorted.forEach((s, i) => {
    assert.ok(s.startMs >= window.startMs && s.endMs <= window.endMs);
    if (i > 0) assert.ok(sorted[i - 1].endMs <= s.startMs);
  });
  assert.equal(r.sessions.reduce((n, s) => n + s.minutes, 0), 110);
});

test("fully occupied window yields a conflict warning instead of an overfilled plan", () => {
  const r = planStudySessions({ ...base, available: [{ startMs: t("2026-11-23T14:00:00Z"), endMs: t("2026-11-23T15:00:00Z") }], occupied: [{ startMs: t("2026-11-23T13:00:00Z"), endMs: t("2026-11-23T16:00:00Z") }], totalMinutes: 50 });
  assert.deepEqual(r.sessions, []);
  assert.equal(r.unscheduledMinutes, 50);
  assert.equal(r.warnings.length, 1);
});

test("daily cap is applied per Europe/Berlin calendar day, not per UTC day", () => {
  // 22:30Z on 23 Nov is 23:30 Berlin (23 Nov); 23:30Z is 00:30 Berlin (24 Nov).
  const r = planStudySessions({ ...base, maxDailyMinutes: 25, available: [
    { startMs: t("2026-11-23T22:00:00Z"), endMs: t("2026-11-23T22:50:00Z") },
    { startMs: t("2026-11-23T23:10:00Z"), endMs: t("2026-11-24T00:00:00Z") }], occupied: [], totalMinutes: 50 });
  assert.equal(r.unscheduledMinutes, 0);
  assert.deepEqual([...new Set(r.sessions.map(s => s.localDate))].sort(), ["2026-11-23", "2026-11-24"]);
});

test("sessions do not cross local midnight (day-bounded input)", () => {
  const r = planStudySessions({ ...base, maxDailyMinutes: 120, available: [{ startMs: t("2026-11-23T22:00:00Z"), endMs: t("2026-11-23T22:59:00Z") }], occupied: [], totalMinutes: 60 });
  for (const s of r.sessions) assert.equal(berlinDate(s.startMs), berlinDate(s.endMs - 1));
});

test("DST: 25-hour local day (2026-10-25) still honours the daily cap and local dates", () => {
  const r = planStudySessions({ ...base, available: [{ startMs: t("2026-10-24T22:00:00Z"), endMs: t("2026-10-25T22:59:00Z") }], occupied: [], totalMinutes: 200 });
  assert.equal(r.sessions.reduce((n, s) => n + s.minutes, 0), 60);
  assert.equal(r.unscheduledMinutes, 140);
  for (const s of r.sessions) assert.equal(s.localDate, berlinDate(s.startMs));
});

test("DST: 23-hour local day (2026-03-29) works and stays deterministic", () => {
  const input = { ...base, available: [{ startMs: t("2026-03-28T23:00:00Z"), endMs: t("2026-03-29T21:59:00Z") }], occupied: [], totalMinutes: 60 };
  assert.deepEqual(planStudySessions(input), planStudySessions(input));
});

test("does not mutate its input and is order independent for available windows", () => {
  const a = { startMs: t("2026-11-23T14:00:00Z"), endMs: t("2026-11-23T15:00:00Z") };
  const b = { startMs: t("2026-11-24T14:00:00Z"), endMs: t("2026-11-24T15:00:00Z") };
  const occupied = [{ startMs: t("2026-11-23T14:10:00Z"), endMs: t("2026-11-23T14:20:00Z") }];
  const snapshot = JSON.stringify({ a, b, occupied });
  const r1 = planStudySessions({ ...base, available: [a, b], occupied, totalMinutes: 100 });
  const r2 = planStudySessions({ ...base, available: [b, a], occupied, totalMinutes: 100 });
  assert.deepEqual(r1, r2);
  assert.equal(JSON.stringify({ a, b, occupied }), snapshot);
});

test("rejects malformed input (fail closed)", () => {
  const ok = { startMs: 0, endMs: 60_000 };
  assert.throws(() => planStudySessions({ ...base, available: [{ startMs: 10, endMs: 5 }], occupied: [], totalMinutes: 25 }));
  assert.throws(() => planStudySessions({ ...base, available: [{ startMs: Number.NaN, endMs: 5 }], occupied: [], totalMinutes: 25 }));
  assert.throws(() => planStudySessions({ ...base, available: [ok], occupied: [{ startMs: 5, endMs: 5 }], totalMinutes: 25 }));
  assert.throws(() => planStudySessions({ ...base, available: [ok], occupied: [], totalMinutes: 25.5 }));
  assert.throws(() => planStudySessions({ ...base, preferredBlockMinutes: 0, available: [ok], occupied: [], totalMinutes: 25 }));
  assert.throws(() => planStudySessions({ ...base, maxDailyMinutes: -1, available: [ok], occupied: [], totalMinutes: 25 }));
});

test("product defaults are adjustable limits, not hard-coded: a stricter daily cap is respected", () => {
  const r = planStudySessions({ preferredBlockMinutes: 15, maxDailyMinutes: 30, available: [{ startMs: t("2026-11-23T14:00:00Z"), endMs: t("2026-11-23T20:00:00Z") }], occupied: [], totalMinutes: 90 });
  assert.equal(r.sessions.reduce((n, s) => n + s.minutes, 0), 30);
});
