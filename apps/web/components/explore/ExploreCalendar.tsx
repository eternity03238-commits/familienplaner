"use client";
import { useState } from "react";
import { DEMO_DAY, DEMO_NOW, events } from "../../lib/preview/fixtures.ts";
import { formatLocalDate, railForDay, visibleEventsFor, workWeek } from "../../lib/preview/model.ts";
import { EmptyState } from "../EmptyState.tsx";
import { TimeRail } from "../TimeRail.tsx";
import { Eyebrow } from "../ui.tsx";
import { WeekStrip } from "../WeekStrip.tsx";
import { exploreViewer } from "./ExploreState.tsx";

export function ExploreCalendar() {
  const [day, setDay] = useState(DEMO_DAY);
  const rail = railForDay(visibleEventsFor(exploreViewer, events), day);
  return (
    <>
      <header className="fo-viewhead"><Eyebrow as="p">Kalender</Eyebrow><h1>Deine Woche.</h1><p>Schule, Sport, Lernen und Freizeit.</p></header>
      <WeekStrip days={workWeek(DEMO_DAY)} value={day} onChange={setDay} label="Wochentag wählen" />
      <section aria-labelledby="tag-titel" className="fo-stack">
        <h2 id="tag-titel" className="fo-subhead">{formatLocalDate(day)}{day === DEMO_DAY ? " · heute" : ""}</h2>
        {rail.timed.length + rail.allDay.length === 0
          ? <EmptyState title="Keine Termine an diesem Tag.">Freier Nachmittag – nichts eingetragen.</EmptyState>
          : <TimeRail group={rail} now={day === DEMO_DAY ? DEMO_NOW : undefined} nowLabel="jetzt" showChild={false} showSource={false} labelledBy="tag-titel" />}
      </section>
      <p className="fo-fineprint">Alle Termine sind Beispieldaten. Dein privater Termin ist nur für dich sichtbar.</p>
    </>
  );
}
