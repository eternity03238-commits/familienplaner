import pg from "pg";
import { assertLocalDisposable } from "../../scripts/lib-db.ts";
import { auth, type Actor } from "./fixtures.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Run `npm run db:prepare` (plain Postgres) or `supabase start`, then `npm run test:db`.");
assertLocalDisposable(url);

export const pool = new pg.Pool({ connectionString: url, max: 4 });

export interface Failure { code: string | undefined; message: string }
export interface Q {
  /** Run a statement; a database error fails the test. */
  rows<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** Run a statement that is EXPECTED to fail; returns the SQLSTATE. Uses a savepoint so the session stays usable. */
  fails(sql: string, params?: readonly unknown[]): Promise<Failure>;
}

export type Identity =
  | { role: "anon" }
  | { role: "service_role" }
  | { role: "authenticated"; actor?: Actor; sub?: string }
  | { role: "superuser"; actor?: Actor };

/**
 * Runs `fn` inside a transaction that is always rolled back. Mirrors what PostgREST does for each
 * request: switch to the API role and expose the verified JWT claims via `request.jwt.claims`.
 */
export async function withIdentity<T>(who: Identity, fn: (q: Q) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let n = 0;
  const q: Q = {
    async rows<R>(sql: string, params: readonly unknown[] = []) { return (await client.query(sql, params as unknown[])).rows as R[]; },
    async fails(sql: string, params: readonly unknown[] = []) {
      const sp = `sp_${n++}`;
      await client.query(`savepoint ${sp}`);
      try {
        await client.query(sql, params as unknown[]);
      } catch (e) {
        await client.query(`rollback to savepoint ${sp}`);
        const err = e as { code?: string; message: string };
        return { code: err.code, message: err.message };
      }
      await client.query(`release savepoint ${sp}`);
      throw new Error(`Expected statement to fail but it succeeded: ${sql}`);
    }
  };
  try {
    await client.query("begin");
    if (who.role !== "superuser") await client.query(`set local role ${who.role}`);
    const sub = who.role === "authenticated" ? (who.sub ?? (who.actor ? auth[who.actor] : undefined)) : who.role === "superuser" && who.actor ? auth[who.actor] : undefined;
    const claims = sub ? { sub, role: who.role === "superuser" ? "authenticated" : who.role } : { role: who.role === "superuser" ? "service_role" : who.role };
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    return await fn(q);
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
}

export const asUser = (actor: Actor) => <T>(fn: (q: Q) => Promise<T>) => withIdentity({ role: "authenticated", actor }, fn);
export const asAnon = <T>(fn: (q: Q) => Promise<T>) => withIdentity({ role: "anon" }, fn);
export const asService = <T>(fn: (q: Q) => Promise<T>) => withIdentity({ role: "service_role" }, fn);
/** Superuser bypasses RLS but triggers/CHECKs still fire; `actor` sets the JWT subject seen by auth.uid(). */
export const asBackend = <T>(fn: (q: Q) => Promise<T>, actor?: Actor) => withIdentity({ role: "superuser", actor }, fn);

export const ids = async <T extends { id: string }>(q: Q, sql: string, params?: readonly unknown[]) => (await q.rows<T>(sql, params)).map(r => r.id).sort();
export const closePool = () => pool.end();
