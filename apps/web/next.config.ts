import type { NextConfig } from "next";

// Conservative baseline headers. A strict CSP needs nonces and is introduced together with auth (Sprint 1).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@familyos/domain", "@familyos/planning"],
  // Allow opening the dev server from an iPhone in the same network (npm run dev:lan). Private ranges only.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // GAMEPLAN preview routes (design/gameplan-ui) now live in Explore/Command (Design System V2).
    return [
      { source: "/design-preview", destination: "/design-system", permanent: false },
      { source: "/design-preview/parent", destination: "/command", permanent: false },
      { source: "/design-preview/child", destination: "/explore", permanent: false },
      { source: "/design-preview/study", destination: "/command/planung", permanent: false }
    ];
  }
};
export default nextConfig;
