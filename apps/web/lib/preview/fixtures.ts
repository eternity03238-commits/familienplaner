/**
 * DEMO fixtures for the design preview. Synthetic only: no real names, schools, accounts or calendars.
 * Fixed demo clock so server and client render identically (no hydration drift) and screenshots are stable.
 * Demo day: Tuesday 2026-11-24, Europe/Berlin (UTC+1). All timestamps are UTC.
 */
import { planStudySessions } from "../../../../packages/planning/src/index.ts";
import type { Mission, PreviewEvent, Source, StudyProposal, Viewer } from "./model.ts";

export const DEMO_NOW = "2026-11-24T13:10:00Z"; // 14:10 Berlin
export const DEMO_DAY = "2026-11-24";

const google: Source = { provider: "google_calendar", label: "Google Kalender", status: "synced", lastSyncedAt: "2026-11-24T12:58:00Z" };
const googleStale: Source = { provider: "google_calendar", label: "Google Kalender", status: "stale", lastSyncedAt: "2026-11-23T06:40:00Z" };
const manual: Source = { provider: "manual", label: "Elternteil", status: "manual" };

export const guardianViewer: Viewer = { kind: "guardian", id: "adult1", children: ["A", "B"] };
export const childViewer: Viewer = { kind: "child", id: "A" };

export const children = [
  { key: "A" as const, label: "Kind A", school: "Gymnasium · Klasse 5" },
  { key: "B" as const, label: "Kind B", school: "Gemeinschaftsschule · Klasse 5" }
];

