"use client";
import { useState } from "react";
import {
  currentAndNext, formatTime, minutesUntil, progress, railForDay, toggleMission,
  type Mission, type PreviewEvent, type StudyProposal, type Viewer, visibleEventsFor
} from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { EmptyState } from "../EmptyState.tsx";
import { MissionCard } from "../MissionCard.tsx";
import { NowNext } from "../NowNext.tsx";
import { SectionHeading } from "../PageHeader.tsx";
import { ProgressMeter } from "../ProgressMeter.tsx";
import { TimeRail } from "../TimeRail.tsx";

export function ChildToday({ viewer, events, missions: initial, proposals, now, day, dayLabel, project }: {
  viewer: Viewer & { kind: "child" }; events: PreviewEvent[]; missions: Mission[]; proposals: StudyProposal[]; now: string; day: string; dayLabel: string;
  project: { title: string; done: number; total: number; nextStep: string };
}) {
  const [missions, setMissions] = useState(() => initial.filter(m => m.child === viewer.id));
  const visible = visibleEventsFor(viewer, events);
  const rail = railForDay(visible, day);
  const { next } = currentAndNext(visible, now);
  const p = progress(missions);
  const mine = proposals.filter(x => x.child === viewer.id && x.status === "pending");
  const [justDone, setJustDone] = useState<string | null>(null);

  const toggle = (id: string) => {
    const before = missions.find(m => m.id === id);
    setMissions(ms => toggleMission(ms, id, viewer));
    setJustDone(before && !before.done ? before.title : null);
  };

  return (
    <>
      <p className="fo-dash__date">{dayLabel}</p>
      {next
        ? <NowNext headingLevel={1} label={`Als Nächstes, in ${minutesUntil(next.startsAt!, now)} Min.`} time={formatTime(next.startsAt!)} title={next.title}
            meta={<>bis {formatTime(next.endsAt!)}{next.detail ? `, ${next.detail}` : ""}</>} action={{ href: "#aufgaben", label: "Aufgaben dafür ansehen" }} />
        : <EmptyState title="Heute steht nichts mehr an." />}

      <section aria-labelledby="aufgaben" className="fo-child__missions">
        <SectionHeading id="aufgaben" title="Deine Aufgaben" aside={<ProgressMeter done={p.done} total={p.total} label={p.label} />} />
        <ul className="fo-missions">{missions.map(m => <MissionCard key={m.id} mission={m} onToggle={toggle} />)}</ul>
        <p className="fo-live" aria-live="polite">{justDone ? `Erledigt: ${justDone}.` : ""}</p>
      </section>

      <section aria-labelledby="projekt" className="fo-project-teaser">
        <SectionHeading id="projekt" title={project.title} aside={<span><span className="fo-num">{project.done}</span> von <span className="fo-num">{project.total}</span> Etappen</span>} />
        <p>Nächste Etappe: <strong>{project.nextStep}</strong></p>
        <a className="fo-button fo-button--secondary" href="/design-preview/study">Projektpfad öffnen</a>
      </section>

      <section aria-labelledby="tag">
        <SectionHeading id="tag" title="Dein Tag" />
        <TimeRail group={rail} now={now} nowLabel={`${formatTime(now)} jetzt`} showChild={false} labelledBy="tag" />
      </section>

      {mine.length > 0 && (
        <section aria-labelledby="vorschlaege">
          <SectionHeading id="vorschlaege" title="Vorgeschlagene Lernzeiten" />
          <div className="fo-stack">{mine.map(x => <AIProposalCard key={x.id} proposal={x} canDecide={false} showChild={false} />)}</div>
        </section>
      )}
    </>
  );
}
