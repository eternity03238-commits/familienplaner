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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};
export default nextConfig;
