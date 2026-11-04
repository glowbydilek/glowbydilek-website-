import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { databaseConfigured, getDb } from "../db/client";
import { users } from "../db/schema";
import { getMailConfig } from "../mail/config";
import { ownerEmail } from "../auth/service";
import { DB_HINT, dbErrorKind } from "./errors";

/**
 * Operator status checks for /login/status. Shows only green/amber/red and
 * plain-language hints: never secret values, personal data, hostnames or
 * stack traces. Safe to show to anyone who opens the page.
 */

export type CheckState = "ok" | "warn" | "fail";
export type Check = { id: string; label: string; state: CheckState; hint: string };

const ms = (p: Promise<unknown>, t: number) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), t))]);

function journalCount(): number | null {
  try {
    const j = JSON.parse(readFileSync(path.join(process.cwd(), "drizzle/meta/_journal.json"), "utf8")) as { entries: unknown[] };
    return j.entries.length;
  } catch {
    return null;
  }
}

let smtpCache: { at: number; check: Check } | null = null;

async function smtpCheck(): Promise<Check> {
  const cfg = getMailConfig();
  if (!cfg) return { id: "smtp", label: "E-mail (SMTP)", state: "fail", hint: "SMTP_HOST, SMTP_USER en SMTP_PASS ontbreken: wachtwoordmails en afspraakmails kunnen niet worden verstuurd." };
  if (smtpCache && Date.now() - smtpCache.at < 5 * 60_000) return smtpCache.check;
  let check: Check;
  try {
    const t = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass }, connectionTimeout: 8000, greetingTimeout: 6000, socketTimeout: 8000 });
    await ms(t.verify(), 10_000);
    check = { id: "smtp", label: "E-mail (SMTP)", state: "ok", hint: "Verbinding en inloggen bij de mailserver lukken." };
  } catch (err) {
    const code = String((err as { code?: string })?.code ?? "");
    check = {
      id: "smtp",
      label: "E-mail (SMTP)",
      state: "fail",
      hint: code === "EAUTH" ? "De mailserver weigert het wachtwoord (SMTP_PASS) of de gebruiker (SMTP_USER)." : "De mailserver is niet bereikbaar. Controleer SMTP_HOST, SMTP_PORT (465) en SMTP_SECURE (true).",
    };
  }
  smtpCache = { at: Date.now(), check };
  return check;
}

