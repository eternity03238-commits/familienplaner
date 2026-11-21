"use client";
import { formatShortDay, formatTime, type StudyProposal } from "../lib/preview/model.ts";
import { ChildTag } from "./ChildTag.tsx";

const statusText = { pending: "Wartet auf Freigabe", approved: "Freigegeben", rejected: "Abgelehnt" } as const;

/**
 * Signature moment 3 — "Warum dieser Lernblock?": a factual proposal, not a magic AI card.
 * Shows constraints, estimate and exactly which data would be shared. Only guardians get decision buttons.
 */
export function AIProposalCard({ proposal: p, canDecide, onDecide, showChild = true, headingLevel = 3 }: {
  proposal: StudyProposal; canDecide: boolean; onDecide?: (id: string, d: "approved" | "rejected") => void; showChild?: boolean; headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const total = p.sessions.reduce((n, s) => n + s.minutes, 0);
  const titleId = `proposal-${p.id}-title`;
  return (
    <article className={`fo-proposal is-${p.status}`} aria-labelledby={titleId}>
      <header className="fo-proposal__head">
        <p className="fo-proposal__kind">Vorschlag · {p.subject}</p>
        <H id={titleId} className="fo-proposal__title">{p.title}</H>
        <p className="fo-proposal__status" role="status"><span className="fo-proposal__dot" aria-hidden="true" />{statusText[p.status]}{showChild && <> · <ChildTag child={p.child} long /></>}</p>
      </header>

      <p className="fo-proposal__why"><strong>Warum dieser Plan?</strong> {p.reason}</p>

      <ol className="fo-proposal__sessions" aria-label={`${p.sessions.length} Lernblöcke, zusammen ${total} Minuten`}>
        {p.sessions.map(s => (
          <li key={s.startsAt}>
            <span>{formatShortDay(s.startsAt)}</span>
            <span className="fo-num">{formatTime(s.startsAt)}–{formatTime(s.endsAt)}</span>
            <span className="fo-num">{s.minutes} Min.</span>
          </li>
        ))}
      </ol>

      <details className="fo-proposal__details">
        <summary>Regeln und übermittelte Daten</summary>
        <h4>Eingehaltene Regeln</h4>
        <ul>{p.constraints.map(c => <li key={c}>{c}</li>)}</ul>
        <h4>Nur diese Angaben gehen an die KI</h4>
        <ul>{p.sharedWithAi.map(c => <li key={c}>{c}</li>)}</ul>
      </details>

      {p.status === "pending" && canDecide && onDecide && (
        <div className="fo-proposal__actions">
          <button type="button" className="fo-button fo-button--primary" onClick={() => onDecide(p.id, "approved")}>Plan freigeben</button>
          <button type="button" className="fo-button fo-button--quiet" onClick={() => onDecide(p.id, "rejected")}>Ablehnen</button>
        </div>
      )}
      {p.status === "pending" && !canDecide && <p className="fo-proposal__note">Ein Elternteil entscheidet. Bis dahin stehen diese Blöcke nicht in deinem Kalender.</p>}
      {p.status === "approved" && <p className="fo-proposal__note">Freigegeben. Im Prototyp wird nichts gespeichert und kein Kalender verändert.</p>}
      {p.status === "rejected" && <p className="fo-proposal__note">Abgelehnt. Es werden keine Lernblöcke angelegt.</p>}
    </article>
  );
}
