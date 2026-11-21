import type { Metadata } from "next";
import { Catalogue } from "../../components/Catalogue.tsx";
export const metadata: Metadata = { title: "Design-System V2 · FamilyOS", robots: { index: false, follow: false } };
export default function DesignSystemPage() { return <Catalogue />; }