export async function systemStatus(origin: string | null): Promise<Check[]> {
  const out: Check[] = [];
  const secret = process.env.AUTH_SECRET ?? "";
  out.push(
    secret.length >= 32
      ? { id: "auth", label: "Sessiesleutel (AUTH_SECRET)", state: "ok", hint: "Ingesteld." }
      : { id: "auth", label: "Sessiesleutel (AUTH_SECRET)", state: "fail", hint: "Ontbreekt of is korter dan 32 tekens: inloggen is niet mogelijk." },
  );

  if (!databaseConfigured()) {
    out.push({ id: "db", label: "Database", state: "fail", hint: "DATABASE_URL ontbreekt. Maak in Hostinger een MySQL-database en zet de verbinding in de omgevingsvariabelen." });
  } else {
    try {
      const db = getDb();
      const [rows] = (await ms(db.execute(sql`SELECT NOW(3) AS now`), 6000)) as unknown as [{ now: Date | string }[]];
      out.push({ id: "db", label: "Database", state: "ok", hint: "Verbonden." });
      const skew = Math.abs(new Date(rows?.[0]?.now ?? Date.now()).getTime() - Date.now());
      out.push(
        skew < 120_000
          ? { id: "clock", label: "Klok server en database", state: "ok", hint: "Loopt gelijk." }
          : { id: "clock", label: "Klok server en database", state: "warn", hint: "Server en database lopen meer dan 2 minuten uit elkaar (tijdzone-instelling)." },
      );
      const expected = journalCount();
      try {
        const [m] = (await db.execute(sql`SELECT COUNT(*) AS n FROM __drizzle_migrations`)) as unknown as [{ n: number }[]];
        const n = Number(m?.[0]?.n ?? 0);
        out.push(
          expected == null || n >= expected
            ? { id: "migrations", label: "Databasestructuur (migraties)", state: "ok", hint: `${n} van ${expected ?? n} migraties uitgevoerd.` }
            : { id: "migrations", label: "Databasestructuur (migraties)", state: "fail", hint: `${n} van ${expected} migraties uitgevoerd. Zet DB_MIGRATE_ON_BUILD=true en bouw opnieuw.` },
        );
      } catch {
        out.push({ id: "migrations", label: "Databasestructuur (migraties)", state: "fail", hint: DB_HINT.noTables });
      }
      try {
        const owners = await db.select({ email: users.email, hash: users.passwordHash, role: users.role }).from(users);
        const owner = owners.find((u) => u.role === "owner");
        out.push(
          !owner
            ? { id: "owner", label: "Eigenaarsaccount", state: "warn", hint: "Wordt aangemaakt bij het eerste bezoek aan de inlogpagina." }
            : !owner.hash
              ? { id: "owner", label: "Eigenaarsaccount", state: "warn", hint: `Account bestaat${owner.email === ownerEmail() ? " voor OWNER_EMAIL" : ""}, maar heeft nog geen wachtwoord: gebruik "Wachtwoord vergeten?" of de eenmalige instelcode.` }
              : { id: "owner", label: "Eigenaarsaccount", state: "ok", hint: "Account met wachtwoord aanwezig." },
        );
      } catch {
        /* reported by the migration check */
      }
    } catch (err) {
      out.push({ id: "db", label: "Database", state: "fail", hint: DB_HINT[dbErrorKind(err)] });
    }
  }

  out.push(await smtpCheck());

  const cron = process.env.CRON_SECRET ?? "";
  out.push(
    cron.length >= 24
      ? { id: "cron", label: "Geplande taken (CRON_SECRET)", state: "ok", hint: "Ingesteld. Controleer in Hostinger dat de cronjob minstens elk uur draait (bijv. 0 * * * *)." }
      : { id: "cron", label: "Geplande taken (CRON_SECRET)", state: "warn", hint: "Ontbreekt: herinneringen en opnieuw versturen van mails werken niet." },
  );

  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const tsSecret = process.env.TURNSTILE_SECRET_KEY ?? "";
  const testKey = /^1x0000|^2x0000|^3x0000/.test(site) || /^1x0000|^2x0000|^3x0000/.test(tsSecret);
  out.push(
    !site || !tsSecret
      ? { id: "turnstile", label: "Spambeveiliging (Turnstile)", state: "fail", hint: "Sleutels ontbreken: openbare formulieren weigeren aanvragen." }
      : testKey && process.env.NODE_ENV === "production" && process.env.TURNSTILE_ALLOW_TEST_KEYS !== "true"
        ? { id: "turnstile", label: "Spambeveiliging (Turnstile)", state: "fail", hint: "Er staan testsleutels: vervang ze door de productiesleutels." }
        : { id: "turnstile", label: "Spambeveiliging (Turnstile)", state: "ok", hint: "Sleutels ingesteld." },
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let host = "";
  try {
    host = siteUrl ? new URL(siteUrl).host : "";
  } catch {
    host = "";
  }
  out.push(
    !host
      ? { id: "origin", label: "Websiteadres (NEXT_PUBLIC_SITE_URL)", state: "fail", hint: "Ontbreekt of is ongeldig: links in e-mails werken niet." }
      : origin && origin !== host
        ? { id: "origin", label: "Websiteadres (NEXT_PUBLIC_SITE_URL)", state: "warn", hint: "Komt niet overeen met het adres van deze pagina; links in e-mails wijzen naar een ander domein." }
        : { id: "origin", label: "Websiteadres (NEXT_PUBLIC_SITE_URL)", state: "ok", hint: "Komt overeen." },
  );

  const setup = process.env.OWNER_SETUP_TOKEN ?? "";
  if (setup) out.push({ id: "setup", label: "Eenmalige instelcode (OWNER_SETUP_TOKEN)", state: setup.length >= 24 ? "warn" : "fail", hint: setup.length >= 24 ? "Ingesteld. Verwijder deze variabele nadat het eerste wachtwoord is gekozen." : "Te kort: gebruik minimaal 24 willekeurige tekens." });
  return out;
}
