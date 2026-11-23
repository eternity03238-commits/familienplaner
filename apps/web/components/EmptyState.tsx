import type { ReactNode } from "react";

/** Empty, loading, offline and permission states share one calm grammar: what is the case, what can you do. */
export function EmptyState({ title, children, action, tone = "neutral" }: { title: string; children?: ReactNode; action?: ReactNode; tone?: "neutral" | "warning" | "locked" }) {
  return (
    <div className={`fo-empty fo-empty--${tone}`} role="status">
      <p className="fo-empty__title">{title}</p>
      {children && <p className="fo-empty__text">{children}</p>}
      {action}
    </div>
  );
}
export function Skeleton({ lines = 3, label = "Wird geladen" }: { lines?: number; label?: string }) {
  return (
    <div className="fo-skeleton" role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => <span key={i} className="fo-skeleton__line" style={{ inlineSize: `${92 - i * 17}%` }} />)}
    </div>
  );
}
