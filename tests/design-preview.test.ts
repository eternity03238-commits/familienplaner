import test from "node:test";
import assert from "node:assert/strict";
import {
  applyChildFilter, currentAndNext, decideProposal, formatLocalDate, formatTime, progress, railForDay, sourceText, toggleMission, visibleEventsFor,
  type Viewer
} from "../apps/web/lib/preview/model.ts";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer, missions, proposals } from "../apps/web/lib/preview/fixtures.ts";

const ids = (xs: { id: string }[]) => xs.map(x => x.id).sort();
const childA: Viewer = { kind: "child", id: "A" };
const childB: Viewer = { kind: "child", id: "B" };

test("guardian: other adult's private event is visible only as a redacted busy slot", () => {
  const v = visibleEventsFor(guardianViewer, events);
  const slot = v.find(e => e.id === "e-ad2-private")!;
  assert.equal(slot.redacted, true);
  assert.equal(slot.title, "Privater Termin");
  assert.equal(slot.detail, undefined);
  assert.ok(!JSON.stringify(v).includes("Termin Ärztin"), "private title must not reach the client view model");
});
test("guardian: own private events in full, children's private events not at all", () => {
  const v = visibleEventsFor(guardianViewer, events);
  assert.equal(v.find(e => e.id === "e-ad1-dentist")?.redacted, false);
  assert.equal(v.some(e => e.id === "e-a-private"), false);
});
test("guardian of child A only never sees child B", () => {
  const v = visibleEventsFor({ kind: "guardian", id: "adult2", children: ["A"] }, events);
  assert.equal(v.some(e => e.owner === "B"), false);
});
test("child: sees own events (incl. private) and shared family events; never sibling or adults", () => {
  const a = visibleEventsFor(childA, events);
  assert.ok(a.every(e => e.owner === "A" || e.owner === "family"));
  assert.ok(a.some(e => e.id === "e-a-private"));
  const b = visibleEventsFor(childB, events);
  assert.equal(b.some(e => e.owner === "A"), false);
  assert.equal(b.some(e => e.owner === "adult1" || e.owner === "adult2"), false);
});
test("child filter keeps family-wide items and removes the other child", () => {
  const v = visibleEventsFor(guardianViewer, events);
  const onlyB = applyChildFilter(v, "B");
  assert.equal(onlyB.some(e => e.owner === "A"), false);
  assert.ok(onlyB.some(e => e.owner === "B"));
  assert.ok(onlyB.some(e => e.owner === "family"));
  assert.deepEqual(ids(applyChildFilter(v, "all")), ids(v));
  assert.ok(applyChildFilter(missions, "A").every(m => m.child === "A"));
});
test("time rail: all-day separately, timed chronologically, by Europe/Berlin day", () => {
  const rail = railForDay(visibleEventsFor(guardianViewer, events), DEMO_DAY);
  assert.deepEqual(rail.allDay.map(e => e.id), ["e-a-allday"]);
  const starts = rail.timed.map(e => Date.parse(e.startsAt!));
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  assert.equal(formatTime(rail.timed[0].startsAt!), "07:45");
});
test("now/next: redacted slots are never presented as 'next'", () => {
  const { current, next } = currentAndNext(visibleEventsFor(guardianViewer, events), DEMO_NOW);
  assert.equal(current?.id, "e-b-school");
  assert.equal(next?.id, "e-ad1-pickup");
  const later = currentAndNext(visibleEventsFor(guardianViewer, events), "2026-11-24T13:50:00Z");
  assert.notEqual(later.next?.id, "e-ad2-private");
});
test("missions: a child can only tick own missions and nothing but `done` changes", () => {
  const after = toggleMission(missions, "m-a-math", childA);
  const changed = after.find(m => m.id === "m-a-math")!;
  const before = missions.find(m => m.id === "m-a-math")!;
  assert.equal(changed.done, !before.done);
  assert.deepEqual({ ...changed, done: before.done }, before);
  assert.deepEqual(toggleMission(missions, "m-b-ger", childA), missions, "child A must not tick child B's mission");
  assert.equal(progress(after.filter(m => m.child === "A")).label, "3 von 4 erledigt");
});
test("proposals: only guardians of that child decide, once", () => {
  assert.deepEqual(decideProposal(proposals, "p-a-math", "approved", childA), proposals);
  assert.deepEqual(decideProposal(proposals, "p-b-ger", "approved", { kind: "guardian", id: "adult2", children: ["A"] }), proposals);
  const approved = decideProposal(proposals, "p-a-math", "approved", guardianViewer);
  assert.equal(approved[0].status, "approved");
  assert.equal(decideProposal(approved, "p-a-math", "rejected", guardianViewer)[0].status, "approved");
});
test("study proposal comes from the deterministic planning engine and respects buffer and daily cap", () => {
  const p = proposals[0];
  assert.equal(p.sessions.reduce((n, s) => n + s.minutes, 0), 125);
  const days = p.sessions.map(s => s.startsAt.slice(0, 10));
  assert.equal(new Set(days).size, days.length, "max one 25-min block per day");
  assert.ok(days.every(d => d < "2026-12-02"), "two buffer days before the exam stay free");
  const fri = p.sessions.find(s => s.startsAt.startsWith("2026-11-27"))!;
  assert.equal(formatTime(fri.startsAt), "16:00", "Friday block starts after the fixed 15:00–16:00 appointment");
});
test("sync status is never claimed without a confirmed timestamp", () => {
  assert.match(sourceText({ provider: "google_calendar", label: "Google Kalender", status: "synced" }, DEMO_NOW), /unbestätigt/);
  assert.match(sourceText({ provider: "school_import", label: "Schulplattform", status: "not_connected" }, DEMO_NOW), /nicht verbunden/);
  assert.match(sourceText({ provider: "google_calendar", label: "Google Kalender", status: "stale", lastSyncedAt: "2026-11-23T06:40:00Z" }, DEMO_NOW), /veraltet/);
});
test("dates render in German and Europe/Berlin without UTC day shift", () => {
  assert.equal(formatLocalDate("2026-12-03"), "Do., 3. Dez.");
  assert.equal(formatTime("2026-11-24T23:30:00Z"), "00:30");
});
test("fixtures contain no personal names, e-mail addresses or real school names", () => {
  const blob = JSON.stringify({ events, missions, proposals });
  assert.doesNotMatch(blob, /@|Gymnasium [A-ZÄÖÜ]|Schule [A-ZÄÖÜ][a-zäöü]+straße/);
});

