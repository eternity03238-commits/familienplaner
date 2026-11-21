"use client";
import { dayOfMonth, weekdayShort } from "../lib/preview/model.ts";

/** Weekday selector. Each day really switches the data below (V1.2 audit item 2). */
export function WeekStrip({ days, value, onChange, label }: { days: string[]; value: string; onChange: (d: string) => void; label: string }) {
  return (
    <div className="fo-week" role="group" aria-label={label}>
      {days.map(d => (
        <button key={d} type="button" className="fo-week__day" aria-pressed={d === value} onClick={() => onChange(d)}>
          <span>{weekdayShort(d)}</span><strong>{dayOfMonth(d)}</strong>
        </button>
      ))}
    </div>
  );
}
