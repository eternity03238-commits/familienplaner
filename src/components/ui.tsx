import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Check, Clock3, ShieldCheck } from "lucide-react";
import "./ui.css";

type Tone = "primary" | "secondary" | "success" | "quiet";
export function ActionButton({tone="primary",children,className="",...props}:ButtonHTMLAttributes<HTMLButtonElement>&{tone?:Tone}){
  return <button className={`fo-button fo-button--${tone} ${className}`.trim()} {...props}>{children}</button>;
}
export function SurfaceCard({children,className="",...props}:HTMLAttributes<HTMLElement>&{children:ReactNode}){
  return <section className={`fo-surface ${className}`.trim()} {...props}>{children}</section>;
}
export function Eyebrow({children}: {children:ReactNode}){return <span className="fo-eyebrow">{children}</span>}
export function SourcePill({source,status}:{source:string;status:"demo"|"connected"|"stale"}){
  const labels={demo:"Beispieldaten",connected:"Verbunden",stale:"Aktualisierung ausstehend"};
  return <span className={`fo-source fo-source--${status}`} title={source}><ShieldCheck size={14} aria-hidden="true"/><span>{source} · {labels[status]}</span></span>;
}
export function StatusChip({children,tone="secondary"}:{children:ReactNode;tone?:"secondary"|"warning"|"success"}){
  return <span className={`fo-status fo-status--${tone}`}>{children}</span>;
}
export function SectionHeading({title,action}: {title:string;action?:ReactNode}){
  return <div className="fo-section-heading"><h2>{title}</h2>{action}</div>;
}
export function ProgressLine({value,total,label}:{value:number;total:number;label:string}){
  const safeTotal=Math.max(0,total);
  const safeValue=Math.max(0,Math.min(value,safeTotal));
  const width=safeTotal?Math.round(100*safeValue/safeTotal):0;
  return <div className="fo-progress">
    <div className="fo-progress-caption"><span>{label}</span><strong>{safeValue} / {safeTotal}</strong></div>
    <div className="fo-progress-track" role="progressbar" aria-label={label} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={safeTotal||1}><div style={{width:`${width}%`}}/></div>
  </div>;
}
export function TaskTile({title,detail,minutes,done,onToggle}:{title:string;detail:string;minutes?:number;done:boolean;onToggle:()=>void}){
  return <button className={`fo-task ${done?"fo-task--done":""}`} aria-pressed={done} type="button" onClick={onToggle}>
    <span className="fo-task-check" aria-hidden="true">{done?<Check size={19}/>:null}</span>
    <span className="fo-task-copy"><strong>{title}</strong><small>{detail}</small></span>
    {minutes!=null&&<span className="fo-task-duration"><Clock3 size={14} aria-hidden="true"/>{minutes} Min.</span>}
  </button>;
}
