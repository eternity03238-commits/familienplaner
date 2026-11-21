"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight } from "lucide-react";
import { usePrefs } from "./Prefs.tsx";

export interface NavItem { href: string; label: string; Icon: LucideIcon }

/**
 * App frame for both perspectives: one world, two characters (V2). Full-screen on phones (no device mock),
 * centred column on larger screens. Role is a display preference; the link to the other perspective is not a permission.
 */
export function AppFrame({ role, nav, children }: { role: "child" | "parent"; nav: NavItem[]; children: ReactNode }) {
  const path = usePathname();
  const { theme, look } = usePrefs();
  const current = (href: string) => (href === nav[0].href ? path === href : path.startsWith(href));
  return (
    <div className={`fo-app fo-app--${role}`} data-fo-role={role} data-fo-theme={theme} data-fo-look={role === "child" ? look : undefined}>
      <a className="fo-skip" href="#inhalt">Zum Inhalt springen</a>
      <aside className="fo-demo" aria-label="Demo-Hinweis"><strong>Demo</strong><span>Erfundene Beispieldaten. Nichts wird gespeichert oder verbunden.</span></aside>
      <header className="fo-appbar">
        <Link href="/" className="fo-logo">
          <span className="fo-logo__mark" aria-hidden="true">◭</span> FamilyOS <span className="fo-logo__mode">{role === "child" ? "Explore" : "Command"}</span><span className="fo-sr-only">, zur Startseite</span>
        </Link>
        <Link className="fo-appbar__switch" href={role === "child" ? "/command" : "/explore"}>
          <ArrowLeftRight size={15} aria-hidden="true" />{role === "child" ? "Elternansicht" : "Kinderansicht"}
        </Link>
      </header>
      <main id="inhalt" className="fo-view" tabIndex={-1}>{children}</main>
      <nav className="fo-tabbar" aria-label={role === "child" ? "Explore-Navigation" : "Command-Navigation"}>
        <ul>
          {nav.map(({ href, label, Icon }) => (
            <li key={href}><Link href={href} aria-current={current(href) ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{label}</span></Link></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
