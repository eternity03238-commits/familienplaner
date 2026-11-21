"use client";
import { useState } from "react";
import type { Mission, RailGroup, Source, StudyProposal } from "../../lib/preview/model.ts";
import { AIProposalCard } from "../AIProposalCard.tsx";
import { ChildTag } from "../ChildTag.tsx";
import { EmptyState, Skeleton } from "../EmptyState.tsx";
import { MissionCard } from "../MissionCard.tsx";
import { NowNext } from "../NowNext.tsx";
import { SectionHeading } from "../PageHeader.tsx";
import { ProgressMeter } from "../ProgressMeter.tsx";
import { SegmentedFilter } from "../SegmentedFilter.tsx";
import { SourceStatus } from "../SourceStatus.tsx";
import { TimeRail } from "../TimeRail.tsx";

/** UI catalogue (Storybook equivalent without extra tooling): every component in its relevant states. */
export function Catalogue({ now, rail, mission, proposal, sources }: { now: string; rail: RailGroup; mission: Mission; proposal: StudyProposal; sources: Source[] }) {
  const [f, setF] = useState<"all" | "A" | "B">("all");
  const [m, setM] = useState(mission);
  const [p, setP] = useState(proposal);
  return (
    <div className="fo-catalogue">
      <Entry id="c-nownext" title="NowNext">
        <NowNext label="Als Nächstes, in 50 Min." time="15:00" title="Lernblock Mathe" meta="bis 15:25, Brüche kürzen" action={{ href: "#c-rail", label: "Ganzen Tag ansehen" }} current="Läuft gerade: Unterricht (Kind B) bis 14:30" />
      </Entry>
      <Entry id="c-filter" title="SegmentedFilter">
        <SegmentedFilter legend="Beispielfilter" name="cat-filter" value={f} onChange={setF} options={[{ value: "all", label: "Alle" }, { value: "A", label: "Kind A" }, { value: "B", label: "Kind B" }]} />
        <p className="fo-catalogue__note">Gewählt: {f === "all" ? "Alle" : `Kind ${f}`}</p>
      </Entry>
      <Entry id="c-rail" title="TimeRail mit Ganztägig, Jetzt-Markierung und privatem Termin">
        <TimeRail group={rail} now={now} nowLabel="14:10 jetzt" labelledBy="c-rail-h" />
      </Entry>
      <Entry id="c-mission" title="MissionCard und ProgressMeter">
        <ul className="fo-missions"><MissionCard mission={m} onToggle={() => setM(x => ({ ...x, done: !x.done }))} showChild /></ul>
        <ProgressMeter done={m.done ? 3 : 2} total={5} label={`${m.done ? 3 : 2} von 5 erledigt`} />
      </Entry>
      <Entry id="c-proposal" title="AIProposalCard">
        <AIProposalCard proposal={p} canDecide onDecide={(_, d) => setP(x => (x.status === "pending" ? { ...x, status: d } : x))} />
        {p.status !== "pending" && <button type="button" className="fo-button fo-button--quiet" onClick={() => setP(proposal)}>Beispiel zurücksetzen</button>}
      </Entry>
      <Entry id="c-source" title="SourceStatus">
        <ul className="fo-catalogue__list">{sources.map(s => <li key={s.status}><SourceStatus source={s} now={now} /></li>)}</ul>
      </Entry>
      <Entry id="c-tags" title="ChildTag"><p className="fo-catalogue__row"><ChildTag child="A" long /> <ChildTag child="B" long /></p></Entry>
      <Entry id="c-empty" title="EmptyState und Skeleton">
        <EmptyState title="Keine Termine für diese Auswahl.">Wähle oben „Alle“, um die ganze Familie zu sehen.</EmptyState>
        <Skeleton lines={3} label="Zeitleiste wird geladen" />
      </Entry>
      <Entry id="c-buttons" title="Aktionen">
        <p className="fo-catalogue__row">
          <button type="button" className="fo-button fo-button--primary">Plan freigeben</button>
          <button type="button" className="fo-button fo-button--secondary">Projektpfad öffnen</button>
          <button type="button" className="fo-button fo-button--quiet">Ablehnen</button>
        </p>
        <p className="fo-catalogue__note">Beispielschaltflächen ohne Funktion, nur zur Darstellung der Zustände.</p>
      </Entry>
    </div>
  );
}

function Entry({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="fo-catalogue__entry" aria-labelledby={`${id}-h`} id={id}>
      <SectionHeading id={`${id}-h`} title={title} />
      {children}
    </section>
  );
}
