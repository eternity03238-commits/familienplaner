"use client";
import { useId, useState } from "react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { formatShortDay, formatTime, type StudyProposal } from "../lib/preview/model.ts";
import { ChildTag } from "./ChildTag.tsx";
import { ActionButton, StatusChip } from "./ui.tsx";

const statusText = { pending: "Wartet auf Freigabe", approved: "Freigegeben", rejected: "Abgelehnt" } as const;
const statusTone = { pending: "warning", approved: "success", rejected: "secondary" } as const;

/**
 * Explainable proposal (V1.3 "Proposal" + GAMEPLAN signature 3). A proposal is never a saved plan:
 * only guardians of that child see decision buttons; a decision is final; no backend action in the demo.
 */
export function AIProposalCard({ proposal: p, canDecide, onDecide, showChild = true, headingLevel = 3 }: {
  proposal: StudyProposal; canDecide: boolean; onDecide?: (id: string, d: "approved" | "rejected") => void; showChild?: boolean; headingLevel?: 2 | 3;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const H = headingLevel === 2 ? "h2" : "h3";
  const total = p.sessions.reduce((n, s) => n + s.minutes, 0);
  return (
    <article className={`fo-proposal is-${p.status}`} aria-labelledby={`${detailsId}-t`}>
      <p className="fo-eyebrow fo-proposal__kind"><Sparkles size={13} aria-hidden="true" /> Vorschlag · {p.subject}</p>
      <H id={`${detailsId}-t`} className="fo-proposal__title">{p.title}</H>
      <p className="fo-proposal__status" role="status">
        <StatusChip tone={statusTone[p.status]}>{statusText[p.status]}</StatusChip>
        {showChild && <ChildTag child={p.child} long />}
      </p>
      <p className="fo-proposal__why">{p.reason}</p>
      <ol className="fo-proposal__sessions" aria-label={`${p.sessions.length} Lernblöcke, zusammen ${total} Minuten`}>
        {p.sessions.map(s => (
          <li key={s.startsAt}><span>{formatShortDay(s.startsAt)}</span><span>{formatTime(s.startsAt)}–{formatTime(s.endsAt)}</span><span>{s.minutes} Min.</span></li>
        ))}
      </ol>
      <button type="button" className="fo-link-button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(o => !o)}>
        Warum dieser Vorschlag? <ChevronRight size={15} aria-hidden="true" className={open ? "is-open" : undefined} />
      </button>
      <div id={detailsId} className="fo-proposal__explain" hidden={!open}>
        <h4>Eingehaltene Regeln</h4>
        <ul>{p.constraints.map(c => <li key={c}>{c}</li>)}</ul>
        <h4>Nur diese Angaben gehen an die KI</h4>
        <ul>{p.sharedWithAi.map(c => <li key={c}>{c}</li>)}</ul>
        <p>Berechnet von der Planungsregel-Engine mit Beispieldaten. Im Prototyp gibt es keinen KI-Aufruf.</p>
      </div>
      {p.status === "pending" && canDecide && onDecide && (
        <div className="fo-proposal__actions">
          <ActionButton tone="quiet" onClick={() => onDecide(p.id, "rejected")}>Ablehnen</ActionButton>
          <ActionButton onClick={() => onDecide(p.id, "approved")}><Check size={15} aria-hidden="true" /> Plan freigeben</ActionButton>
        </div>
      )}
      {p.status === "pending" && !canDecide && <p className="fo-proposal__note">Ein Elternteil entscheidet. Bis dahin stehen diese Blöcke nicht in deinem Kalender.</p>}
      {p.status === "approved" && <p className="fo-proposal__note">Freigegeben. Im Prototyp wird nichts gespeichert und kein Kalender verändert.</p>}
      {p.status === "rejected" && <p className="fo-proposal__note">Abgelehnt. Es werden keine Lernblöcke angelegt.</p>}
    </article>
  );
}
