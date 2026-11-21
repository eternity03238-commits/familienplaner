"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, Clock3 } from "lucide-react";
import { project } from "../../lib/preview/fixtures.ts";
import { formatLocalDate } from "../../lib/preview/model.ts";
import { ActionButton, Eyebrow, SectionHeading } from "../ui.tsx";
import { useExplore } from "./ExploreState.tsx";
import { SceneHero } from "../art/SceneHero.tsx";
import { GITHUB_SCENES_AVAILABLE } from "../../lib/art/paths.ts";

/** Project route = the one visual emphasis of the project module (V2). Stages: select, read, complete/reopen. */
export function Expedition() {
  const { stages, toggleStage } = useExplore();
  const firstOpen = stages.findIndex(s => !s.done);
  const [selected, setSelected] = useState(firstOpen === -1 ? 0 : firstOpen);
  const s = stages[selected];
  const done = stages.filter(x => x.done).length;
  return (
    <>
      <Link href="/explore" className="fo-back"><ChevronLeft size={18} aria-hidden="true" /> Mein Tag</Link>
      <header className={`fo-project-hero ${GITHUB_SCENES_AVAILABLE ? "fo-art-enabled" : ""}`}>
        <SceneHero scene="volcano" eager />
        <Eyebrow as="p">Deine große Mission · {project.subject}</Eyebrow>
        <h1>Referat: Vulkane</h1>
        <p>Abgabe {formatLocalDate(project.dueOn)}</p>
      </header>
      <section aria-labelledby="route" className="fo-stack">
        <SectionHeading id="route" title="Expeditionsroute" action={<span className="fo-section-heading__aside">{done}/{stages.length} Etappen</span>} />
        <p className="fo-fineprint">Fünf kleine Schritte statt einer großen Aufgabe.</p>
        <ol className="fo-route">
          {stages.map((st, i) => (
            <li key={st.title} className={`fo-route__stop ${st.done ? "is-done" : ""} ${i === selected ? "is-selected" : ""}`}>
              <button type="button" aria-pressed={i === selected} aria-controls="etappe" onClick={() => setSelected(i)}>
                <span className="fo-route__node" aria-hidden="true">{st.done ? <Check size={15} /> : i + 1}</span>
                <span className="fo-route__copy"><strong>{st.title}</strong><small>{st.minutes} Min. · {st.done ? "geschafft" : `bis ${formatLocalDate(st.dueOn)}`}</small></span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <section id="etappe" className="fo-stage" aria-labelledby="etappe-titel" aria-live="polite">
        <Eyebrow as="p">Etappe {selected + 1} von {stages.length}</Eyebrow>
        <h2 id="etappe-titel">{s.title}</h2>
        <p>{s.description}</p>
        <div className="fo-stage__actions">
          <span><Clock3 size={15} aria-hidden="true" /> ca. {s.minutes} Minuten</span>
          <ActionButton tone={s.done ? "quiet" : "success"} onClick={() => toggleStage(selected)}>
            {s.done ? "Wieder öffnen" : <><Check size={16} aria-hidden="true" /> Etappe abschließen</>}
          </ActionButton>
        </div>
      </section>
    </>
  );
}
