import "server-only";
import { sql } from "drizzle-orm";
import type { DB } from "./client";

/**
 * Persistent fixed-window rate limiting and one-time keys, shared by every
 * app process (stored in MySQL, survives restarts).
 */
export async function hitLimit(db: DB, key: string, limit: number, windowMs: number, now = new Date()): Promise<boolean> {
  const exp = new Date(now.getTime() + windowMs);
  await db.execute(sql`
    INSERT INTO rate_limits (\`key\`, count, window_start, expires_at) VALUES (${key}, 1, ${now}, ${exp})
    ON DUPLICATE KEY UPDATE
      count = IF(expires_at <= ${now}, 1, count + 1),
      window_start = IF(expires_at <= ${now}, ${now}, window_start),
      expires_at = IF(expires_at <= ${now}, ${exp}, expires_at)`);
  const [rows] = (await db.execute(sql`SELECT count FROM rate_limits WHERE \`key\` = ${key}`)) as unknown as [{ count: number }[]];
  return (rows[0]?.count ?? 0) <= limit;
}

/** Current count without incrementing. */
export async function peekLimit(db: DB, key: string, now = new Date()): Promise<number> {
  const [rows] = (await db.execute(sql`SELECT count FROM rate_limits WHERE \`key\` = ${key} AND expires_at > ${now}`)) as unknown as [{ count: number }[]];
  return rows[0]?.count ?? 0;
}

export async function clearLimit(db: DB, key: string) {
  await db.execute(sql`DELETE FROM rate_limits WHERE \`key\` = ${key}`);
}

/** Claims a one-time key. Returns false if it was already claimed and has not expired. */
export async function claimOnce(db: DB, key: string, ttlMs: number, now = new Date()): Promise<boolean> {
  await db.execute(sql`DELETE FROM rate_limits WHERE \`key\` = ${key} AND expires_at <= ${now}`);
  const [res] = (await db.execute(
    sql`INSERT IGNORE INTO rate_limits (\`key\`, count, window_start, expires_at) VALUES (${key}, 1, ${now}, ${new Date(now.getTime() + ttlMs)})`,
  )) as unknown as [{ affectedRows: number }];
  return res.affectedRows === 1;
}

export async function releaseOnce(db: DB, key: string) {
  await clearLimit(db, key);
}

export async function purgeExpiredLimits(db: DB, now = new Date()) {
  await db.execute(sql`DELETE FROM rate_limits WHERE expires_at <= ${now}`);
}
