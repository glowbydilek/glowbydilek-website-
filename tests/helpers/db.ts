import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as schema from "../../src/lib/db/schema.ts";
import type { DB } from "../../src/lib/db/client.ts";

export const TEST_DB_URL = process.env.TEST_DATABASE_URL;
export const skipDb = TEST_DB_URL ? false : "TEST_DATABASE_URL not set";

let pool: mysql.Pool | null = null;
let db: DB | null = null;
let migrated = false;

export async function testDb(): Promise<DB> {
  if (!TEST_DB_URL) throw new Error("TEST_DATABASE_URL not set");
  if (!pool) {
    pool = mysql.createPool({ uri: TEST_DB_URL, connectionLimit: 8, timezone: "Z", multipleStatements: true });
    db = drizzle(pool, { schema, mode: "default" }) as unknown as DB;
  }
  if (!migrated) {
    await migrate(db!, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
    migrated = true;
  }
  return db!;
}

/** Empties every table (tests own the test database). */
export async function resetDb(): Promise<DB> {
  const d = await testDb();
  const [rows] = (await pool!.query("SHOW TABLES")) as unknown as [Record<string, string>[]];
  const tables = rows.map((r) => Object.values(r)[0]).filter((t) => t !== "__drizzle_migrations");
  await pool!.query(`SET FOREIGN_KEY_CHECKS=0; ${tables.map((t) => `TRUNCATE TABLE \`${t}\``).join("; ")}; SET FOREIGN_KEY_CHECKS=1;`);
  return d;
}

export async function closeDb() {
  await pool?.end();
  pool = null;
  db = null;
  migrated = false;
}
