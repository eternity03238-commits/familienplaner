import test from "node:test";
import assert from "node:assert/strict";
import { planStudySessions } from "../packages/planning/src/index.ts";
const t = (s: string) => new Date(s).getTime();
test("respects hard sports conflict", () => {
  const result = planStudySessions({ available: [{ startMs: t("2026-11-23T14:00:00Z"), endMs: t("2026-11-23T17:00:00Z") }], occupied: [{ startMs: t("2026-11-23T15:00:00Z"), endMs: t("2026-11-23T16:00:00Z") }], totalMinutes: 50, preferredBlockMinutes: 25, maxDailyMinutes: 60 });
  assert.equal(result.unscheduledMinutes, 0);
  assert.equal(result.sessions.reduce((sum, s) => sum + s.minutes, 0), 50);
  for (const s of result.sessions) assert.equal(s.startMs < t("2026-11-23T16:00:00Z") && s.endMs > t("2026-11-23T15:00:00Z"), false);
});
test("daily load cap enforced and overflow reported", () => {
  const result = planStudySessions({ available: [{ startMs: t("2026-11-23T12:00:00Z"), endMs: t("2026-11-23T18:00:00Z") }], occupied: [], totalMinutes: 120, preferredBlockMinutes: 25, maxDailyMinutes: 60 });
  assert.equal(result.sessions.reduce((sum, s) => sum + s.minutes, 0), 60);
  assert.equal(result.unscheduledMinutes, 60);
  assert.equal(result.warnings.length, 1);
});
test("empty work uses no sessions", () => {
  assert.deepEqual(planStudySessions({ available: [], occupied: [], totalMinutes: 0, preferredBlockMinutes: 25, maxDailyMinutes: 60 }).sessions, []);
});
test("invalid settings rejected", () => assert.throws(() => planStudySessions({ available: [], occupied: [], totalMinutes: -1, preferredBlockMinutes: 25, maxDailyMinutes: 60 })));
