/** Database error classification for honest, non-sensitive messages (pure). */

/** Classifies a database error without echoing its message (it can contain host names). */
export function dbErrorKind(err: unknown): "auth" | "unreachable" | "unknownDb" | "noTables" | "other" {
  const code = (err as { code?: string; errno?: number })?.code ?? "";
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_DBACCESS_DENIED_ERROR") return "auth";
  if (code === "ER_BAD_DB_ERROR") return "unknownDb";
  if (code === "ER_NO_SUCH_TABLE") return "noTables";
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EHOSTUNREACH", "PROTOCOL_CONNECTION_LOST"].includes(code) || String((err as Error)?.message) === "timeout") return "unreachable";
  return "other";
}

export const DB_HINT: Record<ReturnType<typeof dbErrorKind>, string> = {
  auth: "De databasegebruiker of het wachtwoord in DATABASE_URL klopt niet.",
  unreachable: "De database is niet bereikbaar. Gebruik host 127.0.0.1 (niet localhost of srvNNNN.hstgr.io) en poort 3306.",
  unknownDb: "De databasenaam in DATABASE_URL bestaat niet.",
  noTables: "De tabellen ontbreken: de migraties zijn nog niet uitgevoerd (zet DB_MIGRATE_ON_BUILD=true en bouw opnieuw).",
  other: "De database gaf een onverwachte fout. Bekijk de serverlogs in Hostinger.",
};
