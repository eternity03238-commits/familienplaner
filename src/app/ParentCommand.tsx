"use client";

import { useMemo, useState } from "react";
import { ActionButton, SourcePill, StatusChip } from "../components/ui";
import { AlertTriangle, ArrowRight, CalendarClock, Check, ChevronRight, Clock3, GraduationCap, LockKeyhole, ShieldCheck, Sparkles, Users, WandSparkles } from "lucide-react";

export type ParentTab = "today" | "calendar" | "project" | "profile";
type MemberFilter = "all" | "childA" | "childB";
type FamilyEvent = { id:string; at:string; until:string; title:string; child:Exclude<MemberFilter,"all">; category:"school"|"sport"|"study"; source:string };
const events:FamilyEvent[]=[
  {id:"a1",at:"08:00",until:"13:10",title:"Unterricht · Gymnasium",child:"childA",category:"school",source:"Schule · Demo"},
  {id:"b1",at:"08:10",until:"13:25",title:"Unterricht · Gemeinschaftsschule",child:"childB",category:"school",source:"Schule · Demo"},
  {id:"a2",at:"15:00",until:"15:25",title:"Mathe · Brüche üben",child:"childA",category:"study",source:"FamilyOS · Demo"},
  {id:"b2",at:"16:30",until:"18:00",title:"Sporttraining",child:"childB",category:"sport",source:"Privater Termin · Demo"},
  {id:"a3",at:"17:15",until:"17:45",title:"Referat vorbereiten",child:"childA",category:"study",source:"FamilyOS · Demo"},
];
const filterText:Record<MemberFilter,string>={all:"Alle",childA:"Kind A",childB:"Kind B"};
const nextWeek=["Mo","Di","Mi","Do","Fr"];
export default function ParentCommand({tab}:{tab:ParentTab}){
  const [filter,setFilter]=useState<MemberFilter>("all");
  const [proposal,setProposal]=useState<"pending"|"accepted"|"dismissed">("pending");
  const [expanded,setExpanded]=useState(false);
  const [weekday,setWeekday]=useState(1);
  const visible=useMemo(()=>events.filter(e=>filter==="all"||e.child===filter),[filter]);
  const conflicts=filter==="childB"?0:1;
  return <section className="view parent-command" aria-label="FamilyOS Command Center">
    <div className="command-heading"><span className="overline">FAMILYOS / COMMAND</span><StatusChip tone="warning">Demo</StatusChip></div>
    <h2 className="view-title">{tab==="today"?"Alles im Blick.":tab==="calendar"?"Unsere Woche.":tab==="project"?"Planung mit Köpfchen.":"Familie & Zugriff."}</h2>
    <p className="subtle">{tab==="today"?"Zwei Schulen. Ein gemeinsamer Rhythmus.":tab==="calendar"?"Alle Termine übersichtlich und nachvollziehbar.":tab==="project"?"Vorschläge prüfen, bevor etwas geändert wird.":"Personen, Ansichten und Privatsphäre."}</p>
    <div className="command-filters" role="group" aria-label="Familienmitglied auswählen">
      {(["all","childA","childB"] as const).map(key=><button key={key} className={filter===key?"selected":""} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{key==="all"?<Users size={14}/>:<span className={`member-dot ${key}`}/>} {filterText[key]}</button>)}
    </div>
    {tab==="today"&&<>
      <div className="command-stats">
        <div><span>HEUTE</span><strong>{visible.length}</strong><small>Termine</small></div>
        <div><span>IM BLICK</span><strong>{conflicts}</strong><small>Hinweis{conflicts===1?"": "e"}</small></div>
      </div>
      {conflicts>0&&<div className="command-alert"><AlertTriangle size={18}/><div><strong>Zeit für die Planung prüfen</strong><p>Kind A: Referatsarbeit und Lernen am selben Nachmittag. Die Belastung könnte hoch sein.</p></div></div>}
      <h3 className="command-section-heading">Heute in der Familie <span>{filterText[filter]}</span></h3>
      <EventRail items={visible}/>
      <Proposal proposal={proposal} setProposal={setProposal} expanded={expanded} setExpanded={setExpanded}/>
    </>}
    {tab==="calendar"&&<>
      <div className="command-dates">{nextWeek.map((d,i)=><button key={d} className={weekday===i?"selected":""} aria-pressed={weekday===i} onClick={()=>setWeekday(i)}><span>{d}</span><strong>{20+i}</strong></button>)}</div>
      <div className="command-daynote"><CalendarClock size={16}/><span>{weekday===1?"Demo-Dienstag: gemeinsamer Überblick":"Beispiel für "+nextWeek[weekday]+": keine gespeicherten Schultermine in diesem Demo-Datensatz"}</span></div>
      {weekday===1?<EventRail items={visible}/>:<div className="command-empty">Keine Termine in dieser Vorschau für den gewählten Tag.</div>}
    </>}
    {tab==="project"&&<>
      <div className="command-planning-head"><WandSparkles size={20}/><div><strong>Schulwoche vorbereiten</strong><p>Überblick über die geplanten Lernblöcke und Belastung.</p></div></div>
      <div className="command-load"><span>Kind A <b>2 Lernblöcke</b></span><div><i style={{width:"65%"}}/></div><small>Schulaufgaben und Referat · Demo</small></div>
      <div className="command-load"><span>Kind B <b>1 Sporttermin</b></span><div><i style={{width:"38%"}}/></div><small>Schule und Training · Demo</small></div>
      <Proposal proposal={proposal} setProposal={setProposal} expanded={expanded} setExpanded={setExpanded}/>
    </>}
    {tab==="profile"&&<div className="command-privacy">
      <div className="command-privacy-row"><span className="command-privacy-icon"><Users size={19}/></span><div><strong>Familie</strong><small>2 Erwachsene, 2 Kinder · Beispieldaten</small></div><Check size={18}/></div>
      <div className="command-privacy-row"><span className="command-privacy-icon"><LockKeyhole size={19}/></span><div><strong>Getrennte Kinderprofile</strong><small>Klassen, Aufgaben und Termine bleiben zugeordnet</small></div><ShieldCheck size={18}/></div>
      <div className="command-privacy-row"><span className="command-privacy-icon"><GraduationCap size={19}/></span><div><strong>Patchwork-Freigaben</strong><small>Architektur vorgesehen, hier noch nicht aktiv</small></div><ArrowRight size={18}/></div>
      <p className="command-privacy-note">Dies ist eine Designvorschau ohne Authentifizierung. Filter ersetzen keine echten Zugriffsberechtigungen.</p>
    </div>}
    <div className="command-source"><SourcePill source="FamilyOS" status="demo"/></div>
  </section>;
}
function EventRail({items}:{items:FamilyEvent[]}){
  return <div className="command-event-rail">
    {items.length===0?<div className="command-empty">Für diese Auswahl sind keine Termine vorhanden.</div>:items.map(e=><div className="command-event" key={e.id}>
      <time>{e.at}</time><div className={`command-event-card ${e.category}`}><div className="command-event-title"><span className={`member-dot ${e.child}`}/><strong>{e.title}</strong></div><div className="command-event-meta"><Clock3 size={12}/>{e.at}–{e.until}<span>· {filterText[e.child]}</span></div><div className="command-origin">{e.source}</div></div>
    </div>)}
  </div>;
}
function Proposal({proposal,setProposal,expanded,setExpanded}:{proposal:"pending"|"accepted"|"dismissed";setProposal:(v:"pending"|"accepted"|"dismissed")=>void;expanded:boolean;setExpanded:(v:boolean)=>void}){
  return <div className="command-proposal">
    <div className="overline"><Sparkles size={14}/> KI-PLANUNG · MUSTER</div>
    <h3>{proposal==="pending"?"Ein Vorschlag für nächste Woche":proposal==="accepted"?"Vorschlag in der Demo bestätigt":"Vorschlag in der Demo verworfen"}</h3>
    <p>Eine kurze Wiederholung der Mathe-Themen könnte vor dem Referat sinnvoll sein. Das würde keinen bestehenden Termin überschreiben.</p>
    {expanded&&<div className="command-explain"><strong>Warum dieser Vorschlag?</strong><span>Demodaten: ein offener Mathe-Lernblock, ein Referatsprojekt und ein freies Zeitfenster. Keine echte KI-Analyse und keine automatische Optimierung.</span></div>}
    <button className="command-explain-btn" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>Warum wird das vorgeschlagen? <ChevronRight size={15}/></button>
    <div className="command-proposal-actions">
      <ActionButton tone="quiet" onClick={()=>setProposal("dismissed")} disabled={proposal!=="pending"}>Ablehnen</ActionButton>
      <ActionButton onClick={()=>setProposal("accepted")} disabled={proposal!=="pending"}><Check size={15}/> Demo freigeben</ActionButton>
      {proposal!=="pending"&&<button onClick={()=>setProposal("pending")}>Zurücksetzen</button>}
    </div>
  </div>;
}