export const events: PreviewEvent[] = [
  { id: "e-a-school", title: "Unterricht", detail: "bis 6. Stunde", kind: "school", owner: "A", visibility: "shared", startsAt: "2026-11-24T06:45:00Z", endsAt: "2026-11-24T12:20:00Z", source: manual },
  { id: "e-b-school", title: "Unterricht", detail: "Ganztag, Mensa", kind: "school", owner: "B", visibility: "shared", startsAt: "2026-11-24T07:00:00Z", endsAt: "2026-11-24T13:30:00Z", source: manual },
  { id: "e-ad1-dentist", title: "Zahnarzt", detail: "Kontrolle", kind: "appointment", owner: "adult1", visibility: "private", startsAt: "2026-11-24T10:00:00Z", endsAt: "2026-11-24T10:45:00Z", source: google },
  { id: "e-ad1-pickup", title: "Kind B abholen", detail: "Haupteingang", kind: "family", owner: "adult1", visibility: "shared", startsAt: "2026-11-24T13:30:00Z", endsAt: "2026-11-24T13:45:00Z", source: google },
  { id: "e-a-study", title: "Lernblock Mathe", detail: "Brüche kürzen · freigegeben", kind: "study", owner: "A", visibility: "shared", startsAt: "2026-11-24T14:00:00Z", endsAt: "2026-11-24T14:25:00Z", source: manual },
  { id: "e-ad2-private", title: "Termin Ärztin", detail: "nur für Elternteil 2", kind: "appointment", owner: "adult2", visibility: "private", startsAt: "2026-11-24T14:00:00Z", endsAt: "2026-11-24T15:00:00Z", source: googleStale },
  { id: "e-a-football", title: "Fußballtraining", detail: "Sportplatz, Hallenschuhe", kind: "sport", owner: "A", visibility: "shared", startsAt: "2026-11-24T15:30:00Z", endsAt: "2026-11-24T17:00:00Z", source: google },
  { id: "e-b-swim", title: "Schwimmen", detail: "Badesachen", kind: "sport", owner: "B", visibility: "shared", startsAt: "2026-11-24T16:00:00Z", endsAt: "2026-11-24T17:00:00Z", source: google },
  { id: "e-a-private", title: "Treffen im Park", kind: "appointment", owner: "A", visibility: "private", startsAt: "2026-11-24T14:45:00Z", endsAt: "2026-11-24T15:15:00Z", source: manual },
  { id: "e-family-dinner", title: "Abendessen", detail: "alle zu Hause", kind: "family", owner: "family", visibility: "shared", startsAt: "2026-11-24T17:30:00Z", endsAt: "2026-11-24T18:15:00Z", source: manual },
  { id: "e-ad2-evening", title: "Elternabend", detail: "Gemeinschaftsschule, Aula", kind: "school", owner: "adult2", visibility: "shared", startsAt: "2026-11-24T18:30:00Z", endsAt: "2026-11-24T20:00:00Z", source: google },
  { id: "e-b-trip", title: "Wandertag", detail: "Rucksack, Proviant", kind: "school", owner: "B", visibility: "shared", allDay: true, date: "2026-11-26", source: manual },
  // other days of the demo week (Mon 23 – Fri 27 Nov), all synthetic
  { id: "e-a-mon-school", title: "Unterricht", kind: "school", owner: "A", visibility: "shared", startsAt: "2026-11-23T06:45:00Z", endsAt: "2026-11-23T12:20:00Z", source: manual },
  { id: "e-b-mon-school", title: "Unterricht", kind: "school", owner: "B", visibility: "shared", startsAt: "2026-11-23T07:00:00Z", endsAt: "2026-11-23T13:30:00Z", source: manual },
  { id: "e-a-mon-eng", title: "Englisch lernen", detail: "Vokabeln Unit 3", kind: "study", owner: "A", visibility: "shared", startsAt: "2026-11-23T14:00:00Z", endsAt: "2026-11-23T14:20:00Z", source: manual },
  { id: "e-a-wed-school", title: "Unterricht", kind: "school", owner: "A", visibility: "shared", startsAt: "2026-11-25T06:45:00Z", endsAt: "2026-11-25T13:00:00Z", source: manual },
  { id: "e-b-wed-school", title: "Unterricht", kind: "school", owner: "B", visibility: "shared", startsAt: "2026-11-25T07:00:00Z", endsAt: "2026-11-25T13:30:00Z", source: manual },
  { id: "e-a-wed-ref", title: "Referat vorbereiten", detail: "Quellen sammeln", kind: "study", owner: "A", visibility: "shared", startsAt: "2026-11-25T14:30:00Z", endsAt: "2026-11-25T15:00:00Z", source: manual },
  { id: "e-b-wed-swim", title: "Schwimmen", kind: "sport", owner: "B", visibility: "shared", startsAt: "2026-11-25T16:00:00Z", endsAt: "2026-11-25T17:00:00Z", source: google },
  { id: "e-a-thu-school", title: "Unterricht", kind: "school", owner: "A", visibility: "shared", startsAt: "2026-11-26T06:45:00Z", endsAt: "2026-11-26T12:30:00Z", source: manual },
  { id: "e-a-thu-football", title: "Fußballtraining", kind: "sport", owner: "A", visibility: "shared", startsAt: "2026-11-26T15:30:00Z", endsAt: "2026-11-26T17:00:00Z", source: google },
  { id: "e-a-fri-school", title: "Unterricht", kind: "school", owner: "A", visibility: "shared", startsAt: "2026-11-27T06:45:00Z", endsAt: "2026-11-27T11:30:00Z", source: manual },
  { id: "e-b-fri-school", title: "Unterricht", kind: "school", owner: "B", visibility: "shared", startsAt: "2026-11-27T07:00:00Z", endsAt: "2026-11-27T12:30:00Z", source: manual },
  { id: "e-family-fri", title: "Freie Zeit", detail: "nichts geplant", kind: "family", owner: "family", visibility: "shared", startsAt: "2026-11-27T16:00:00Z", endsAt: "2026-11-27T17:00:00Z", source: manual },
  { id: "e-a-allday", title: "Bücherei-Rückgabe", detail: "Sachbuch Vulkane", kind: "school", owner: "A", visibility: "shared", allDay: true, date: "2026-11-24", source: manual }
];

export const missions: Mission[] = [
  { id: "m-a-math", kind: "study", child: "A", title: "Übungsblatt Brüche", subject: "Mathe", estimateMinutes: 20, dueOn: "2026-11-25", done: false, source: manual },
  { id: "m-a-eng", kind: "study", child: "A", title: "Vokabeln Unit 3", subject: "Englisch", estimateMinutes: 15, dueOn: "2026-11-25", done: true, source: manual },
  { id: "m-a-ref", kind: "project", child: "A", title: "Drei Quellen für das Referat", subject: "Geografie", estimateMinutes: 30, dueOn: "2026-11-27", done: false, source: manual },
  { id: "m-a-bag", kind: "everyday", child: "A", title: "Sporttasche packen", subject: "Alltag", estimateMinutes: 5, dueOn: "2026-11-24", done: true, source: manual },
  { id: "m-b-ger", kind: "study", child: "B", title: "Diktat üben, Seite 42", subject: "Deutsch", estimateMinutes: 20, dueOn: "2026-11-27", done: false, source: manual },
  { id: "m-b-bio", kind: "project", child: "B", title: "Steckbrief Igel fertigstellen", subject: "Biologie", estimateMinutes: 25, dueOn: "2026-11-30", done: false, source: manual },
  { id: "m-b-sign", kind: "everyday", child: "B", title: "Elternbrief unterschreiben lassen", subject: "Alltag", estimateMinutes: 2, dueOn: "2026-11-25", done: true, source: manual }
];

