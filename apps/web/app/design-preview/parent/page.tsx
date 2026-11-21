import { AppShell } from "../../../components/AppShell.tsx";
import { ParentDashboard } from "../../../components/views/ParentDashboard.tsx";
import { DEMO_DAY, DEMO_NOW, events, guardianViewer, missions, proposals } from "../../../lib/preview/fixtures.ts";
import { formatDay, formatTime } from "../../../lib/preview/model.ts";

export const metadata = { title: "Familie · FamilyOS Demo" };
export default function ParentPreview() {
  return (
    <AppShell mode="parent" current="parent">
      <ParentDashboard viewer={guardianViewer} events={events} missions={missions} proposals={proposals} now={DEMO_NOW} day={DEMO_DAY}
        dayLabel={`${formatDay(DEMO_NOW)}, ${formatTime(DEMO_NOW)} Uhr`} />
    </AppShell>
  );
}
