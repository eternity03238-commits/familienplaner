import type { MetadataRoute } from "next";

// Metadata route: Next serves it at <basePath>/manifest.webmanifest and links it automatically.
// Relative start_url/scope keep the PWA inside the deployment path (localhost or GitHub Pages subpath).
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FamilyOS",
    short_name: "FamilyOS",
    description: "Privater Familienplaner – Designvorschau mit Beispieldaten",
    lang: "de",
    start_url: ".",
    scope: ".",
    display: "standalone",
    background_color: "#0B0E1D",
    theme_color: "#0B0E1D",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
