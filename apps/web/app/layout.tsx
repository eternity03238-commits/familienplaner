import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/archivo/wdth.css";
import "./tokens.css";
import "./styles.css";

export const metadata: Metadata = { title: "FamilyOS", description: "Privater Familienplaner – technisches Sprint-0-Grundgerüst", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F6F5F1" }, { media: "(prefers-color-scheme: dark)", color: "#111218" }]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de" className={GeistSans.variable}><body>{children}</body></html>;
}