import { loadWarnings, toggleStage, workWeek, weekdayShort } from "../apps/web/lib/preview/model.ts";
import { project } from "../apps/web/lib/preview/fixtures.ts";

test("workload hint: child A (training + study + due tasks) gets one, child B not", () => {
  const w = loadWarnings(events, missions, DEMO_DAY);
  assert.deepEqual(w.map(x => x.child), ["A"]);
  assert.match(w[0].text, /neben dem Training/);
  const afterTick = toggleMission(missions, "m-a-math", childA);
  assert.deepEqual(loadWarnings(events, afterTick, DEMO_DAY), [], "ticking off the open task removes the hint");
  assert.deepEqual(loadWarnings(events, missions, DEMO_DAY, 240), [], "threshold is a setting");
});
test("expedition stages: only owner child or guardian toggles, nothing else changes", () => {
  const after = toggleStage(project.steps, 1, childA, "A");
  assert.equal(after[1].done, true);
  assert.deepEqual({ ...after[1], done: false }, project.steps[1]);
  assert.deepEqual(toggleStage(project.steps, 1, childB, "A"), project.steps);
  assert.deepEqual(toggleStage(project.steps, 9, childA, "A"), project.steps);
  assert.equal(toggleStage(project.steps, 1, guardianViewer, "A")[1].done, true);
});
test("work week is Mon–Fri in local dates; each weekday has its own fixtures", () => {
  const week = workWeek(DEMO_DAY);
  assert.deepEqual(week, ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"]);
  assert.deepEqual(week.map(weekdayShort), ["Mo", "Di", "Mi", "Do", "Fr"]);
  const counts = week.map(d => railForDay(visibleEventsFor(childA, events), d).timed.length);
  assert.ok(new Set(counts).size > 1, "days differ (V1.2 audit: weekday switch must change data)");
});
test("every mission has a kind; sport is never presented as a homework mission", () => {
  assert.ok(missions.every(m => ["study", "sport", "project", "everyday"].includes(m.kind)));
});
