const milestones = [
  ["Familienprofile", "Modelliert, Login noch nicht angeschlossen"],
  ["Kinder-Tagesplan", "Domänen- und Planungsgrundlage vorhanden"],
  ["Google Kalender", "Connector-Schnittstelle, noch nicht verbunden"],
  ["Schule & Sport", "Datenmodell vorbereitet, keine Live-Daten"],
  ["KI-Lernplaner", "Provider-Vertrag, noch keine Modellaufrufe"],
  ["Patchwork", "Daten- und Rechtefundament; Oberfläche später"]
];
export default function Home() {
 return <main className="shell">
  <header className="top"><span className="brand">◌ FamilyOS</span><span className="pill">Sprint 0 · Starter</span></header>
  <section className="hero"><span className="eyebrow">FAMILIENALLTAG · KLAR GEPLANT</span><h1>Weniger organisieren.<br/><em>Mehr Familie.</em></h1><p>Ein sicherer, gemeinsamer Planer für Schule, Sport und Alltag – später intelligent unterstützt durch Claude.</p></section>
  <section aria-labelledby="status-heading"><h2 id="status-heading">Projektstand</h2><p className="fine">Diese Seite ist ein technischer Starter. Es sind keine echten Termine, Konten oder Schulplattformen verbunden.</p><div className="grid">{milestones.map(([title, subtitle]) => <article className="item" key={title}><div className="dot" aria-hidden="true"/><h3>{title}</h3><p>{subtitle}</p></article>)}</div></section>
  <footer>Privacy by design · Deutschland / Europe/Berlin · Kein Live-Betrieb</footer>
 </main>;
}
