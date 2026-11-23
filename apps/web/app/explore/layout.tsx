import type { Metadata } from "next";
import { ExploreFrame } from "../../components/explore/ExploreFrame.tsx";
export const metadata: Metadata = { title: "FamilyOS Explore (Demo)", robots: { index: false, follow: false } };
export default function ExploreLayout({ children }: { children: React.ReactNode }) { return <ExploreFrame>{children}</ExploreFrame>; }
