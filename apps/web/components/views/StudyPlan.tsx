"use client";
import { useState } from "react";
import { decideProposal, formatLocalDate, type StudyProposal, type Viewer } from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { SectionHeading } from "../PageHeader.tsx";
import { ProgressMeter } from "../ProgressMeter.tsx";

export function StudyPlan({ viewer, proposal: initial, project, exam, unscheduledMinutes }: {
  viewer: Viewer; proposal: StudyProposal;
  project: { title: string; subject: string; dueOn: string; steps: { title: string; dueOn: string; done: boolean }[] };
  exam: { title: string; examOn: string; topics: string[] };
  unscheduledMinutes: number;
}) {
  const [proposal, setProposal] = useState(initial);
  const done = project.steps.filter(s => s.done).length;
  const currentIndex = project.steps.findIndex(s => !s.done);
  return (
    <>
      <section aria-labelledby="pfad" className="fo-path">
        <SectionHeading id="pfad" title={project.title} aside={<span>Abgabe {formatLocalDate(project.dueOn)}</span>} />
        <ProgressMeter done={done} total={project.steps.length} label={`${done} von ${project.steps.length} Etappen geschafft`} />
        <ol className="fo-path__steps">
          {project.steps.map((s, i) => (
            <li key={s.title} className={s.done ? "is-done" : i === currentIndex ? "is-current" : undefined} aria-current={i === currentIndex ? "step" : undefined}>
              <span className="fo-path__num fo-num" aria-hidden="true">{i + 1}</span>
              <span className="fo-path__title">{s.title}</span>
              <span className="fo-path__date">{s.done ? "erledigt" : `bis ${formatLocalDate(s.dueOn)}`}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pruefung" className="fo-forecast">
        <SectionHeading id="pruefung" title={exam.title} aside={<span>{formatLocalDate(exam.examOn)}</span>} />
        <p className="fo-forecast__topics">Themen: {exam.topics.join(", ")}</p>
        <AIProposalCard proposal={proposal} canDecide={viewer.kind === "guardian"} showChild={false} headingLevel={3}
          onDecide={(id, d) => setProposal(p => decideProposal([p], id, d, viewer)[0])} />
        {unscheduledMinutes > 0 && <p className="fo-warning" role="alert">{unscheduledMinutes} Minuten passen nicht in die freien Zeitfenster. Lieber weniger planen als den Tag überfüllen.</p>}
        <p className="fo-privacy-note">Berechnet von der Planungsregel-Engine mit Beispieldaten. Im Prototyp gibt es keinen KI-Aufruf und keine Kalenderänderung.</p>
      </section>
    </>
  );
}
