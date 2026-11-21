"use client";
import { useState } from "react";
import { ActionButton, Eyebrow, ProgressLine, SectionHeading, SourcePill, StatusChip, SurfaceCard, TaskTile } from "../../components/ui";
import "./showcase.css";
export default function DesignSystemPage(){
 const [theme,setTheme]=useState<"dark"|"light">("dark");
 const [role,setRole]=useState<"child"|"parent">("child");
 const [done,setDone]=useState(false);
 return <main className="showcase" data-fo-theme={theme} data-fo-role={role}>
  <div className="showcase-inner">
   <Eyebrow>FAMILYOS / DESIGN SYSTEM V2</Eyebrow>
   <div className="showcase-title"><div><h1>Eine Welt.<br/><em>Zwei Perspektiven.</em></h1><p>Die lebendige Explore-Welt und das ruhige Command Center nutzen dieselben verständlichen, zugänglichen Bausteine.</p></div><a href="/">← Zur App-Demo</a></div>
   <div className="showcase-options" role="group" aria-label="Designvarianten">
    <ActionButton tone={theme==="dark"?"primary":"secondary"} aria-pressed={theme==="dark"} onClick={()=>setTheme("dark")}>Dark</ActionButton>
    <ActionButton tone={theme==="light"?"primary":"secondary"} aria-pressed={theme==="light"} onClick={()=>setTheme("light")}>Light</ActionButton>
    <ActionButton tone={role==="child"?"primary":"secondary"} aria-pressed={role==="child"} onClick={()=>setRole("child")}>Explore</ActionButton>
    <ActionButton tone={role==="parent"?"primary":"secondary"} aria-pressed={role==="parent"} onClick={()=>setRole("parent")}>Command</ActionButton>
   </div>
   <div className="showcase-grid">
    <SurfaceCard><Eyebrow>TYPOGRAPHY</Eyebrow><h2>Heute läuft.</h2><p>Weniger Ablenkung. Mehr Klarheit. Ein guter Plan lässt Platz fürs echte Leben.</p><SectionHeading title="Deine Missionen" action={<StatusChip tone="success">In Bewegung</StatusChip>}/></SurfaceCard>
    <SurfaceCard><Eyebrow>INTERAKTIONEN</Eyebrow><div className="showcase-actions"><ActionButton onClick={()=>setDone(v=>!v)}>{done?"Zurücksetzen":"Mission starten"}</ActionButton><ActionButton tone="secondary">Details</ActionButton><ActionButton tone="quiet">Später</ActionButton></div><TaskTile title="Mathe · Brüche" detail="Übungsblatt 1–3" minutes={20} done={done} onToggle={()=>setDone(v=>!v)}/></SurfaceCard>
    <SurfaceCard><Eyebrow>STATUS UND VERTRAUEN</Eyebrow><div className="showcase-actions"><SourcePill source="Google Kalender" status="demo"/><SourcePill source="Schulportal" status="stale"/><StatusChip tone="warning">Prüfung nötig</StatusChip></div><ProgressLine value={done?3:2} total={5} label="Projektetappen"/></SurfaceCard>
    <SurfaceCard><Eyebrow>FARBLOGIK</Eyebrow><div className="swatches"><div className="swatch s-interactive">Aktion</div><div className="swatch s-success">Erledigt</div><div className="swatch s-warning">Hinweis</div></div><p>Farben sind Zustände, keine Dekoration. Texte und Symbole kommunizieren dieselbe Information zusätzlich.</p></SurfaceCard>
   </div>
   <p className="showcase-foot">Diese Seite zeigt ein Designsystem mit fiktiven Daten; sie ist keine verbundene Familienverwaltung.</p>
  </div>
 </main>;
}
