"use client";
import { GraduationCap, LockKeyhole, Moon, Sun, Users } from "lucide-react";
import { DEMO_NOW } from "../../lib/preview/fixtures.ts";
import type { Source } from "../../lib/preview/model.ts";
import { usePrefs } from "../Prefs.tsx";
import { Eyebrow, SectionHeading, SourcePill, StatusChip } from "../ui.tsx";

const sources: { name: string; source: Source }[] = [
  { name: "Google Kalender (Elternteil 1)", source: { provider: "google_calendar", label: "Google Kalender", status: "synced", lastSyncedAt: "2026-11-24T12:58:00Z" } },
  { name: "Google Kalender (Elternteil 2)", source: { provider: "google_calendar", label: "Google Kalender", status: "stale", lastSyncedAt: "2026-11-23T06:40:00Z" } },
  { name: "Schulplattform Kind A", source: { provider: "school_import", label: "Schulplattform", status: "not_connected" } },
  { name: "Schulplattform Kind B", source: { provider: "school_import", label: "Schulplattform", status: "not_connected" } }
];

export function CommandProfile() {
  const { theme, setTheme } = usePrefs();
  return (
    <div className="fo-command fo-command--narrow">
      <header className="fo-viewhead"><Eyebrow as="p">Profil</Eyebrow><h1>Familie und Zugriff.</h1><p>Personen, Quellen und Privatsphäre.</p></header>
      <section aria-labelledby="personen" className="fo-stack">
        <SectionHeading id="personen" title="Personen und Rechte" />
        <ul className="fo-rows">
          <li><Users size={19} aria-hidden="true" /><div><strong>Familie</strong><small>2 Erwachsene, 2 Kinder · Beispieldaten</small></div><StatusChip tone="success">aktiv</StatusChip></li>
          <li><LockKeyhole size={19} aria-hidden="true" /><div><strong>Getrennte Kinderprofile</strong><small>Rechte prüft der Server und die Datenbank, nicht diese Ansicht.</small></div><StatusChip tone="success">getestet</StatusChip></li>
          <li><GraduationCap size={19} aria-hidden="true" /><div><strong>Patchwork-Freigaben</strong><small>Im Datenmodell vorbereitet, Oberfläche folgt später.</small></div><StatusChip>nicht aktiv</StatusChip></li>
        </ul>
      </section>
      <section aria-labelledby="quellen" className="fo-stack">
        <SectionHeading id="quellen" title="Quellen" />
        <ul className="fo-rows">{sources.map(s => <li key={s.name}><div><strong>{s.name}</strong><SourcePill source={s.source} now={DEMO_NOW} /></div></li>)}</ul>
        <p className="fo-fineprint">In dieser Vorschau ist nichts verbunden; die Zustände zeigen, wie ehrlich Sync-Status später angezeigt wird.</p>
      </section>
      <section aria-labelledby="darstellung" className="fo-stack">
        <SectionHeading id="darstellung" title="Darstellung" />
        <div className="fo-choice" role="group" aria-labelledby="darstellung">
          <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={22} aria-hidden="true" /><strong>Dunkel</strong></button>
          <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun size={22} aria-hidden="true" /><strong>Hell</strong></button>
        </div>
      </section>
    </div>
  );
}