export const project = {
  child: "A" as const,
  title: "Referat: Vulkane",
  subject: "Geografie",
  dueOn: "2026-12-04",
  steps: [
    { title: "Thema eingrenzen", minutes: 15, description: "Fragestellung festlegen und kurz mit der Lehrkraft abgleichen.", dueOn: "2026-11-20", done: true },
    { title: "Drei Quellen sammeln", minutes: 30, description: "Drei geeignete Quellen finden und Stichpunkte notieren.", dueOn: "2026-11-27", done: false },
    { title: "Gliederung schreiben", minutes: 25, description: "Einleitung, drei Hauptpunkte und Schluss festlegen.", dueOn: "2026-11-30", done: false },
    { title: "Folien gestalten", minutes: 45, description: "Klare Folien mit Bildern und Quellenangaben erstellen.", dueOn: "2026-12-02", done: false },
    { title: "Vortrag zweimal üben", minutes: 30, description: "Laut proben und auf die verfügbare Zeit achten.", dueOn: "2026-12-03", done: false }
  ]
};;

export const exam = { child: "A" as const, subject: "Mathe", title: "Klassenarbeit Brüche", examOn: "2026-12-03", topics: ["Brüche kürzen", "Erweitern", "Vergleichen"] };

/**
 * The study proposal is computed by the deterministic planning engine (packages/planning), NOT by an AI call.
 * Hard constraints: school, football on Tuesday, family dinner; 25-min blocks, max 60 min/day, 2-day buffer before the exam.
 */
const day = (d: string, from: string, to: string) => ({ startMs: Date.parse(`${d}T${from}:00Z`), endMs: Date.parse(`${d}T${to}:00Z`) });
const plan = planStudySessions({
  // afternoon windows 15:00–17:30 Berlin (= 14:00–16:30 UTC), Wed–Tue; buffer: nothing on 2026-12-02/03
  available: ["2026-11-25", "2026-11-26", "2026-11-27", "2026-11-30", "2026-12-01"].map(d => day(d, "14:00", "16:30")),
  occupied: [day("2026-11-26", "15:30", "17:00"), day("2026-11-27", "14:00", "15:00")], // football Thu 16:30, piano Fri 15:00 Berlin (synthetic)
  totalMinutes: 125,
  preferredBlockMinutes: 25,
  maxDailyMinutes: 25,
  timeZone: "Europe/Berlin"
});

export const proposals: StudyProposal[] = [
  {
    id: "p-a-math",
    child: "A",
    title: "Lernplan Klassenarbeit Brüche",
    subject: "Mathe",
    reason: "Fünf kurze Blöcke vor der Arbeit am 3. Dezember. Zwei Tage Puffer bleiben frei, Training und Klavier werden nicht berührt.",
    constraints: ["25 Minuten pro Block", "höchstens 25 Minuten zusätzlich pro Tag", "2 Tage Puffer vor der Arbeit", "Schule, Training und feste Termine bleiben unverändert"],
    sharedWithAi: ["Klassenstufe 5", "Fach Mathe", "Datum der Arbeit", "Themenliste", "freie Zeitfenster ohne Termintitel"],
    sessions: plan.sessions.map(s => ({ startsAt: new Date(s.startMs).toISOString(), endsAt: new Date(s.endMs).toISOString(), minutes: s.minutes })),
    status: "pending"
  },
  {
    id: "p-b-ger",
    child: "B",
    title: "Diktat am Freitag vorbereiten",
    subject: "Deutsch",
    reason: "Zwei Blöcke an Tagen ohne Schwimmen. Der Wandertag am Donnerstag bleibt frei.",
    constraints: ["20 Minuten pro Block", "kein Block am Wandertag"],
    sharedWithAi: ["Klassenstufe 5", "Fach Deutsch", "Datum des Diktats", "freie Zeitfenster ohne Termintitel"],
    sessions: [
      { startsAt: "2026-11-25T14:30:00Z", endsAt: "2026-11-25T14:50:00Z", minutes: 20 },
      { startsAt: "2026-11-27T13:30:00Z", endsAt: "2026-11-27T13:50:00Z", minutes: 20 }
    ],
    status: "pending"
  }
];

export const planningWarnings = plan.warnings;
export const unscheduledMinutes = plan.unscheduledMinutes;
