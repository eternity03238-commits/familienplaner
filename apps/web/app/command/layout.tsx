import type { Metadata } from "next";
import { CommandFrame } from "../../components/command/CommandFrame.tsx";
export const metadata: Metadata = { title: "FamilyOS Command (Demo)", robots: { index: false, follow: false } };
export default function CommandLayout({ children }: { children: React.ReactNode }) { return <CommandFrame>{children}</CommandFrame>; }
