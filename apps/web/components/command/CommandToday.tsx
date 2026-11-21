"use client";
import { TriangleAlert } from "lucide-react";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer } from "../../lib/preview/fixtures.ts";
import {
  applyChildFilter, currentAndNext, formatDay, formatLocalDate, formatTime, loadWarnings, minutesUntil, railForDay, visibleEventsFor
} from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { ChildTag } from "../ChildTag.tsx";
import { EmptyState } from "../EmptyState.tsx";
import { MemberFilter } from "../MemberFilter.tsx";
import { TimeRail } from "../TimeRail.tsx";
import { DemoPill, Eyebrow, SectionHeading, TaskTile } from "../ui.tsx";
import { useCommand } from "./CommandState.tsx";

/** Command "Heute": Now/Next, risks, agenda (the one emphasis), approvals, open tasks (V1.3 "Today + Next + Risks"). */
export function CommandToday() {
  const { filter, setFilter, missions, proposals, toggle, decide } = useCommand();
  const visible = applyChildFilter(visibleEventsFor(guardianViewer, events), filter);
  const rail = railForDay(visible, DEMO_DAY);
  const { current, next } = currentAndNext(visible, DEMO_NOW);
  const warnings = loadWarnings(events, missions, DEMO_DAY).filter(w => filter === "all" || w.child === filter);
  const shownProposals = applyChildFilter(proposals, filter);
  const pending = shownProposals.filter(p => p.status === "pending").length;
  const open = applyChildFilter(missions, filter).filter(m => !m.done).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  return (
    <div className="fo-command">
      <header className="fo-viewhead">
        <div className="fo-viewhead__row"><Eyebrow as="p">{formatDay(DEMO_NOW)} · {formatTime(DEMO_NOW)} Uhr</Eyebrow><DemoPill /></div>
        <h1>Alles im Blick.</h1>
        <p>Zwei Schulen. Ein gemeinsamer Rhythmus.</p>
      </header>
      <MemberFilter value={filter} onChange={setFilter} />

      <div className="fo-command__grid">
        <div className="fo-command__main">
          <section className="fo-next" aria-labelledby="next-title">
            {next ? <>
              <p className="fo-eyebrow">Als Nächstes · in {minutesUntil(next.startsAt!, DEMO_NOW)} Min.</p>
              <p className="fo-next__time"><time dateTime={next.startsAt}>{formatTime(next.startsAt!)}</time></p>
              <h2 id="next-title">{next.title}</h2>
              <p className="fo-next__meta">{(next.owner === "A" || next.owner === "B") && <ChildTag child={next.owner} long />} bis {formatTime(next.endsAt!)}{next.detail ? `, ${next.detail}` : ""}</p>
            </> : <h2 id="next-title">Heute steht nichts mehr an.</h2>}
            {current && <p className="fo-next__current">Läuft gerade: {current.title}{current.owner === "A" || current.owner === "B" ? ` (Kind ${current.owner})` : ""} bis {formatTime(current.endsAt!)}</p>}
          </section>

          <dl className="fo-stats">
            <div><dt>Termine heute</dt><dd>{rail.timed.length}</dd></div>
            <div><dt>Hinweise</dt><dd>{warnings.length}</dd></div>
            <div><dt>Freigaben offen</dt><dd>{pending}</dd></div>
          </dl>

          {warnings.map(w => (
            <div key={w.child} className="fo-alert" role="note"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Belastung prüfen</strong><p>{w.text}</p></div></div>
          ))}

          <section aria-labelledby="agenda" className="fo-stack">
            <SectionHeading id="agenda" title="Heute in der Familie" action={<span className="fo-section-heading__aside">{filter === "all" ? "Alle" : `Kind ${filter}`}</span>} />
            {rail.timed.length + rail.allDay.length === 0
              ? <EmptyState title="Keine Termine für diese Auswahl." />
              : <TimeRail group={rail} now={DEMO_NOW} nowLabel={`${formatTime(DEMO_NOW)} jetzt`} labelledBy="agenda" />}
            <p className="fo-fineprint">Private Termine anderer Erwachsener erscheinen nur als belegt. Private Termine der Kinder sind hier nicht sichtbar. Der Filter ist eine Ansicht, keine Berechtigung.</p>
          </section>
        </div>

        <div className="fo-command__side">
          <section aria-labelledby="freigaben" className="fo-stack">
            <SectionHeading id="freigaben" title="Freigaben" action={<span className="fo-section-heading__aside">{pending} offen</span>} />
            {shownProposals.length === 0 ? <EmptyState title="Keine Vorschläge für diese Auswahl." />
              : shownProposals.map(p => <AIProposalCard key={p.id} proposal={p} canDecide onDecide={decide} />)}
          </section>
          <section aria-labelledby="aufgaben" className="fo-stack">
            <SectionHeading id="aufgaben" title="Offene Aufgaben" action={<span className="fo-section-heading__aside">{open.length}</span>} />
            {open.length === 0 ? <EmptyState title="Alles erledigt." />
              : <ul className="fo-list">{open.map(m => <li key={m.id}><TaskTile kind={m.kind} title={m.title} detail={`${m.subject} · bis ${formatLocalDate(m.dueOn)}`} minutes={m.estimateMinutes} done={m.done} onToggle={() => toggle(m.id)} aside={<ChildTag child={m.child} />} /></li>)}</ul>}
          </section>
        </div>
      </div>
    </div>
  );
}
