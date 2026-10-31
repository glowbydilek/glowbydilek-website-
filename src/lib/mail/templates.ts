import type { AppointmentInput, ContactInput, ContactTopic, TimeRange } from "../forms/validation";
import { escapeHtml } from "../forms/validation";

type Mail = { subject: string; text: string; html: string };

const topicLabels: Record<ContactTopic, { nl: string; en: string }> = {
  question: { nl: "Algemene vraag", en: "General question" },
  treatment: { nl: "Vraag over een behandeling", en: "Question about a treatment" },
  appointment: { nl: "Afspraak", en: "Appointment" },
  other: { nl: "Overig", en: "Other" },
};

const timeLabels: Record<TimeRange, { nl: string; en: string }> = {
  morning: { nl: "Ochtend", en: "Morning" },
  afternoon: { nl: "Middag", en: "Afternoon" },
  evening: { nl: "Avond", en: "Evening" },
  flexible: { nl: "Flexibel", en: "Flexible" },
};

function formatDate(iso: string, locale: "nl" | "en"): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

/** Simple, robust HTML layout that renders well in all mail clients. */
function layout(title: string, rows: [string, string][], intro?: string, outro?: string): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px 10px 0;color:#5d675c;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>` +
        `<td style="padding:10px 0;color:#232825;font-size:15px;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f0e8;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
<div style="background:#20382f;color:#f4f0e8;padding:24px 28px;border-radius:14px 14px 0 0;font-family:Georgia,serif;font-size:22px">Glow by Dilek</div>
<div style="background:#ffffff;padding:28px;border-radius:0 0 14px 14px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#20382f">${escapeHtml(title)}</h1>
${intro ? `<p style="margin:0 0 20px;color:#232825;font-size:15px;line-height:1.6">${escapeHtml(intro)}</p>` : ""}
${rows.length ? `<table style="border-collapse:collapse;width:100%">${body}</table>` : ""}
${outro ? `<p style="margin:24px 0 0;color:#232825;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(outro)}</p>` : ""}
</div>
<p style="color:#5d675c;font-size:12px;text-align:center;margin:20px 0 0">Glow by Dilek · hello@glowbydilek.nl · glowbydilek.nl</p>
</div></body></html>`;
}

function textBlock(title: string, rows: [string, string][], intro?: string, outro?: string): string {
  return [title, "", intro, intro ? "" : null, ...rows.map(([k, v]) => `${k}: ${v}`), outro ? "" : null, outro]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");
}

function mail(subject: string, title: string, rows: [string, string][], intro?: string, outro?: string): Mail {
  return { subject, text: textBlock(title, rows, intro, outro), html: layout(title, rows, intro, outro) };
}

// ---------------------------------------------------------------- Contact

export function contactOwnerMail(d: ContactInput): Mail {
  return mail(
    `Nieuw bericht via de website — ${d.name}`,
    "Nieuw contactbericht",
    [
      ["Naam", d.name],
      ["E-mail", d.email],
      ["Telefoon", d.phone ?? "—"],
      ["Onderwerp", topicLabels[d.topic].nl],
      ["Taal", d.locale === "nl" ? "Nederlands" : "Engels"],
      ["Bericht", d.message],
    ],
    "Via het contactformulier op glowbydilek.nl is een nieuw bericht binnengekomen. Klik op ‘Beantwoorden’ om de klant direct te antwoorden.",
  );
}

export function contactCustomerMail(d: ContactInput): Mail {
  if (d.locale === "en") {
    return mail(
      "We have received your message — Glow by Dilek",
      `Thank you, ${d.name}`,
      [
        ["Subject", topicLabels[d.topic].en],
        ["Your message", d.message],
      ],
      "Thank you for your message. Dilek has received it and will reply personally as soon as possible.",
      "This is an automatic confirmation of receipt. If you have anything to add, simply reply to this email.\n\nWarm regards,\nGlow by Dilek",
    );
  }
  return mail(
    "We hebben je bericht ontvangen — Glow by Dilek",
    `Dank je wel, ${d.name}`,
    [
      ["Onderwerp", topicLabels[d.topic].nl],
      ["Je bericht", d.message],
    ],
    "Bedankt voor je bericht. Dilek heeft het ontvangen en reageert zo snel mogelijk persoonlijk.",
    "Dit is een automatische ontvangstbevestiging. Wil je nog iets toevoegen? Beantwoord dan gewoon deze e-mail.\n\nHartelijke groet,\nGlow by Dilek",
  );
}

// ------------------------------------------------------------ Appointment

export function appointmentOwnerMail(d: AppointmentInput, treatmentNames: string[]): Mail {
  return mail(
    `Afspraakaanvraag — ${d.name} — ${formatDate(d.preferredDate, "nl")}`,
    "Nieuwe afspraakaanvraag",
    [
      ["Behandeling(en)", treatmentNames.join(", ")],
      ["Voorkeursdatum", formatDate(d.preferredDate, "nl")],
      ["Tijdvoorkeur", timeLabels[d.timeRange].nl],
      ["Alternatief", d.alternative ?? "—"],
      ["Naam", d.name],
      ["E-mail", d.email],
      ["Telefoon", d.phone ?? "—"],
      ["Opmerking", d.notes ?? "—"],
      ["Taal", d.locale === "nl" ? "Nederlands" : "Engels"],
    ],
    "Er is een nieuwe afspraakaanvraag binnengekomen via glowbydilek.nl. Deze afspraak is nog NIET bevestigd. Beantwoord deze e-mail om een moment met de klant af te stemmen.",
  );
}

export function appointmentCustomerMail(d: AppointmentInput, treatmentNames: string[]): Mail {
  if (d.locale === "en") {
    return mail(
      "Your appointment request has been received — Glow by Dilek",
      `Thank you, ${d.name}`,
      [
        ["Treatment(s)", treatmentNames.join(", ")],
        ["Preferred date", formatDate(d.preferredDate, "en")],
        ["Preferred time", timeLabels[d.timeRange].en],
        ["Alternative", d.alternative ?? "—"],
      ],
      "We have received your appointment request. Please note: your appointment is requested, but not yet confirmed. Dilek will personally contact you to confirm a date and time.",
      "Only after Dilek's personal confirmation is your appointment final. Want to change something? Simply reply to this email.\n\nWarm regards,\nGlow by Dilek",
    );
  }
  return mail(
    "Je afspraakaanvraag is ontvangen — Glow by Dilek",
    `Dank je wel, ${d.name}`,
    [
      ["Behandeling(en)", treatmentNames.join(", ")],
      ["Voorkeursdatum", formatDate(d.preferredDate, "nl")],
      ["Tijdvoorkeur", timeLabels[d.timeRange].nl],
      ["Alternatief", d.alternative ?? "—"],
    ],
    "We hebben je afspraakaanvraag goed ontvangen. Let op: je afspraak is aangevraagd, maar nog niet bevestigd. Dilek neemt persoonlijk contact met je op om een datum en tijd te bevestigen.",
    "Pas na de persoonlijke bevestiging van Dilek staat je afspraak vast. Wil je iets wijzigen? Beantwoord dan gewoon deze e-mail.\n\nHartelijke groet,\nGlow by Dilek",
  );
}
