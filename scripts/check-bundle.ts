/** Fails if privileged secret names/values or server-only identifiers ended up in the browser bundle. Run after `npm run build`. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../apps/web/.next/", import.meta.url).pathname;
const staticDir = join(root, "static");
if (!existsSync(staticDir)) { console.error("apps/web/.next/static not found: run `npm run build` first."); process.exit(2); }
const forbidden = [/SERVICE_ROLE/i, /service_role/, /ANTHROPIC_API_KEY/, /GOOGLE_CLIENT_SECRET/, /sk-ant-/, /GOCSPX-/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\.map$/];
let scanned = 0;
const problems: string[] = [];
const walk = (d: string): void => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    scanned++;
    if (/\.map$/.test(p)) problems.push(`source map shipped to browser: ${p}`);
    if (!/\.(js|css|html|json|txt)$/.test(p)) continue;
    const src = readFileSync(p, "utf8");
    for (const re of forbidden.slice(0, -1)) if (re.test(src)) problems.push(`${re} found in ${p}`);
  }
};
walk(staticDir);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`bundle check ok: ${scanned} files under .next/static scanned, no secrets or source maps`);
