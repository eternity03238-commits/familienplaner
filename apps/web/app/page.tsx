import Link from "next/link";

const milestones: { title: string; state: string; done: boolean }[] = [
  { title: "Familienprofile", state: "Modelliert, Anmeldung folgt in Sprint 1", done: false },
  { title: "Rechte und Datenschutz", state: "Datenbankregeln getestet", done: true },
  { title: "Kinder-Tagesplan", state: "Planungslogik vorhanden", done: true },
  { title: "Google Kalender", state: "Schnittstelle vorbereitet, nicht verbunden", done: false },
  { title: "Schule und Sport", state: "Datenmodell vorbereitet, keine Live-Daten", done: false },
  { title: "KI-Lernplanung", state: "Nur Vorschläge, Freigabe durch Eltern", done: false }
];

export default function Home() {
  return (
    <div className="fo-shell" data-mode="parent">
      <a className="fo-skip" href="#inhalt">Zum Inhalt springen</a>
      <main id="inhalt" className="fo-main fo-home" tabIndex={-1}>
        <p className="fo-home__brand">FamilyOS</p>
        <h1 className="fo-home__title">Heute läuft.</h1>
        <p className="fo-home__lead">Ein gemeinsamer Plan für Schule, Sport und Lernzeit. Kinder sehen ihren Tag, Eltern behalten den Überblick und geben Lernpläne frei.</p>
        <div className="fo-home__status" role="note">
          <strong>Technischer Startstand.</strong> Es sind keine Konten, Kalender oder Schulplattformen verbunden. Kein Live-Betrieb.
        </div>
        <section aria-labelledby="stand" className="fo-home__section">
          <h2 id="stand" className="fo-home__h2">Projektstand</h2>
          <ul className="fo-home__list">
            {milestones.map(m => (
              <li key={m.title} className={m.done ? "is-done" : undefined}>
                <span className="fo-home__mark" aria-hidden="true" />
                <span className="fo-home__item-title">{m.title}</span>
                <span className="fo-home__item-state">{m.done ? "Erledigt: " : "Offen: "}{m.state}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="vorschau" className="fo-home__section">
          <h2 id="vorschau" className="fo-home__h2">Designvorschau mit Beispieldaten</h2>
          <ul className="fo-home__links">
            <li><Link href="/design-preview/parent">Familienansicht</Link><span>Überblick, Filter pro Kind, Freigaben</span></li>
            <li><Link href="/design-preview/child">Tag eines Kindes</Link><span>Als Nächstes, Zeitleiste, Aufgaben</span></li>
            <li><Link href="/design-preview/study">Lernplanung</Link><span>Projektschritte und erklärter Lernplan</span></li>
          </ul>
        </section>
        <footer className="fo-home__foot">Privacy by Design · Europe/Berlin</footer>
      </main>
    </div>
  );
}
