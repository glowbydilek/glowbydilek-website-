/**
 * Applies pending database migrations from ./drizzle (plain JavaScript, so
 * it runs on Hostinger without a TypeScript toolchain).
 *
 *   DATABASE_URL=mysql://… node scripts/db-migrate.mjs
 *
 * During `npm run build` it runs automatically only when
 * DB_MIGRATE_ON_BUILD=true (Hostinger has no SSH on every plan); a failed
 * migration then fails the build, so a broken schema is never deployed.
 */
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const onBuild = process.argv.includes("--on-build");
if (onBuild && process.env.DB_MIGRATE_ON_BUILD !== "true") {
  console.log("[db-migrate] skipped (DB_MIGRATE_ON_BUILD is not true)");
  process.exit(0);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[db-migrate] DATABASE_URL not set — nothing to migrate");
  process.exit(onBuild ? 0 : 1);
}
const conn = await mysql.createConnection({ uri: url, multipleStatements: true, connectTimeout: 10000 });
try {
  await migrate(drizzle(conn), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
  console.log("[db-migrate] database schema is up to date");
} catch (err) {
  console.error("[db-migrate] FAILED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await conn.end();
}
