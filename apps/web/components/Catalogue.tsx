"use client";
import Link from "next/link";
import { useState } from "react";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer, missions, proposals } from "../lib/preview/fixtures.ts";
import { railForDay, visibleEventsFor, type ChildFilter, type Source } from "../lib/preview/model.ts";
import { AIProposalCard } from "./AIProposalCard.tsx";
import { ChildTag } from "./ChildTag.tsx";
import { EmptyState, Skeleton } from "./EmptyState.tsx";
import { MemberFilter } from "./MemberFilter.tsx";
import { Observatory } from "./Observatory.tsx";
import { TimeRail } from "./TimeRail.tsx";
import { ActionButton, DemoPill, Eyebrow, ProgressLine, SectionHeading, SourcePill, StatusChip, SurfaceCard, TaskTile } from "./ui.tsx";

const sources: Source[] = [
  { provider: "google_calendar", label: "Google Kalender", status: "synced", lastSyncedAt: "2026-11-24T12:58:00Z" },
  { provider: "google_calendar", label: "Google Kalender", status: "stale", lastSyncedAt: "2026-11-23T06:40:00Z" },
  { provider: "school_import", label: "Schulplattform", status: "not_connected" },
  { provider: "manual", label: "Elternteil", status: "manual" }
];

/** Interactive catalogue (V2 /design-system): every primitive in both themes and both roles. */
export function Catalogue() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [role, setRole] = useState<"child" | "parent">("child");
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState<ChildFilter>("all");
  const [p, setP] = useState(proposals[1]);
  const rail = railForDay(visibleEventsFor(guardianViewer, events).filter(e => ["e-ad2-private", "e-a-study", "e-a-football", "e-a-allday", "e-ad1-pickup"].includes(e.id)), DEMO_DAY);
  return (
    <div className="fo-app fo-catalogue" data-fo-theme={theme} data-fo-role={role}>
      <a className="fo-skip" href="#inhalt">Zum Inhalt springen</a>
      <main id="inhalt" className="fo-catalogue__main" tabIndex={-1}>
        <Eyebrow as="p">FamilyOS · Design-System V2</Eyebrow>
        <div className="fo-catalogue__title">
          <h1>Eine Welt.<br />Zwei Perspektiven.</h1>
          <p>Explore und Command nutzen dieselben verständlichen, zugänglichen Bausteine. Rolle und Thema sind Darstellung, keine Berechtigung.</p>
          <Link href="/">Zur Startseite</Link>
        </div>
        <div className="fo-catalogue__options" role="group" aria-label="Darstellungsvarianten">
          <ActionButton tone={theme === "dark" ? "primary" : "secondary"} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dunkel</ActionButton>
          <ActionButton tone={theme === "light" ? "primary" : "secondary"} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Hell</ActionButton>
          <ActionButton tone={role === "child" ? "primary" : "secondary"} aria-pressed={role === "child"} onClick={() => setRole("child")}>Explore</ActionButton>
          <ActionButton tone={role === "parent" ? "primary" : "secondary"} aria-pressed={role === "parent"} onClick={() => setRole("parent")}>Command</ActionButton>
        </div>
        <div className="fo-catalogue__grid">
          <SurfaceCard aria-labelledby="c1"><SectionHeading id="c1" title="Typografie" level={2} /><p className="fo-catalogue__display">Heute läuft.</p><p>Weniger Ablenkung. Mehr Klarheit. Ein guter Plan lässt Platz fürs echte Leben.</p><SectionHeading title="Deine Missionen" level={3} action={<StatusChip tone="success">In Bewegung</StatusChip>} /></SurfaceCard>
          <SurfaceCard aria-labelledby="c2"><SectionHeading id="c2" title="Interaktionen" level={2} /><div className="fo-row"><ActionButton onClick={() => setDone(v => !v)}>{done ? "Zurücksetzen" : "Mission starten"}</ActionButton><ActionButton tone="secondary">Details</ActionButton><ActionButton tone="quiet">Später</ActionButton><ActionButton tone="success">Erledigt</ActionButton><ActionButton disabled>Gesperrt</ActionButton></div><TaskTile kind="study" title="Mathe · Brüche" detail="Übungsblatt 1–3" minutes={20} done={done} onToggle={() => setDone(v => !v)} /></SurfaceCard>
          <SurfaceCard aria-labelledby="c3"><SectionHeading id="c3" title="Status und Vertrauen" level={2} /><div className="fo-row fo-row--wrap">{sources.map(s => <SourcePill key={s.status} source={s} now={DEMO_NOW} />)}<DemoPill /><StatusChip tone="warning">Prüfung nötig</StatusChip></div><ProgressLine value={done ? 3 : 2} total={5} label="Projektetappen" /></SurfaceCard>
          <SurfaceCard aria-labelledby="c4"><SectionHeading id="c4" title="Farblogik" level={2} /><div className="fo-swatches"><span className="fo-swatch fo-swatch--interactive">Aktion</span><span className="fo-swatch fo-swatch--success">Erledigt</span><span className="fo-swatch fo-swatch--warning">Hinweis</span></div><p>Farben sind Zustände, keine Dekoration. Text und Symbole tragen dieselbe Information.</p><p className="fo-row"><ChildTag child="A" long /> <ChildTag child="B" long /></p></SurfaceCard>
          <SurfaceCard aria-labelledby="c5" className="fo-catalogue__wide"><SectionHeading id="c5" title="Observatorium (Abend und Nacht)" level={2} /><div className="fo-row fo-row--scenes"><div className="fo-scene"><Observatory world="dusk" /></div><div className="fo-scene"><Observatory world="night" /></div></div></SurfaceCard>
          <SurfaceCard aria-labelledby="c6"><SectionHeading id="c6" title="Filter und Zeitleiste" level={2} /><MemberFilter value={filter} onChange={setFilter} /><TimeRail group={rail} now={DEMO_NOW} nowLabel="14:10 jetzt" labelledBy="c6" /></SurfaceCard>
          <SurfaceCard aria-labelledby="c7"><SectionHeading id="c7" title="Vorschlag mit Begründung" level={2} /><AIProposalCard proposal={p} canDecide onDecide={(_, d) => setP(x => (x.status === "pending" ? { ...x, status: d } : x))} />{p.status !== "pending" && <ActionButton tone="quiet" onClick={() => setP(proposals[1])}>Beispiel zurücksetzen</ActionButton>}</SurfaceCard>
          <SurfaceCard aria-labelledby="c8"><SectionHeading id="c8" title="Zustände" level={2} /><EmptyState title="Keine Termine für diese Auswahl.">Wähle „Alle“, um die ganze Familie zu sehen.</EmptyState><EmptyState tone="warning" title="Google Kalender seit gestern nicht abgeglichen.">Termine können veraltet sein. Erneut verbinden, sobald die Anmeldung freigegeben ist.</EmptyState><EmptyState tone="locked" title="Kein Zugriff auf diesen Bereich.">Für diesen Bereich liegt keine Freigabe vor.</EmptyState><EmptyState tone="warning" title="Offline.">Du siehst den zuletzt geladenen Stand. Änderungen sind erst wieder online möglich.</EmptyState><Skeleton lines={3} label="Zeitleiste wird geladen" /></SurfaceCard>
        </div>
        <p className="fo-fineprint">Fiktive Daten; keine verbundene Familienverwaltung. {missions.length} Beispielmissionen im Datensatz.</p>
      </main>
    </div>
  );
}
