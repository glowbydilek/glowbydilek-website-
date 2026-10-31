/**
 * SMTP configuration — read from environment variables ONLY (never commit
 * secrets). Set these in Hostinger: Website dashboard → Environment
 * variables (see docs/EMAIL.md), then rebuild/redeploy.
 *
 *   SMTP_HOST      smtp.hostinger.com
 *   SMTP_PORT      465
 *   SMTP_SECURE    true            (true for 465/SSL, false for 587/STARTTLS)
 *   SMTP_USER      hello@glowbydilek.nl
 *   SMTP_PASS      <mailbox password — secret>
 *   MAIL_TO        hello@glowbydilek.nl   (optional, defaults to SMTP_USER)
 *   MAIL_FROM_NAME Glow by Dilek          (optional)
 */
export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  to: string;
  fromName: string;
};

export function getMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT || 465);
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE.trim().toLowerCase() === "true" : port === 465;
  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user,
    pass,
    to: env.MAIL_TO?.trim() || user,
    fromName: env.MAIL_FROM_NAME?.trim() || "Glow by Dilek",
  };
}
