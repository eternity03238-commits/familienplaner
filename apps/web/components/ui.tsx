/**
 * FamilyOS Design System V2 — shared primitives (contracts: docs/design/DESIGN_SYSTEM_V2.md).
 * Ported from design/familyos-orbit-wow src/components/ui.tsx; SourcePill extended to the honest sync states of the domain.
 */
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { BookOpen, Check, Clock3, Dumbbell, FlaskConical, Link2Off, Pencil, RefreshCw, ShieldCheck, Backpack } from "lucide-react";
import { sourceText, type MissionKind, type Source } from "../lib/preview/model.ts";

type Tone = "primary" | "secondary" | "success" | "quiet";
export function ActionButton({ tone = "primary", children, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button type={type} className={`fo-button fo-button--${tone} ${className}`.trim()} {...props}>{children}</button>;
}
export function SurfaceCard({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`fo-surface ${className}`.trim()} {...props}>{children}</section>;
}
export function Eyebrow({ children, as: As = "span" }: { children: ReactNode; as?: "span" | "p" }) {
  return <As className="fo-eyebrow">{children}</As>;
}
export function StatusChip({ children, tone = "secondary" }: { children: ReactNode; tone?: "secondary" | "warning" | "success" }) {
  return <span className={`fo-status fo-status--${tone}`}>{children}</span>;
}
export function SectionHeading({ id, title, action, level = 2 }: { id?: string; title: string; action?: ReactNode; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return <div className="fo-section-heading"><H id={id}>{title}</H>{action}</div>;
}
/** Text-first source and sync state. Never says "verbunden" without a confirmed sync timestamp. */
export function SourcePill({ source, now }: { source: Source; now: string }) {
  const Icon = source.status === "manual" ? Pencil : source.status === "not_connected" ? Link2Off : source.status === "stale" ? RefreshCw : ShieldCheck;
  return <span className={`fo-source fo-source--${source.status}`}><Icon size={13} aria-hidden="true" /><span>{sourceText(source, now)}</span></span>;
}
export function DemoPill() {
  return <span className="fo-source fo-source--demo"><ShieldCheck size={13} aria-hidden="true" /><span>Beispieldaten</span></span>;
}
export function ProgressLine({ value, total, label }: { value: number; total: number; label: string }) {
  const safeTotal = Math.max(0, total);
  const safeValue = Math.max(0, Math.min(value, safeTotal));
  const width = safeTotal ? Math.round((100 * safeValue) / safeTotal) : 0;
  return (
    <div className="fo-progress">
      <div className="fo-progress-caption"><span>{label}</span><strong>{safeValue} / {safeTotal}</strong></div>
      <div className="fo-progress-track" role="progressbar" aria-label={label} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={safeTotal || 1} aria-valuetext={`${safeValue} von ${safeTotal}`}>
        <div style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
export function MissionIcon({ kind }: { kind: MissionKind }) {
  const Icon = kind === "study" ? BookOpen : kind === "sport" ? Dumbbell : kind === "project" ? FlaskConical : Backpack;
  return <span className={`fo-mission-icon fo-mission-icon--${kind}`} aria-hidden="true"><Icon size={20} strokeWidth={1.8} /></span>;
}
/** Semantic toggle (aria-pressed). Toggling changes only the done state — never deadline or title. */
export function TaskTile({ title, detail, minutes, done, onToggle, kind, aside }: {
  title: string; detail: string; minutes?: number; done: boolean; onToggle: () => void; kind?: MissionKind; aside?: ReactNode;
}) {
  return (
    <button className={`fo-task ${done ? "fo-task--done" : ""}`} aria-pressed={done} type="button" onClick={onToggle}>
      {kind && <MissionIcon kind={kind} />}
      <span className="fo-task-copy"><strong>{title}</strong><small>{detail}</small></span>
      {minutes != null && <span className="fo-task-duration"><Clock3 size={13} aria-hidden="true" />{minutes} Min.</span>}
      {aside}
      <span className="fo-task-check" aria-hidden="true">{done ? <Check size={17} /> : null}</span>
      <span className="fo-sr-only">{done ? ", erledigt" : ", offen"}</span>
    </button>
  );
}
