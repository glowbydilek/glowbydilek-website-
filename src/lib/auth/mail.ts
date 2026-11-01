import "server-only";
import { siteConfig } from "@/content/site";
import { escapeHtml } from "../forms/validation";
import { sendMail } from "../mail/send";
import type { Area } from "./session";

/**
 * Sends the password-reset link directly (not through the outbox, so the
 * token is never written to the database or logs). The link is built from
 * the configured site URL — never from the request's Host header.
 */
export async function sendResetEmail(to: string, token: string, area: Area): Promise<void> {
  const url = `${siteConfig.url}/${area}/wachtwoord-herstellen?token=${encodeURIComponent(token)}`;
  const text = [
    "Hallo Dilek,",
    "",
    "Er is gevraagd om het wachtwoord van Admin Glow by Dilek en Glow by Dilek — Agenda opnieuw in te stellen.",
    "Kies een nieuw wachtwoord via deze link. De link is 15 minuten geldig en werkt één keer:",
    url,
    "",
    "Heb je dit niet zelf gevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft ongewijzigd.",
    "",
    "— Glow by Dilek",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#292724;max-width:560px">
<p>Hallo Dilek,</p>
<p>Er is gevraagd om het wachtwoord van <strong>Admin Glow by Dilek</strong> en <strong>Glow by Dilek — Agenda</strong> opnieuw in te stellen.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#292724;color:#f8f5ef;padding:12px 22px;border-radius:999px;text-decoration:none">Nieuw wachtwoord kiezen</a></p>
<p style="color:#635b54;font-size:13px">De link is 15 minuten geldig en werkt één keer. Heb je dit niet zelf gevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft ongewijzigd.</p>
</div>`;
  await sendMail({ to, subject: "Nieuw wachtwoord instellen — Glow by Dilek", text, html });
}
