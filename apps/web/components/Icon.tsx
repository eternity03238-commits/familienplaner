import type { EventKind } from "../lib/preview/model.ts";

/** Small, purpose-built glyphs. Shape (not only colour) distinguishes event kinds on the time rail. */
export function KindMark({ kind }: { kind: EventKind }) {
  const common = { width: 14, height: 14, viewBox: "0 0 14 14", "aria-hidden": true as const, className: `fo-kind fo-kind--${kind}` };
  switch (kind) {
    case "school": return <svg {...common}><rect x="1.5" y="1.5" width="11" height="11" rx="1" /></svg>;
    case "sport": return <svg {...common}><circle cx="7" cy="7" r="5.5" /></svg>;
    case "study": return <svg {...common}><path d="M7 1 13 7 7 13 1 7Z" /></svg>;
    case "family": return <svg {...common}><path d="M7 1.5 13 12.5H1Z" /></svg>;
    case "appointment": return <svg {...common}><path d="M2 2h10v10H2z" strokeDasharray="2 2" /></svg>;
  }
}

export function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="fo-icon"><rect x="2.5" y="6" width="9" height="6.5" rx="1.5" /><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" /></svg>;
}

export function SyncIcon({ status }: { status: "synced" | "stale" | "not_connected" | "manual" }) {
  if (status === "manual") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="fo-icon fo-icon--stroke"><path d="M3 11 10 4l1.5 1.5-7 7H3z" /></svg>;
  if (status === "not_connected") return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="fo-icon fo-icon--stroke"><path d="M5 9 3.5 10.5a2.1 2.1 0 0 1-3-3L2 6M9 5l1.5-1.5a2.1 2.1 0 0 1 3 3L12 8M2 2l10 10" /></svg>;
  return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className={`fo-icon fo-icon--stroke ${status === "stale" ? "is-stale" : ""}`}><path d="M12 6A5 5 0 0 0 3 4M2 8a5 5 0 0 0 9 2M3 1.5V4h2.5M11 12.5V10H8.5" /></svg>;
}

export function CheckGlyph() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="fo-check-glyph"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" /></svg>;
}
