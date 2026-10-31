import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getMailConfig, type MailConfig } from "./config";

let cached: { key: string; transporter: Transporter } | null = null;

function transporterFor(cfg: MailConfig): Transporter {
  const key = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}`;
  if (cached?.key === key) return cached.transporter;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    requireTLS: !cfg.secure && cfg.port === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  cached = { key, transporter };
  return transporter;
}

export type OutgoingMail = {
  to: string;
  replyTo?: string | { name: string; address: string };
  subject: string;
  text: string;
  html: string;
};

export function mailConfigured(): boolean {
  return getMailConfig() !== null;
}

/** Sends one email from the business mailbox. Throws on failure. */
export async function sendMail(m: OutgoingMail): Promise<void> {
  const cfg = getMailConfig();
  if (!cfg) throw new Error("SMTP is not configured");
  await transporterFor(cfg).sendMail({
    from: { name: cfg.fromName, address: cfg.user },
    to: m.to,
    replyTo: m.replyTo,
    subject: m.subject,
    text: m.text,
    html: m.html,
  });
}

export function ownerAddress(): string {
  return getMailConfig()?.to ?? "";
}
