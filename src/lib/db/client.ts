import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Database connection (MySQL / MariaDB on Hostinger).
 *
 * DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE  (set in Hostinger,
 * never committed). Without it the public website still works from its
 * built-in content; the admin, agenda and online booking report that the
 * database is not configured.
 */
export type DB = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { __glowPool?: mysql.Pool; __glowDb?: DB };

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): DB {
  if (globalForDb.__glowDb) return globalForDb.__glowDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: poolSize(),
    connectTimeout: 5000,
    timezone: "Z",
    dateStrings: false,
    charset: "utf8mb4_unicode_ci",
    supportBigNumbers: true,
  });
  globalForDb.__glowPool = pool;
  globalForDb.__glowDb = drizzle(pool, { schema, mode: "default" });
  return globalForDb.__glowDb;
}

/**
 * `next build` renders the static pages in many parallel worker processes,
 * each with its own pool. On shared hosting (Hostinger limits connections per
 * database user) 5 connections per worker exceeded that limit, so the CMS
 * queries failed during the build and freshly deployed pages showed the
 * built-in content until the first revalidation. One connection per build
 * worker is plenty for those short, sequential reads.
 */
function poolSize(): number {
  if (process.env.NEXT_PHASE === "phase-production-build") return 1;
  return Math.max(1, Number(process.env.DATABASE_POOL_SIZE) || 5);
}

/** Short, secret-free description of a database error (driver code + message, also from a wrapped `cause`). */
export function describeDbError(err: unknown): string {
  if (!(err instanceof Error)) return String(err).slice(0, 160);
  const cause = (err as Error & { cause?: unknown }).cause;
  const root = cause instanceof Error ? cause : err;
  const code = (root as Error & { code?: string }).code;
  return `${code ? code + ": " : ""}${root.message}`.slice(0, 200);
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Runs `fn` only when a database is configured and reachable; otherwise returns `fallback`. */
export async function withDbOrFallback<T>(fn: (db: DB) => Promise<T>, fallback: T): Promise<T> {
  if (!databaseConfigured()) return fallback;
  try {
    return await fn(getDb());
  } catch (err) {
    console.error("[db] query failed, using fallback:", describeDbError(err));
    return fallback;
  }
}

export { schema };
