"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpenText, Check, ChevronLeft, Clock3, Compass, DraftingCompass, FlagTriangleRight, Lightbulb, Mic2, Mountain, Route } from "lucide-react";
import { project } from "../../lib/preview/fixtures.ts";
import { formatLocalDate } from "../../lib/preview/model.ts";
import { ActionButton, Eyebrow, SectionHeading } from "../ui.tsx";
import { useExplore } from "./ExploreState.tsx";
import { SceneHero } from "../art/SceneHero.tsx";
import { ART_ENABLED } from "../../lib/art/paths.ts";

const stageIcons = [Compass, BookOpenText, DraftingCompass, Lightbulb, Mic2] as const;

/**
 * V3: An expedition that remains a real accessible ordered list.
 * Scenery enhances only the hero; stage selection and completion are still HTML controls.
 */
export function Expedition() {
  const { stages, toggleStage } = useExplore();
  const firstOpen = stages.findIndex(s => !s.done);
  const [selected, setSelected] = useState(firstOpen === -1 ? 0 : firstOpen);
  const stage = stages[selected];
  const done = stages.filter(x => x.done).length;
  const percent = stages.length ? (done / stages.length) * 100 : 0;
  const allDone = stages.length > 0 && done === stages.length;
  return (
    <>
      <Link href="/explore" className="fo-back"><ChevronLeft size={18} aria-hidden="true" /> Mein Tag</Link>

      <header className={`fo-project-hero fo-expedition-hero ${ART_ENABLED ? "fo-art-enabled" : ""}`}>
        <SceneHero scene="volcano" eager />
        <div className="fo-expedition-hero__copy">
          <Eyebrow as="p"><Mountain size={14} aria-hidden="true"/> Deine große Mission · {project.subject}</Eyebrow>
          <h1>Referat: Vulkane</h1>
          <p>Abgabe {formatLocalDate(project.dueOn)}</p>
        </div>
        <span className="fo-expedition-hero__mark" aria-hidden="true"><Mountain size={21}/></span>
      </header>

      <section aria-labelledby="route" className="fo-stack fo-expedition">
        <SectionHeading id="route" title="Expeditionsroute" action={<span className="fo-section-heading__aside">{done}/{stages.length} Etappen</span>}/>
        <p className="fo-fineprint">Fünf kleine Schritte statt einer großen Aufgabe.</p>
        <div className="fo-expedition__overview" role="group" aria-label="Projektfortschritt">
          <div className="fo-expedition__overview-head">
            <span><Route size={15} aria-hidden="true" /> {allDone ? "Ziel erreicht" : "Auf dem Weg zum Ziel"}</span>
            <strong>{Math.round(percent)} %</strong>
          </div>
          <div className="fo-expedition__meter" role="progressbar" aria-label="Abgeschlossene Projektetappen" aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={done} aria-valuetext={`${done} von ${stages.length} Etappen geschafft`}>
            <span style={{inlineSize:`${percent}%`}}/>
          </div>
        </div>

        <ol className="fo-route fo-route--expedition">
          {stages.map((step,i)=>{
            const Icon=stageIcons[i] ?? FlagTriangleRight;
            const selectedHere=i===selected;
            return (
              <li key={step.title} className={`fo-route__stop ${step.done?"is-done":""} ${selectedHere?"is-selected":""}`}>
                <button type="button" aria-pressed={selectedHere} aria-controls="etappe" onClick={()=>setSelected(i)}>
                  <span className="fo-route__node" aria-hidden="true">{step.done?<Check size={18}/>:<Icon size={19} strokeWidth={1.9}/>}</span>
                  <span className="fo-route__copy">
                    <strong><span className="fo-route__step-num">Etappe {i+1}</span>{step.title}</strong>
                    <small>{step.minutes} Min. · {step.done ? "geschafft" : `bis ${formatLocalDate(step.dueOn)}`}</small>
                  </span>
                  <span className="fo-route__trailing" aria-hidden="true">{selectedHere?"AKTIV":step.done?"✓":String(i+1).padStart(2,"0")}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="etappe" className="fo-stage fo-stage--expedition" aria-labelledby="etappe-titel" aria-live="polite">
        <div className="fo-stage__kicker"><Eyebrow as="p">Etappe {selected+1} von {stages.length}</Eyebrow><span className="fo-stage__state">{stage.done?"Geschafft":"Als Nächstes"}</span></div>
        <h2 id="etappe-titel">{stage.title}</h2>
        <p>{stage.description}</p>
        <div className="fo-stage__actions">
          <span><Clock3 size={15} aria-hidden="true"/> ca. {stage.minutes} Minuten</span>
          <ActionButton tone={stage.done?"quiet":"success"} onClick={()=>toggleStage(selected)}>
            {stage.done?"Wieder öffnen":<><Check size={16} aria-hidden="true"/> Etappe abschließen</>}
          </ActionButton>
        </div>
      </section>
      <p className="fo-expedition__footer"><FlagTriangleRight size={16} aria-hidden="true"/>{allDone?"Expedition geschafft. Gut gemacht!":"Jede Etappe zählt. Du entscheidest über dein Tempo."}</p>
    </>
  );
}
