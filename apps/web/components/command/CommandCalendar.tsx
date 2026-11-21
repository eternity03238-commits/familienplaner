"use client";
import { useState } from "react";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer } from "../../lib/preview/fixtures.ts";
import { applyChildFilter, formatLocalDate, railForDay, visibleEventsFor, workWeek } from "../../lib/preview/model.ts";
import { EmptyState } from "../EmptyState.tsx";
import { MemberFilter } from "../MemberFilter.tsx";
import { TimeRail } from "../TimeRail.tsx";
import { Eyebrow } from "../ui.tsx";
import { WeekStrip } from "../WeekStrip.tsx";
import { useCommand } from "./CommandState.tsx";

export function CommandCalendar() {
  const { filter, setFilter } = useCommand();
  const [day, setDay] = useState(DEMO_DAY);
  const rail = railForDay(applyChildFilter(visibleEventsFor(guardianViewer, events), filter), day);
  return (
    <div className="fo-command fo-command--narrow">
      <header className="fo-viewhead"><Eyebrow as="p">Kalender</Eyebrow><h1>Unsere Woche.</h1><p>Alle Termine mit Herkunft und Sync-Status.</p></header>
      <MemberFilter value={filter} onChange={setFilter} />
      <WeekStrip days={workWeek(DEMO_DAY)} value={day} onChange={setDay} label="Wochentag wählen" />
      <section aria-labelledby="tag" className="fo-stack">
        <h2 id="tag" className="fo-subhead">{formatLocalDate(day)}{day === DEMO_DAY ? " · heute" : ""}</h2>
        {rail.timed.length + rail.allDay.length === 0
          ? <EmptyState title="Keine Termine für diese Auswahl und diesen Tag." />
          : <TimeRail group={rail} now={day === DEMO_DAY ? DEMO_NOW : undefined} nowLabel="jetzt" labelledBy="tag" />}
      </section>
    </div>
  );
}
