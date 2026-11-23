"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native modal dialog: the browser provides focus containment, Escape and an inert background;
 * we add initial focus and focus return to the opener (V2 "Dialogs must support Escape, focus containment, return focus").
 */
export function FocusDialog({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);
  return (
    <dialog ref={ref} className="fo-dialog" aria-labelledby={labelledBy}
      onClose={() => { onClose(); opener.current?.focus(); }}
      onClick={e => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="fo-dialog__body">{children}</div>
    </dialog>
  );
}
