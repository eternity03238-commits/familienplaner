"use client";
import { formatLocalDate, type Mission } from "../lib/preview/model.ts";
import { ChildTag } from "./ChildTag.tsx";
import { CheckGlyph } from "./Icon.tsx";

/** A real checkbox. Ticking changes status only — never deadline or title (CLAUDE.md rule 11). */
export function MissionCard({ mission: m, onToggle, showChild = false, disabled = false }: { mission: Mission; onToggle: (id: string) => void; showChild?: boolean; disabled?: boolean }) {
  const id = `mission-${m.id}`;
  return (
    <li className={`fo-mission ${m.done ? "is-done" : ""}`}>
      <input id={id} type="checkbox" className="fo-mission__input" checked={m.done} disabled={disabled} onChange={() => onToggle(m.id)} />
      <label htmlFor={id} className="fo-mission__label">
        <span className="fo-mission__box" aria-hidden="true"><CheckGlyph /></span>
        <span className="fo-mission__text">
          <span className="fo-mission__title">{m.title}</span>
          <span className="fo-mission__meta">
            <span>{m.subject}</span>
            <span>ca. <span className="fo-num">{m.estimateMinutes}</span> Min.</span>
            <span>bis {formatLocalDate(m.dueOn)}</span>
          </span>
        </span>
        {showChild && <ChildTag child={m.child} />}
      </label>
    </li>
  );
}
