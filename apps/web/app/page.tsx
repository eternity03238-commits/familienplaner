import Link from "next/link";
import { Observatory } from "../components/Observatory.tsx";

const status: { title: string; state: string; done: boolean }[] = [
  { title: "Rechte und Datenschutz", state: "Datenbankregeln mit echten Rollen getestet", done: true },
  { title: "Planungslogik", state: "Deterministische Lernplanung mit Lastgrenzen", done: true },
  { title: "Designsystem V2", state: "Explore und Command mit Beispieldaten", done: true },
  { title: "Anmeldung und Familienprofile", state: "Folgt in Sprint 1", done: false },
  { title: "Google Kalender", state: "Schnittstelle vorbereitet, nicht verbunden", done: false },
  { title: "Schulplattformen", state: "Erst nach Prüfung der offiziellen Zugänge", done: false }
];

export default function Home() {
  return (
    <div className="fo-app fo-home" data-fo-role="child">
      <a className="fo-skip" href="#inhalt">Zum Inhalt springen</a>
      <main id="inhalt" className="fo-home__main" tabIndex={-1}>
        <div className="fo-home__scene"><Observatory world="night" /></div>
        <p className="fo-eyebrow">FamilyOS</p>
        <h1 className="fo-home__title">Eine Welt.<br />Zwei Perspektiven.</h1>
        <p className="fo-home__lead">Kinder sehen ihren Tag als Missionen. Eltern behalten im Command Center den Überblick und geben Lernpläne frei.</p>
        <nav aria-label="Perspektive wählen" className="fo-home__choices">
          <Link href="/explore" className="fo-home__choice"><strong>Explore</strong><span>Mein Tag als Kind A – Missionen, Woche, Projektroute</span></Link>
          <Link href="/command" className="fo-home__choice fo-home__choice--quiet"><strong>Command</strong><span>Familienüberblick für Eltern – Termine, Hinweise, Freigaben</span></Link>
          <Link href="/design-system" className="fo-home__link">Design-System ansehen</Link>
        </nav>
        <p className="fo-home__status" role="note"><strong>Technischer Stand, kein Live-Betrieb.</strong> Alle Inhalte sind erfunden. Es sind keine Konten, Kalender oder Schulplattformen verbunden.</p>
        <section aria-labelledby="stand" className="fo-stack">
          <h2 id="stand" className="fo-subhead">Projektstand</h2>
          <ul className="fo-checklist">
            {status.map(s => <li key={s.title} className={s.done ? "is-done" : undefined}><span aria-hidden="true" className="fo-checklist__mark" /><strong>{s.title}</strong><small>{s.done ? "Erledigt: " : "Offen: "}{s.state}</small></li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
