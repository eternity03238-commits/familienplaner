import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Architecture fitness + static security checks (no database, no network).
 * They encode CLAUDE.md guard rails so that violations fail CI instead of review.
 */
const ROOT = new URL("..", import.meta.url).pathname;
const SKIP = new Set(["node_modules", ".next", ".git", "coverage", "dist"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const all = walk(ROOT);
const rel = (p: string) => relative(ROOT, p);
const read = (p: string) => readFileSync(p, "utf8");
const sourceFiles = (pkg: string) => all.filter(p => rel(p).startsWith(`packages/${pkg}/src/`) && /\.tsx?$/.test(p));
const importsOf = (src: string) => [...src.matchAll(/(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)].map(m => m[1] ?? m[2]);

test("packages/domain and packages/planning are pure: no IO, env, network or foreign package imports", () => {
  for (const pkg of ["domain", "planning"]) {
    const files = sourceFiles(pkg);
    assert.ok(files.length > 0, `no sources found for ${pkg}`);
    for (const file of files) {
      const src = read(file);
      for (const imp of importsOf(src)) assert.ok(imp.startsWith("./"), `${rel(file)} imports "${imp}" (only same-package relative imports allowed)`);
      assert.doesNotMatch(src, /\bprocess\.env\b|\bfetch\s*\(|\bXMLHttpRequest\b|\brequire\s*\(|node:/, `${rel(file)} performs IO or reads the environment`);
    }
  }
});

test("packages/planning has no model/AI dependency (deterministic engine, ADR-0003)", () => {
  for (const file of sourceFiles("planning")) assert.doesNotMatch(read(file), /anthropic|@familyos\/ai|packages\/ai|openai/i, rel(file));
});

test("packages/ai cannot reach the database or write paths (no direct AI SQL tools)", () => {
  for (const file of sourceFiles("ai")) {
    const src = read(file);
    for (const imp of importsOf(src)) assert.doesNotMatch(imp, /database|supabase|\bpg\b|connectors|node:fs|node:child_process/, `${rel(file)} imports ${imp}`);
    assert.doesNotMatch(src, /service_role|SERVICE_ROLE|\b(select|insert|update|delete)\b[\s\S]{0,40}\b(from|into|set)\b/i, `${rel(file)} contains SQL or privileged keys`);
  }
});

test("connectors and auth packages do not import the database package directly (layering)", () => {
  for (const pkg of ["connectors", "auth", "ai"])
    for (const file of sourceFiles(pkg)) for (const imp of importsOf(read(file))) assert.doesNotMatch(imp, /database/, `${rel(file)} -> ${imp}`);
});

test("privileged secrets are never referenced from web app code or exposed via NEXT_PUBLIC_", () => {
  const web = all.filter(p => rel(p).startsWith("apps/web/") && /\.(tsx?|mjs|js|json|css|webmanifest)$/.test(p) && !rel(p).includes("package-lock") && !rel(p).endsWith("package.json"));
  assert.ok(web.length > 0);
  // Since Sprint 1 the server holds secrets, but only in apps/web/lib/server (guarded by `server-only`).
  const serverDir = (f: string) => rel(f).startsWith("apps/web/lib/server/");
  for (const file of web.filter(f => !serverDir(f))) assert.doesNotMatch(read(file), /SERVICE_ROLE|SUPABASE_SECRET_KEY|ANTHROPIC_API_KEY|GOOGLE_CLIENT_SECRET|service_role/, rel(file));
  for (const file of web.filter(serverDir)) assert.match(read(file), /^import "server-only";/, `${rel(file)} must import "server-only" first`);
  for (const file of web.filter(f => /^"use client"/.test(read(f)))) assert.doesNotMatch(read(file), /lib\/server\//, `${rel(file)}: client code must not import server modules`);
  const env = read(join(ROOT, ".env.example"));
  for (const line of env.split("\n").filter(l => /^[A-Z_]+=/.test(l))) {
    const [key, value = ""] = line.split("=");
    if (key.startsWith("NEXT_PUBLIC_")) assert.doesNotMatch(key, /SECRET|SERVICE|PRIVATE|TOKEN/, `${key} would ship to browsers`);
    if (/SECRET|SERVICE_ROLE|API_KEY|TOKEN/.test(key)) assert.equal(value.trim(), "", `${key} must be empty in .env.example`);
  }
});

test("no secrets, tokens or private keys are committed anywhere in the repository", () => {
  const patterns: [string, RegExp][] = [
    ["JWT", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
    ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{10,}/],
    ["OpenAI-style key", /\bsk-[A-Za-z0-9]{32,}/],
    ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ["AWS key", /\bAKIA[0-9A-Z]{16}\b/],
    ["Google OAuth secret", /GOCSPX-[A-Za-z0-9_-]{10,}/],
    ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
    ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/]
  ];
  for (const file of all) {
    if (rel(file) === "package-lock.json" || !/\.(ts|tsx|mjs|js|json|md|sql|toml|yml|yaml|css|webmanifest|example|sh)$/.test(file) && !file.endsWith(".env.example")) continue;
    const src = read(file);
    for (const [name, re] of patterns) assert.doesNotMatch(src, re, `${name} found in ${rel(file)}`);
  }
});

test("only synthetic e-mail addresses appear in the repository (no real family or school contacts)", () => {
  const allowed = /@(familyos\.test|example\.(com|org|net)|anthropic\.com|users\.noreply\.github\.com)$/;
  for (const file of all) {
    if (rel(file) === "package-lock.json" || /\.(png|ico|woff2?)$/.test(file)) continue;
    for (const m of read(file).matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g))
      if (!allowed.test(m[0]) && !/@(types|next|eslint|supabase|familyos)\b/.test(m[0]) && !/\.(js|ts|json|mjs)$/.test(m[0])) assert.fail(`unexpected e-mail address "${m[0]}" in ${rel(file)}`);
  }
});

const migrations = readdirSync(join(ROOT, "packages/database/migrations")).filter(f => f.endsWith(".sql")).sort();

test("migrations are consecutively numbered and every migration after 0002 ships a rollback script", () => {
  migrations.forEach((m, i) => assert.ok(m.startsWith(String(i + 1).padStart(4, "0") + "_"), `unexpected migration sequence at ${m}`));
  for (const m of migrations.slice(2)) assert.ok(existsSync(join(ROOT, "packages/database/rollback", m.replace(/\.sql$/, ".down.sql"))), `missing rollback for ${m}`);
});

test("migrations: every SECURITY DEFINER function pins search_path and no migration grants to anon or PUBLIC on tables", () => {
  for (const m of migrations) {
    const sql = read(join(ROOT, "packages/database/migrations", m));
    for (const fn of sql.split(/create (?:or replace )?function/i).slice(1)) {
      const header = fn.split(/\$\$|\$[a-z_]*\$/i)[0];
      if (/security\s+definer/i.test(header)) assert.match(header, /set\s+search_path\s*=\s*''/i, `${m}: definer function without fixed search_path`);
    }
    assert.doesNotMatch(sql, /grant\s+(?!usage\b)[^;]*\bto\s+(anon|public)\b/i, `${m} grants privileges to anon/public`);
    assert.doesNotMatch(sql, /grant\s+(insert|update|delete|truncate|all)\b[^;]*\bto\s+authenticated\b/i, `${m} grants client writes (Sprint 0 has none)`);
  }
});

test("migrations: every table created in 0001 is covered by the RLS list in 0002", () => {
  const created = [...read(join(ROOT, "packages/database/migrations", migrations[0])).matchAll(/create table public\.(\w+)/g)].map(m => m[1]);
  const sec = read(join(ROOT, "packages/database/migrations", migrations[1]));
  for (const t of created) assert.match(sec, new RegExp(`'${t}'`), `${t} is not listed for RLS in 0002`);
  assert.equal(created.length, 24);
});

test("web app: no raw HTML injection, no health-route data leaks", () => {
  for (const file of all.filter(p => rel(p).startsWith("apps/web/app/") && /\.tsx?$/.test(p))) assert.doesNotMatch(read(file), /dangerouslySetInnerHTML|eval\(|process\.env/, rel(file));
  const health = read(join(ROOT, "apps/web/app/api/health/route.ts"));
  assert.match(health, /no-store/);
  assert.match(health, /productionReady:\s*false/);
});

test("PWA manifest is German and stays inside the deployment path", () => {
  const m = read(join(ROOT, "apps/web/app/manifest.tsx"));
  assert.match(m, /name: "FamilyOS"/);
  assert.match(m, /lang: "de"/);
  assert.match(m, /start_url: "\."/, "relative start_url works on localhost and on the GitHub Pages subpath");
});

test("GitHub Pages build is a static demo only: no API routes, never indexed", () => {
  const cfg = read(join(ROOT, "apps/web/next.config.ts"));
  assert.match(cfg, /output: "export"/);
  assert.match(cfg, /pageExtensions: \["tsx"\]/, "route.ts handlers (e.g. /api/health) are excluded from the static build");
  assert.match(read(join(ROOT, "apps/web/app/layout.tsx")), /index: false/);
  const wf = read(join(ROOT, ".github/workflows/pages.yml"));
  assert.doesNotMatch(wf, /secrets\./, "the public demo build must not receive secrets");
  assert.match(wf, /permissions:[\s\S]*pages: write/);
});
