import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export const ROOT = new URL("..", import.meta.url).pathname;
export const MIGRATIONS_DIR = join(ROOT, "packages/database/migrations");
export const SHIM_FILE = join(ROOT, "packages/database/test-support/00_supabase_compat.sql");

/** Test databases must be local and disposable. Never point these tools at a hosted/production DB. */
export function assertLocalDisposable(url: string): URL {
  const u = new URL(url);
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(host);
  if (!local) throw new Error(`Refusing non-local database host: ${host}`);
  return u;
}

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort();
}

export async function applySqlFile(client: pg.Client, file: string): Promise<void> {
  await client.query(readFileSync(file, "utf8"));
}

export function makeClient(url: string): pg.Client {
  return new pg.Client({ connectionString: url });
}
