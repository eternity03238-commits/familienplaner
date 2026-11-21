import type { Metadata } from "next";
import { SetupFlow } from "../../components/setup/SetupFlow.tsx";

export const metadata: Metadata = { title: "Familie einrichten · FamilyOS" };

export default function FamilySetupPage() {
  return <SetupFlow />;
}
