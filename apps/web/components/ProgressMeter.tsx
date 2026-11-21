/** Segmented, factual progress (3 von 5). No streaks, no percentages to chase. */
export function ProgressMeter({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="fo-progress">
      <div className="fo-progress__track" role="img" aria-label={label}>
        {Array.from({ length: total }, (_, i) => <span key={i} className={`fo-progress__seg ${i < done ? "is-done" : ""}`} />)}
      </div>
      <span className="fo-progress__label"><span className="fo-num">{done}</span> von <span className="fo-num">{total}</span></span>
    </div>
  );
}
