import "server-only";
import type { DB } from "./client";
import { auditLogs } from "./schema";

/** Writes an audit-log entry. Never pass passwords, tokens or message bodies in `details`. */
export async function audit(
  db: DB,
  entry: { userId?: number | null; action: string; entity?: string; entityId?: string | number; details?: Record<string, unknown>; ipHash?: string | null },
) {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId != null ? String(entry.entityId) : null,
      details: entry.details ?? null,
      ipHash: entry.ipHash ?? null,
    });
  } catch (err) {
    console.error("[audit] write failed:", err instanceof Error ? err.message.slice(0, 120) : err);
  }
}
