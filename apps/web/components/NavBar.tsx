import Link from "next/link";

export type NavKey = "home" | "parent" | "child" | "study" | "components";
const items: { key: NavKey; href: string; label: string }[] = [
  { key: "parent", href: "/design-preview/parent", label: "Familie" },
  { key: "child", href: "/design-preview/child", label: "Mein Tag" },
  { key: "study", href: "/design-preview/study", label: "Lernen" },
  { key: "components", href: "/design-preview", label: "Übersicht" }
];

/** Real links only — no placeholder tabs that pretend to work. */
export function NavBar({ current }: { current: NavKey }) {
  return (
    <nav className="fo-nav" aria-label="Hauptnavigation">
      <Link className="fo-nav__brand" href="/">FamilyOS</Link>
      <ul className="fo-nav__list">
        {items.map(i => (
          <li key={i.key}>
            <Link href={i.href} className="fo-nav__link" aria-current={i.key === current ? "page" : undefined}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
