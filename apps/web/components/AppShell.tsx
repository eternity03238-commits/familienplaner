import type { ReactNode } from "react";
import { NavBar, type NavKey } from "./NavBar.tsx";

/** Shared frame: skip link, DEMO strip, content column, navigation. `mode` switches density, not the design system. */
export function AppShell({ mode, current, children, demo = true }: { mode: "parent" | "child"; current: NavKey; children: ReactNode; demo?: boolean }) {
  return (
    <div className="fo-shell" data-mode={mode}>
      <a className="fo-skip" href="#inhalt">Zum Inhalt springen</a>
      {demo && (
        <aside className="fo-demo" aria-label="Demo-Hinweis">
          <strong>Demo</strong>
          <span>Beispieldaten, keine echten Konten. Änderungen bleiben nur in diesem Tab.</span>
        </aside>
      )}
      <NavBar current={current} />
      <main id="inhalt" className="fo-main" tabIndex={-1}>{children}</main>
    </div>
  );
}
