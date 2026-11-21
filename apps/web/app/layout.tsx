import type { Metadata, Viewport } from "next";
import "./styles.css";
export const metadata: Metadata = { title: "FamilyOS – Starter", description: "Privater KI-Familienplaner: technisches Sprint-0-Grundgerüst", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#16375f" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
