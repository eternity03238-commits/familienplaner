import Link from "next/link";
import { AppShell } from "../../components/AppShell.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { Catalogue } from "../../components/views/Catalogue.tsx";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer, missions, proposals } from "../../lib/preview/fixtures.ts";
import { railForDay, visibleEventsFor, type Source } from "../../lib/preview/model.ts";

export const metadata = { title: "Übersicht · FamilyOS Demo" };
const sources: Source[] = [
  { provider: "google_calendar", label: "Google Kalender", status: "synced", lastSyncedAt: "2026-11-24T12:58:00Z" },
  { provider: "google_calendar", label: "Google Kalender", status: "stale", lastSyncedAt: "2026-11-23T06:40:00Z" },
  { provider: "school_import", label: "Schulplattform", status: "not_connected" },
  { provider: "manual", label: "Elternteil", status: "manual" }
];

export default function PreviewIndex() {
  const visible = visibleEventsFor(guardianViewer, events).filter(e => ["e-ad2-private", "e-a-study", "e-a-football", "e-a-allday"].includes(e.id));
  return (
    <AppShell mode="parent" current="components">
      <PageHeader title="Designvorschau" meta="GAMEPLAN · Beispieldaten">
        <p className="fo-lead">Drei Ansichten und alle Bausteine mit erfundenen Daten. Nichts wird gespeichert, kein Kalender und keine KI werden angesprochen.</p>
      </PageHeader>
      <ul className="fo-home__links">
        <li><Link href="/design-preview/parent">Familienansicht</Link><span>Filter pro Kind, private Termine geschützt, Freigaben</span></li>
        <li><Link href="/design-preview/child">Mein Tag (Kind A)</Link><span>Als Nächstes, Aufgaben abhaken, Zeitleiste</span></li>
        <li><Link href="/design-preview/study">Lernplanung</Link><span>Projektpfad und erklärter Lernplan</span></li>
      </ul>
      <h2 className="fo-home__h2 fo-catalogue__heading">Bausteine</h2>
      <Catalogue now={DEMO_NOW} rail={railForDay(visible, DEMO_DAY)} mission={missions[0]} proposal={proposals[1]} sources={sources} />
    </AppShell>
  );
}
