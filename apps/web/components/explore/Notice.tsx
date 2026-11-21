"use client";
import { Check, X } from "lucide-react";
import { useExplore } from "./ExploreState.tsx";

/** Completion feedback as text in a polite live region (V2: no visual-only confirmation). */
export function Notice() {
  const { notice, clearNotice } = useExplore();
  return (
    <div className="fo-notice-slot" role="status" aria-live="polite">
      {notice && <div className="fo-notice"><Check size={16} aria-hidden="true" /><span>{notice}</span>
        <button type="button" onClick={clearNotice} aria-label="Hinweis schließen"><X size={16} aria-hidden="true" /></button></div>}
    </div>
  );
}
