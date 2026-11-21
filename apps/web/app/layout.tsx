import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "./tokens.css";
import "./styles.css";
import { PrefsProvider } from "../components/Prefs.tsx";

export const metadata: Metadata = {
  title: "FamilyOS",
  description: "Privater Familienplaner – technischer Stand mit Designvorschau (Beispieldaten)",
  robots: { index: false, follow: false }, // demo build: never indexed
  appleWebApp: { capable: true, title: "FamilyOS", statusBarStyle: "black-translucent" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0B0E1D" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de" data-fo-theme="dark"><body><PrefsProvider>{children}</PrefsProvider></body></html>;
}
