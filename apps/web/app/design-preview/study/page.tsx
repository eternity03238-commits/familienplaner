import { AppShell } from "../../../components/AppShell.tsx";
import { PageHeader } from "../../../components/PageHeader.tsx";
import { StudyPlan } from "../../../components/views/StudyPlan.tsx";
import { exam, guardianViewer, project, proposals, unscheduledMinutes } from "../../../lib/preview/fixtures.ts";

export const metadata = { title: "Lernen · FamilyOS Demo" };
export default function StudyPreview() {
  return (
    <AppShell mode="parent" current="study">
      <PageHeader title="Lernplanung" meta="Kind A · Ansicht für Eltern" />
      <StudyPlan viewer={guardianViewer} proposal={proposals[0]} project={project} exam={exam} unscheduledMinutes={unscheduledMinutes} />
    </AppShell>
  );
}
