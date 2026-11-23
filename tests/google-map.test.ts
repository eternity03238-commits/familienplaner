import test from "node:test";
import assert from "node:assert/strict";
import { calendarsToSync, mapGoogleEvent, needsReconnect } from "../apps/web/lib/google/map.ts";

test("timed events keep UTC instants; zero-length events get 15 minutes", () => {
  const [r] = mapGoogleEvent("cal", { id: "e1", etag: "\"1\"", summary: " Zahnarzt ", location: "Praxis", start: { dateTime: "2026-11-24T11:00:00+01:00" }, end: { dateTime: "2026-11-24T11:45:00+01:00" } });
  assert.deepEqual(r, { external_id: "cal:e1", version: "\"1\"", title: "Zahnarzt", location: "Praxis", all_day: false, event_date: null, starts_at: "2026-11-24T10:00:00.000Z", ends_at: "2026-11-24T10:45:00.000Z" });
  const [z] = mapGoogleEvent("cal", { id: "e2", start: { dateTime: "2026-11-24T10:00:00Z" }, end: { dateTime: "2026-11-24T10:00:00Z" } });
  assert.equal(z.ends_at, "2026-11-24T10:15:00.000Z");
  assert.equal(z.title, "(Ohne Titel)");
});

test("all-day events are dates (one row per day, end exclusive, capped)", () => {
  const rows = mapGoogleEvent("cal", { id: "h", summary: "Ferien", start: { date: "2026-12-21" }, end: { date: "2026-12-24" } });
  assert.deepEqual(rows.map(r => [r.external_id, r.event_date, r.all_day, r.starts_at]), [
    ["cal:h", "2026-12-21", true, null], ["cal:h:2026-12-22", "2026-12-22", true, null], ["cal:h:2026-12-23", "2026-12-23", true, null]]);
  assert.equal(mapGoogleEvent("cal", { id: "long", start: { date: "2026-01-01" }, end: { date: "2027-01-01" } }).length, 31);
});

test("cancelled, malformed and oversized input is dropped or truncated, never thrown", () => {
  assert.deepEqual(mapGoogleEvent("cal", { id: "x", status: "cancelled", start: { dateTime: "2026-11-24T10:00:00Z" } }), []);
  assert.deepEqual(mapGoogleEvent("cal", { nope: true }), []);
  assert.deepEqual(mapGoogleEvent("cal", { id: "y", start: { dateTime: "kaputt" } }), []);
  assert.equal(mapGoogleEvent("cal", { id: "z", summary: "x".repeat(900), start: { dateTime: "2026-11-24T10:00:00Z" } })[0].title.length, 500);
});

test("only calendars visible in Google, primary first, at most 10", () => {
  const list = [{ id: "a", selected: true }, { id: "hidden", selected: true, hidden: true }, { id: "off", selected: false }, { id: "me", primary: true },
    ...Array.from({ length: 15 }, (_, i) => ({ id: `c${i}`, selected: true }))];
  const out = calendarsToSync(list).map(c => c.id);
  assert.equal(out[0], "me"); assert.equal(out.length, 10);
  assert.ok(!out.includes("hidden") && !out.includes("off"));
  assert.ok(needsReconnect("invalid_grant") && !needsReconnect("temporarily_unavailable"));
});
