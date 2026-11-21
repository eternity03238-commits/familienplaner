"use client";
import { DEMO_DAY, events, exam, project, unscheduledMinutes } from "../../lib/preview/fixtures.ts";
import { applyChildFilter, formatLocalDate, workWeek, localDate } from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { ChildTag } from "../ChildTag.tsx";
import { MemberFilter } from "../MemberFilter.tsx";
import { Eyebrow, ProgressLine, SectionHeading } from "../ui.tsx";
import { useCommand } from "./CommandState.tsx";

const WEEK_CAP = 5 * 60; // display scale: the configurable default of max. 60 extra minutes per school day

/** Planning: weekly load per child, project route and explainable proposals (decisions stay with guardians). */
export function CommandPlanning() {
  const { filter, setFilter, missions, proposals, decide } = useCommand();
  const week = new Set(workWeek(DEMO_DAY));
  const load = (["A", "B"] as const).filter(c => filter === "all" || c === filter).map(child => {
    const study = events.filter(e => e.owner === child && e.kind === "study" && e.startsAt && week.has(localDate(e.startsAt)))
      .reduce((n, e) => n + (Date.parse(e.endsAt!) - Date.parse(e.startsAt!)) / 60_000, 0);
    const open = missions.filter(m => m.child === child && !m.done && m.kind !== "everyday").reduce((n, m) => n + m.estimateMinutes, 0);
    return { child, minutes: Math.round(study + open) };
  });
  const shown = applyChildFilter(proposals, filter);
  const stagesDone = project.steps.filter(s => s.done).length;
  return (
    <div className="fo-command">
      <header className="fo-viewhead"><Eyebrow as="p">Planung</Eyebrow><h1>Planung mit Köpfchen.</h1><p>Vorschläge prüfen, bevor etwas geändert wird.</p></header>
      <MemberFilter value={filter} onChange={setFilter} />
      <div className="fo-command__grid">
        <div className="fo-command__main">
          <section aria-labelledby="last" className="fo-stack">
            <SectionHeading id="last" title="Lernzeit diese Woche" />
            {load.map(l => (
              <div key={l.child} className="fo-load">
                <p><ChildTag child={l.child} long /> <span>{l.minutes} von {WEEK_CAP} Minuten</span></p>
                <div className="fo-progress-track" role="progressbar" aria-label={`Lernzeit Kind ${l.child}`} aria-valuenow={l.minutes} aria-valuemin={0} aria-valuemax={WEEK_CAP} aria-valuetext={`${l.minutes} von ${WEEK_CAP} Minuten`}>
                  <div style={{ width: `${Math.min(100, Math.round((100 * l.minutes) / WEEK_CAP))}%` }} />
                </div>
              </div>
            ))}
            <p className="fo-fineprint">Geplante Lernblöcke plus offene Aufgaben. Obergrenze 60 Minuten pro Schultag, einstellbar.</p>
          </section>
          {(filter === "all" || filter === project.child) && (
            <section aria-labelledby="projekt" className="fo-stack">
              <SectionHeading id="projekt" title={project.title} action={<span className="fo-section-heading__aside">Abgabe {formatLocalDate(project.dueOn)}</span>} />
              <ProgressLine value={stagesDone} total={project.steps.length} label="Etappen" />
              <ol className="fo-route fo-route--compact">
                {project.steps.map((s, i) => (
                  <li key={s.title} className={`fo-route__stop ${s.done ? "is-done" : ""}`}><div className="fo-route__row"><span className="fo-route__node" aria-hidden="true">{i + 1}</span><span className="fo-route__copy"><strong>{s.title}</strong><small>{s.done ? "geschafft" : `bis ${formatLocalDate(s.dueOn)}`}</small></span></div></li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <div className="fo-command__side">
          <section aria-labelledby="vorschlaege" className="fo-stack">
            <SectionHeading id="vorschlaege" title="Lernpläne" />
            {(filter === "all" || filter === exam.child) && <p className="fo-fineprint">{exam.title} am {formatLocalDate(exam.examOn)} · Themen: {exam.topics.join(", ")}</p>}
            {shown.map(p => <AIProposalCard key={p.id} proposal={p} canDecide onDecide={decide} />)}
            {unscheduledMinutes > 0 && <p className="fo-alert" role="alert">{unscheduledMinutes} Minuten passen nicht in die freien Zeitfenster.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
