import type { NextConfig } from "next";

/**
 * Two build targets:
 *  - default (`next build` / `next start`): full app incl. /api/health, security headers, redirects.
 *  - GitHub Pages demo (`FAMILYOS_PAGES_BASE=/<repo> next build`): static export of the fixture-only screens.
 *    Route handlers (route.ts) are excluded via pageExtensions; headers/redirects do not exist on static hosting.
 */
const pagesBase = process.env.FAMILYOS_PAGES_BASE;
if (pagesBase !== undefined && !/^(\/[a-z0-9._-]+)?$/i.test(pagesBase)) throw new Error(`Invalid FAMILYOS_PAGES_BASE: ${pagesBase}`);

// Conservative baseline headers. A strict CSP needs nonces and is introduced together with auth (Sprint 1).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
];

const shared: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@familyos/domain", "@familyos/planning"]
};

const pagesConfig: NextConfig = {
  ...shared,
  output: "export",
  basePath: pagesBase || undefined,
  trailingSlash: true,
  pageExtensions: ["tsx"],
  images: { unoptimized: true }
};

const serverConfig: NextConfig = {
  ...shared,
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

export default pagesBase !== undefined ? pagesConfig : serverConfig;
