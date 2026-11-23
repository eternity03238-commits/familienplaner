import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Monorepo: tell eslint-plugin-next where the App Router app lives.
  { settings: { next: { rootDir: "apps/web/" } } },
  { ignores: [".next/**", "apps/web/.next/**", "apps/web/out/**", "node_modules/**", "next-env.d.ts"] }
]);
