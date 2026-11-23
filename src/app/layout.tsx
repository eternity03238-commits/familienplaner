import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyOS Explore – Design Preview",
  description: "Interaktiver FamilyOS Designprototyp für Eltern und Kinder.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
