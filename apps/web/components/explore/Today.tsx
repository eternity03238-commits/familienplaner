"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Compass, Moon, Sun } from "lucide-react";
import { DEMO_DAY, DEMO_NOW, events } from "../../lib/preview/fixtures.ts";
import { currentAndNext, formatDay, formatTime, minutesUntil, visibleEventsFor } from "../../lib/preview/model.ts";
import { FocusDialog } from "../FocusDialog.tsx";
import { SceneHero } from "../art/SceneHero.tsx";
import { ART_ENABLED } from "../../lib/art/paths.ts";
import { ActionButton, Eyebrow, SectionHeading, TaskTile } from "../ui.tsx";
import { exploreViewer, useExplore } from "./ExploreState.tsx";

export function Today() {
  const { missions, stages, world, setWorld, toggle } = useExplore();
  const [focusId, setFocusId] = useState<string | null>(null);
  const done = missions.filter(m => m.done).length;
  const next = missions.find(m => !m.done);
  const { next: nextEvent } = currentAndNext(visibleEventsFor(exploreViewer, events), DEMO_NOW);
  const focus = missions.find(m => m.id === focusId);
  const stagesDone = stages.filter(s => s.done).length;
  return (
    <>
      <section className={`fo-hero fo-hero--${world} ${ART_ENABLED ? "fo-art-enabled" : ""}`} aria-labelledby="hero-title">
        <SceneHero scene="observatory" time={world} eager/>
        <button type="button" className="fo-hero__toggle" aria-pressed={world === "night"} onClick={() => setWorld(world === "dusk" ? "night" : "dusk")}>
          {world === "dusk" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          <span className="fo-sr-only">Nachtansicht</span>
        </button>
        <div className="fo-hero__text">
          <Eyebrow>{formatDay(DEMO_NOW)}</Eyebrow>
          <h1 id="hero-title">Heute läuft.</h1>
          <p>{nextEvent ? <>Um <strong>{formatTime(nextEvent.startsAt!)}</strong>: {nextEvent.title} · in {minutesUntil(nextEvent.startsAt!, DEMO_NOW)} Min.</> : "Für heute steht nichts mehr an."}</p>
        </div>
      </section>

      <div className="fo-dayprogress">
        <span className="fo-dayprogress__badge" aria-hidden="true"><Compass size={20} /></span>
        <div className="fo-dayprogress__copy">
          <strong>{done} von {missions.length} Missionen</strong>
          <div className="fo-progress-track" role="progressbar" aria-label="Missionen heute" aria-valuenow={done} aria-valuemin={0} aria-valuemax={missions.length} aria-valuetext={`${done} von ${missions.length}`}>
            <div style={{ width: `${missions.length ? Math.round((100 * done) / missions.length) : 0}%` }} />
          </div>
        </div>
      </div>

      {next ? (
        <button type="button" className="fo-nextmove" onClick={() => setFocusId(next.id)} aria-haspopup="dialog">
          <span className="fo-nextmove__copy"><Eyebrow>Dein nächster Move</Eyebrow><strong>{next.title}</strong><span>{next.subject} · {next.estimateMinutes} Minuten Fokus</span></span>
          <span className="fo-nextmove__arrow" aria-hidden="true"><ChevronRight size={19} /></span>
        </button>
      ) : (
        <div className="fo-nextmove fo-nextmove--done"><span className="fo-nextmove__copy"><Eyebrow>Alles erledigt</Eyebrow><strong>Heute ist nichts mehr offen.</strong><span>Zeit für Freizeit.</span></span></div>
      )}

      <section aria-labelledby="missionen-heute" className="fo-stack">
        <SectionHeading id="missionen-heute" title="Deine Missionen" action={<span className="fo-section-heading__aside">{DEMO_DAY === DEMO_NOW.slice(0, 10) ? "Heute" : ""}</span>} />
        <ul className="fo-list">
          {missions.map(m => (
            <li key={m.id}><TaskTile kind={m.kind} title={m.title} detail={`${m.subject} · bis ${m.dueOn.slice(8, 10)}.${m.dueOn.slice(5, 7)}.`} minutes={m.estimateMinutes} done={m.done} onToggle={() => toggle(m.id)} /></li>
          ))}
        </ul>
      </section>

      <Link href="/explore/projekt" className="fo-feature fo-feature--expedition">
        <Eyebrow>Projekt der Woche</Eyebrow>
        <strong>Referat: Vulkane</strong>
        <span>{stagesDone} von {stages.length} Etappen <ChevronRight size={17} aria-hidden="true" /></span>
        <span className="fo-feature__meter" aria-hidden="true"><i style={{inlineSize:`${stages.length ? 100 * stagesDone / stages.length : 0}%`}} /></span>
      </Link>

      <FocusDialog open={!!focus} onClose={() => setFocusId(null)} labelledBy="focus-title">
        {focus && <>
          <Eyebrow>Mission Fokus</Eyebrow>
          <h2 id="focus-title">{focus.title}</h2>
          <p>{focus.subject}, etwa {focus.estimateMinutes} Minuten. Mach Pausen, wenn du sie brauchst.</p>
          <div className="fo-dialog__actions">
            <ActionButton tone="quiet" data-autofocus onClick={() => setFocusId(null)}>Später</ActionButton>
            <ActionButton tone="success" onClick={() => { toggle(focus.id); setFocusId(null); }}><Check size={16} aria-hidden="true" /> Als erledigt markieren</ActionButton>
          </div>
        </>}
      </FocusDialog>
    </>
  );
}
