"use client";
import { proposals } from "../../lib/preview/fixtures.ts";
import { formatLocalDate } from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { Eyebrow, ProgressLine, SectionHeading, TaskTile } from "../ui.tsx";
import { exploreViewer, useExplore } from "./ExploreState.tsx";

export function Missions() {
  const { missions, toggle } = useExplore();
  const open = missions.filter(m => !m.done);
  const done = missions.filter(m => m.done);
  const pending = proposals.filter(p => p.child === exploreViewer.id && p.status === "pending");
  return (
    <>
      <header className="fo-viewhead"><Eyebrow as="p">Dein Fokus</Eyebrow><h1>Missionen.</h1><p>Alles Wichtige, ohne Ablenkung.</p></header>
      <ProgressLine value={done.length} total={missions.length} label="Tagesfortschritt" />
      <section aria-labelledby="offen" className="fo-stack">
        <SectionHeading id="offen" title="Offen" action={<span className="fo-section-heading__aside">{open.length}</span>} />
        {open.length === 0 ? <p className="fo-fineprint">Alles erledigt.</p> : (
          <ul className="fo-list">{open.map(m => <li key={m.id}><TaskTile kind={m.kind} title={m.title} detail={`${m.subject} · bis ${formatLocalDate(m.dueOn)}`} minutes={m.estimateMinutes} done={false} onToggle={() => toggle(m.id)} /></li>)}</ul>
        )}
      </section>
      {done.length > 0 && (
        <section aria-labelledby="erledigt" className="fo-stack">
          <SectionHeading id="erledigt" title="Erledigt" action={<span className="fo-section-heading__aside">{done.length}</span>} />
          <ul className="fo-list">{done.map(m => <li key={m.id}><TaskTile kind={m.kind} title={m.title} detail={m.subject} done onToggle={() => toggle(m.id)} /></li>)}</ul>
        </section>
      )}
      {pending.length > 0 && (
        <section aria-labelledby="vorschlaege" className="fo-stack">
          <SectionHeading id="vorschlaege" title="Vorgeschlagene Lernzeiten" />
          {pending.map(p => <AIProposalCard key={p.id} proposal={p} canDecide={false} showChild={false} />)}
        </section>
      )}
    </>
  );
}
