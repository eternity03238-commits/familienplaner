"use client";

import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock3, Compass, Home, Layers3, Moon, Sparkles, Sun, UserRound, Zap, Trophy, Dumbbell, FlaskConical, ShieldCheck } from "lucide-react";

type Tab = "today" | "calendar" | "missions" | "project" | "profile";
type Task = { id: string; title: string; subtitle: string; minutes?: number; type: "study" | "sport" | "project"; done: boolean };
const seedTasks: Task[] = [
  { id: "math", title: "Mathe · Brüche", subtitle: "Übungsblatt 1–3", minutes: 20, type: "study", done: false },
  { id: "training", title: "Fußballtraining", subtitle: "16:30–18:00 Uhr", type: "sport", done: true },
  { id: "presentation", title: "Referat · Vulkane", subtitle: "Material sammeln", minutes: 30, type: "project", done: false },
];
const projectSteps = ["Thema auswählen", "Material sammeln", "Gliederung planen", "Präsentation gestalten", "Vortrag üben"];
const NAV: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: "today", label: "Mein Tag", Icon: Home },
  { id: "calendar", label: "Kalender", Icon: CalendarDays },
  { id: "missions", label: "Missionen", Icon: Zap },
  { id: "project", label: "Projekte", Icon: Layers3 },
  { id: "profile", label: "Profil", Icon: UserRound },
];
function MissionIcon({ type }: { type: Task["type"] }) {
  const Icon = type === "study" ? BookOpen : type === "sport" ? Dumbbell : FlaskConical;
  return <span className={`mission-icon ${type}`}><Icon size={21} strokeWidth={1.8}/></span>;
}
function Progress({value}:{value:number}) {
  return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Fortschritt"><div style={{width:`${value}%`}} /></div>;
}
function Observatory() {
  return <svg className="observatory" viewBox="0 0 360 195" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration einer Berglandschaft mit einem leuchtenden Observatorium">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#222457"/><stop offset=".52" stopColor="#775185"/><stop offset="1" stopColor="#e9a67b"/></linearGradient><linearGradient id="mount" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#393669"/><stop offset="1" stopColor="#151937"/></linearGradient></defs>
    <rect width="360" height="195" fill="url(#sky)"/><circle cx="281" cy="51" r="37" fill="#ffdbb0" opacity=".22"/><circle cx="281" cy="51" r="24" fill="#ffe7b4" opacity=".34"/>
    <path d="M0 155L55 87 98 140 149 66 221 154 274 99 360 172V195H0Z" fill="#686191" opacity=".65"/><path d="M0 190L69 139 112 167 177 97 236 169 307 128 360 172V195H0Z" fill="url(#mount)"/>
    <path d="M201 169L229 145 262 150 301 139 336 162 359 195H185Z" fill="#16192d"/>
    <rect x="249" y="106" width="54" height="70" rx="5" fill="#23213e" stroke="#ffcf96" strokeWidth="2"/><path d="M241 108Q277 62 311 108Z" fill="#4e3c67" stroke="#ffd29a" strokeWidth="3"/><path d="M276 77V67M249 98L260 90M304 98L294 90" stroke="#ffc997" strokeWidth="2"/>
    <rect x="260" y="126" width="11" height="20" rx="5" fill="#ffc57d"/><rect x="279" y="126" width="11" height="20" rx="5" fill="#ffc57d"/><path d="M280 176V156" stroke="#ffbb7a" strokeWidth="3"/>
    <circle cx="56" cy="42" r="1.6" fill="#fff"/><circle cx="138" cy="28" r="1.4" fill="#fff"/><circle cx="215" cy="38" r="1.2" fill="#fff"/><circle cx="336" cy="38" r="1.5" fill="#fff"/>
  </svg>;
}
export default function Page() {
  const [tab,setTab]=useState<Tab>("today");
  const [tasks,setTasks]=useState<Task[]>(seedTasks);
  const [steps,setSteps]=useState<boolean[]>([true,true,false,false,false]);
  const [theme,setTheme]=useState<"explore" | "tech">("explore");
  const [mode,setMode]=useState<"child" | "parent">("child");
  const [day,setDay]=useState(1);
  const done=useMemo(()=>tasks.filter(t=>t.done).length,[tasks]);
  const percent=Math.round(100*done/tasks.length);
  const toggleTask=(id:string)=>setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  const taskList=<div className="mission-list">{tasks.map(t=><button className={`mission-row ${t.done?"completed":""}`} key={t.id} type="button" aria-pressed={t.done} onClick={()=>toggleTask(t.id)}><MissionIcon type={t.type}/><span className="mission-copy"><strong>{t.title}</strong><small>{t.subtitle}{t.minutes?` · ${t.minutes} Min.`:""}</small></span><span className={`round-check ${t.done?"is-done":""}`} aria-hidden="true">{t.done?<Check size={17}/>:<Circle size={23}/>}</span></button>)}</div>;
  return <div className={`app-shell theme-${theme}`}>
    <aside className="editorial"><div className="smallcaps">FAMILYOS / EXPLORE 01</div><h1>Dein Tag.<br/><em>Dein Move.</em></h1><p>Mehr als ein Kalender. Ein modernes Mission Control für Schule, Sport und Familie.</p><div className="editorial-rule"/><p className="editorial-small">Klickbarer React-Prototyp · Ausschließlich Beispieldaten · Keine API-Verbindung</p><button className="mode-button" onClick={()=>{setMode(m=>m==="child"?"parent":"child");setTab("today")}}>Ansicht wechseln: {mode==="child"?"Kinder → Eltern":"Eltern → Kinder"} <ChevronRight size={16}/></button></aside>
    <main className="device">
      <div className="ios-status" aria-hidden="true"><span>9:41</span><span>●●● ▰</span></div>
      <div className="mobile-content">
        <header className="app-header"><span className="logo"><span className="logo-mark">◭</span> FamilyOS <span className="logo-mode">{mode==="child"?"Explore":"Command"}</span></span><span className="profile-dot" aria-hidden="true">{mode==="child"?"✦":"⌂"}</span></header>
        {mode==="parent"?<section className="view" key="parent"><div className="overline">FAMILIENÜBERBLICK</div><h2 className="view-title">Alles im Blick.</h2><p className="subtle">Ein Tag. Zwei Schulen. Eine Übersicht.</p><div className="parent-summary"><div><strong>4</strong><span>Termine</span></div><div><strong>{done}/{tasks.length}</strong><span>Missionen</span></div><div><strong>2</strong><span>Kinder</span></div></div><h3 className="section-heading">Heute in der Familie</h3><div className="schedule"><div><time>08:00</time><span>Schule · beide Kinder</span></div><div><time>14:30</time><span>Mathe · Kind A</span></div><div><time>16:30</time><span>Sport · Kind B</span></div></div><section className="ai-panel"><div className="overline"><Sparkles size={14}/> KI-PLANUNGSVORSCHLAG</div><h3>Lernzeit clever verteilen</h3><p>Zwei Klassenarbeiten stehen an. FamilyOS kann freie Zeitfenster prüfen und einen Lernplan vorschlagen.</p><button onClick={()=>setTab("project")}>Vorschau ansehen <ChevronRight size={16}/></button><small>Demo: Keine echten Kalenderänderungen.</small></section></section>:
        <>
          {tab==="today"&&<section className="view" key="today"><div className="hero"><Observatory/><div className="hero-text"><span className="overline">DEIN TAG</span><h2>Heute läuft.</h2><p>Ein Schritt nach dem anderen.</p></div></div><div className="weekly-progress"><span className="level-box"><Compass size={20}/></span><div><strong>{done} von {tasks.length} Missionen</strong><Progress value={percent}/></div><b>{percent}%</b></div><div className="section-row"><h3>Deine Missionen</h3><span>Heute</span></div>{taskList}<button className="project-feature" onClick={()=>setTab("project")}><span className="overline">PROJEKT DER WOCHE</span><strong>Referat: Vulkane</strong><span>{steps.filter(Boolean).length} von 5 Etappen <ChevronRight size={17}/></span></button></section>}
          {tab==="missions"&&<section className="view" key="missions"><div className="overline">DEIN FOKUS</div><h2 className="view-title">Missionen.</h2><p className="subtle">Alles Wichtige, ohne Ablenkung.</p><div className="weekly-progress spaced"><span className="level-box"><Zap size={19}/></span><div><strong>Tagesfortschritt</strong><Progress value={percent}/></div><b>{done}/{tasks.length}</b></div>{taskList}</section>}
          {tab==="project"&&<section className="view" key="project"><button className="back" onClick={()=>setTab("today")}><ChevronLeft size={18}/> Mein Tag</button><div className="project-hero"><span>DEINE GROSSE MISSION</span><h2>Referat:<br/>Vulkane</h2></div><div className="section-row"><h3>Dein Projektpfad</h3><span>{steps.filter(Boolean).length}/5 Etappen</span></div><div className="step-track">{steps.map((d,i)=><span key={i} className={d?"finished":""}>{d?<Check size={15}/>:i+1}</span>)}</div><div className="step-list">{projectSteps.map((s,i)=><button key={s} className={`step-row ${steps[i]?"finished":""}`} aria-pressed={steps[i]} onClick={()=>setSteps(prev=>prev.map((x,j)=>j===i?!x:x))}><span className="round-check">{steps[i]?<Check size={17}/>:<Circle size={23}/>}</span><span>{s}</span></button>)}</div><div className="hint"><Sparkles size={18}/><span>Eine Etappe nach der anderen. Pausen gehören zum Plan.</span></div></section>}
          {tab==="calendar"&&<section className="view" key="calendar"><div className="overline">ZEIT IST DEIN SUPERPOWER</div><h2 className="view-title">Deine Woche.</h2><p className="subtle">Schule, Sport, Lernen und Freizeit.</p><div className="date-strip">{["Mo","Di","Mi","Do","Fr"].map((d,i)=><button key={d} className={day===i?"selected":""} onClick={()=>setDay(i)} aria-pressed={day===i}><span>{d}</span><strong>{20+i}</strong></button>)}</div><div className="calendar-rail"><div><time>08:00</time><article><BookOpen size={17}/> Schule <small>08:00–13:00</small></article></div><div><time>14:30</time><article className="violet"><FlaskConical size={17}/> Mathe · Hausaufgaben <small>14:30–15:00</small></article></div><div><time>16:30</time><article className="mint"><Dumbbell size={17}/> Fußballtraining <small>16:30–18:00</small></article></div><div><time>19:00</time><article className="gold"><Trophy size={17}/> Familienzeit <small>19:00–20:00</small></article></div></div><p className="small-note">Alle Tagesangaben sind Beispieldaten.</p></section>}
          {tab==="profile"&&<section className="view" key="profile"><div className="overline">DEINE WELT</div><h2 className="view-title">Dein Look.</h2><p className="subtle">Wähle den Stil, der zu dir passt.</p><div className="theme-options"><button className={theme==="explore"?"chosen":""} onClick={()=>setTheme("explore")} aria-pressed={theme==="explore"}><Sun size={24}/> Explorer <small>Abenteuerwelt</small></button><button className={theme==="tech"?"chosen":""} onClick={()=>setTheme("tech")} aria-pressed={theme==="tech"}><Moon size={24}/> Tech <small>Neon & Nacht</small></button></div><div className="hint"><ShieldCheck size={19}/><span>Keine Vergleiche mit anderen Kindern, keine Strafpunkte, keine Pflicht-Streaks.</span></div></section>}
        </>}
        <p className="demo-label">DESIGN-DEMO · KEINE ECHTEN FAMILIENDATEN</p>
      </div>
      <nav className="bottom-nav" aria-label="Navigation">{(mode==="child"?NAV:[{id:"today" as Tab,label:"Familie",Icon:Home},{id:"calendar" as Tab,label:"Kalender",Icon:CalendarDays},{id:"project" as Tab,label:"Planung",Icon:Layers3},{id:"profile" as Tab,label:"Profil",Icon:UserRound}]).map(({id,label,Icon})=><button key={id} onClick={()=>setTab(id)} className={tab===id?"active":""} aria-current={tab===id?"page":undefined}><Icon size={19}/><span>{label}</span></button>)}</nav>
    </main>
  </div>;
}
