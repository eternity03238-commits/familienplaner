"use client";
import { useMemo, useState } from "react";
import {
  applyChildFilter, currentAndNext, decideProposal, formatLocalDate, formatTime, minutesUntil, railForDay, toggleMission,
  type ChildFilter, type Mission, type PreviewEvent, type StudyProposal, type Viewer, visibleEventsFor
} from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { ChildTag } from "../ChildTag.tsx";
import { EmptyState } from "../EmptyState.tsx";
import { MissionCard } from "../MissionCard.tsx";
import { NowNext } from "../NowNext.tsx";
import { SectionHeading } from "../PageHeader.tsx";
import { SegmentedFilter } from "../SegmentedFilter.tsx";
import { TimeRail } from "../TimeRail.tsx";

const filterOptions = [{ value: "all", label: "Alle" }, { value: "A", label: "Kind A" }, { value: "B", label: "Kind B" }] as const;

export function ParentDashboard({ viewer, events, missions: initialMissions, proposals: initialProposals, now, day, dayLabel }: {
  viewer: Viewer; events: PreviewEvent[]; missions: Mission[]; proposals: StudyProposal[]; now: string; day: string; dayLabel: string;
}) {
  const [filter, setFilter] = useState<ChildFilter>("all");
  const [missions, setMissions] = useState(initialMissions);
  const [proposals, setProposals] = useState(initialProposals);

  const visible = useMemo(() => applyChildFilter(visibleEventsFor(viewer, events), filter), [viewer, events, filter]);
  const rail = railForDay(visible, day);
  const { current, next } = currentAndNext(visible, now);
  const upcoming = applyChildFilter(allDayLater(visible, day), filter);
  const open = applyChildFilter(missions, filter).filter(m => !m.done).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const pending = applyChildFilter(proposals, filter);
  const pendingCount = proposals.filter(p => p.status === "pending").length;

  return (
    <>
      <div className="fo-dash__top">
        <p className="fo-dash__date">{dayLabel}</p>
        <SegmentedFilter legend="Ansicht filtern" name="child-filter" value={filter} options={filterOptions} onChange={setFilter} />
      </div>

      {next ? (
        <NowNext
          headingLevel={1}
          label={`Als Nächstes, in ${minutesUntil(next.startsAt!, now)} Min.`}
          time={formatTime(next.startsAt!)}
          title={next.title}
          meta={<>{next.owner === "A" || next.owner === "B" ? <ChildTag child={next.owner} long /> : null} bis {formatTime(next.endsAt!)}{next.detail ? `, ${next.detail}` : ""}</>}
          action={{ href: "#tag", label: "Ganzen Tag ansehen" }}
          current={current ? <>Läuft gerade: {current.title}{current.owner === "A" || current.owner === "B" ? ` (Kind ${current.owner})` : ""} bis {formatTime(current.endsAt!)}</> : undefined}
        />
      ) : (
        <EmptyState title="Für heute steht nichts mehr an.">Morgen beginnt mit dem ersten Termin aus der Zeitleiste.</EmptyState>
      )}

      <div className="fo-dash__grid">
        <section aria-labelledby="tag" className="fo-dash__rail">
          <SectionHeading id="tag" title="Heute" aside={<span className="fo-num">{rail.timed.length} Termine</span>} />
          {rail.timed.length + rail.allDay.length === 0
            ? <EmptyState title="Keine Termine für diese Auswahl." />
            : <TimeRail group={rail} now={now} nowLabel={`${formatTime(now)} jetzt`} labelledBy="tag" />}
          <p className="fo-privacy-note">Private Termine anderer Erwachsener erscheinen nur als belegt. Private Termine der Kinder sind hier nicht sichtbar.</p>
        </section>

        <div className="fo-dash__side">
          <section aria-labelledby="freigaben">
            <SectionHeading id="freigaben" title="Freigaben" aside={pendingCount > 0 ? <span className="fo-count"><span className="fo-num">{pendingCount}</span> offen</span> : "keine offen"} />
            {pending.length === 0
              ? <EmptyState title="Keine Vorschläge für diese Auswahl." />
              : <div className="fo-stack">{pending.map(p => <AIProposalCard key={p.id} proposal={p} canDecide onDecide={(id, d) => setProposals(ps => decideProposal(ps, id, d, viewer))} />)}</div>}
          </section>

          <section aria-labelledby="fristen">
            <SectionHeading id="fristen" title="Offene Aufgaben" aside={<span className="fo-num">{open.length}</span>} />
            {open.length === 0
              ? <EmptyState title="Alles erledigt." >Neue Aufgaben tragen Kinder oder Eltern selbst ein.</EmptyState>
              : <ul className="fo-missions">{open.map(m => <MissionCard key={m.id} mission={m} showChild onToggle={id => setMissions(ms => toggleMission(ms, id, viewer))} />)}</ul>}
          </section>

          {upcoming.length > 0 && (
            <section aria-labelledby="demnaechst">
              <SectionHeading id="demnaechst" title="Demnächst ganztägig" />
              <ul className="fo-upcoming">
                {upcoming.map(e => <li key={e.id}><span className="fo-num">{formatLocalDate(e.date!)}</span><span>{e.title}</span>{(e.owner === "A" || e.owner === "B") && <ChildTag child={e.owner} />}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function allDayLater<T extends { allDay?: boolean; date?: string }>(events: readonly T[], day: string): T[] {
  return events.filter(e => e.allDay && e.date! > day).sort((a, b) => a.date!.localeCompare(b.date!));
}
