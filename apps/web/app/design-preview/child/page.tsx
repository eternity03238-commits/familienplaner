import { AppShell } from "../../../components/AppShell.tsx";
import { ChildToday } from "../../../components/views/ChildToday.tsx";
import { DEMO_DAY, DEMO_NOW, events, missions, project, proposals } from "../../../lib/preview/fixtures.ts";
import { formatDay, formatTime } from "../../../lib/preview/model.ts";

export const metadata = { title: "Mein Tag · FamilyOS Demo" };
export default function ChildPreview() {
  const done = project.steps.filter(s => s.done).length;
  return (
    <AppShell mode="child" current="child">
      <ChildToday viewer={{ kind: "child", id: "A" }} events={events} missions={missions} proposals={proposals} now={DEMO_NOW} day={DEMO_DAY}
        dayLabel={`Kind A · ${formatDay(DEMO_NOW)}, ${formatTime(DEMO_NOW)} Uhr`}
        project={{ title: project.title, done, total: project.steps.length, nextStep: project.steps.find(s => !s.done)!.title }} />
    </AppShell>
  );
}
