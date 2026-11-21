/** Starts the built Next.js app on a local port and checks the public surface. Run after `npm run build`. */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const port = process.env.SMOKE_PORT ?? "3987";
const base = `http://127.0.0.1:${port}`;
/** Every request gets a hard timeout so a stuck server fails the check instead of hanging CI. */
const get = (path: string) => fetch(base + path, { signal: AbortSignal.timeout(10_000) });
const child = spawn(process.execPath, [new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname, "start", "-p", port, "-H", "127.0.0.1"], { cwd: new URL("../apps/web/", import.meta.url).pathname, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
let log = "";
child.stdout.on("data", d => (log += d));
child.stderr.on("data", d => (log += d));
const stop = () => { child.kill("SIGTERM"); };

try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    try { up = (await get("/api/health")).ok; } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  assert.ok(up, `server did not start:\n${log}`);

  const health = await get("/api/health");
  assert.equal(health.status, 200);
  assert.match(health.headers.get("cache-control") ?? "", /no-store/);
  const body = await health.json() as Record<string, unknown>;
  assert.deepEqual(body, { status: "starter", productionReady: false, liveConnections: false });

  const home = await get("/");
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<html lang="de"/);
  assert.match(html, /Kein Live-Betrieb|keine echten Termine/);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.equal(home.headers.get("x-frame-options"), "DENY");
  assert.equal(home.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(home.headers.get("x-powered-by"), null, "framework fingerprint header must be disabled");
  assert.match(html, /viewport/);

  const manifest = await get("/manifest.webmanifest");
  assert.equal(manifest.status, 200);
  assert.equal((await get("/does-not-exist")).status, 404);
  for (const secretPath of ["/.env", "/.env.local", "/package.json", "/.git/config"]) assert.equal((await get(secretPath)).status, 404, secretPath);
  console.log("smoke ok: /, /api/health, /manifest.webmanifest, 404s and security headers");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  stop();
  // `npx` spawns the server as a grandchild; make sure nothing keeps the event loop (or CI job) alive.
  setTimeout(() => process.exit(process.exitCode ?? 0), 500).unref();
}
