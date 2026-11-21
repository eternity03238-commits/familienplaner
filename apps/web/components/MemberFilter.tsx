"use client";
import { Users } from "lucide-react";
import type { ChildFilter } from "../lib/preview/model.ts";

const options: { value: ChildFilter; label: string }[] = [{ value: "all", label: "Alle" }, { value: "A", label: "Kind A" }, { value: "B", label: "Kind B" }];

/** View filter only — never an authorization boundary (V1.3). Native radios: arrows, labels and forms work. */
export function MemberFilter({ value, onChange }: { value: ChildFilter; onChange: (v: ChildFilter) => void }) {
  return (
    <fieldset className="fo-filter">
      <legend className="fo-sr-only">Familienmitglied auswählen</legend>
      {options.map(o => (
        <label key={o.value} className="fo-filter__option">
          <input type="radio" name="member-filter" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.value === "all" ? <Users size={14} aria-hidden="true" /> : <span className={`fo-dot fo-dot--${o.value}`} aria-hidden="true">{o.value}</span>}{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
