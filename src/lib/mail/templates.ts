import { intlTag } from "@/i18n/config";
import type { AppointmentInput, ContactInput, ContactTopic, TimeRange } from "../forms/validation";
import { escapeHtml } from "../forms/validation";

type Mail = { subject: string; text: string; html: string };

const topicLabels: Record<ContactTopic, { nl: string; en: string; tr: string }> = {
  question: { nl: "Algemene vraag", en: "General question", tr: "Genel soru" },
  treatment: { nl: "Vraag over een behandeling", en: "Question about a treatment", tr: "Bir bakım hakkında soru" },
  appointment: { nl: "Afspraak", en: "Appointment", tr: "Randevu" },
  other: { nl: "Overig", en: "Other", tr: "Diğer" },
};

export const timeLabels: Record<TimeRange, { nl: string; en: string; tr: string }> = {
  morning: { nl: "Ochtend", en: "Morning", tr: "Sabah" },
  afternoon: { nl: "Middag", en: "Afternoon", tr: "Öğleden sonra" },
  evening: { nl: "Avond", en: "Evening", tr: "Akşam" },
  flexible: { nl: "Flexibel", en: "Flexible", tr: "Esnek" },
};

const languageName = { nl: "Nederlands", en: "Engels", tr: "Turks" } as const;

export function formatDate(iso: string, locale: "nl" | "en" | "tr"): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(intlTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

/** Simple, robust HTML layout that renders well in all mail clients. */
export function layout(title: string, rows: [string, string][], intro?: string, outro?: string): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px 10px 0;color:#6b635c;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>` +
        `<td style="padding:10px 0;color:#292724;font-size:15px;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f8f5ef;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
<div style="background:#292724;color:#f8f5ef;padding:22px 28px;border-radius:14px 14px 0 0;font-family:Georgia,serif;font-size:22px"><span style="color:#d6b98a">Glow</span> <i>by Dilek</i></div>
<div style="background:#ffffff;padding:28px;border-radius:0 0 14px 14px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#292724">${escapeHtml(title)}</h1>
${intro ? `<p style="margin:0 0 20px;color:#292724;font-size:15px;line-height:1.6">${escapeHtml(intro)}</p>` : ""}
${rows.length ? `<table style="border-collapse:collapse;width:100%">${body}</table>` : ""}
${outro ? `<p style="margin:24px 0 0;color:#292724;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(outro)}</p>` : ""}
</div>
<p style="color:#6b635c;font-size:12px;text-align:center;margin:20px 0 0">Glow by Dilek · hello@glowbydilek.nl · glowbydilek.nl</p>
</div></body></html>`;
}

export function textBlock(title: string, rows: [string, string][], intro?: string, outro?: string): string {
  return [title, "", intro, intro ? "" : null, ...rows.map(([k, v]) => `${k}: ${v}`), outro ? "" : null, outro]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");
}

export function mail(subject: string, title: string, rows: [string, string][], intro?: string, outro?: string): Mail {
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
      ["Taal", languageName[d.locale]],
      ["Bericht", d.message],
    ],
    "Via het contactformulier op glowbydilek.nl is een nieuw bericht binnengekomen. Klik op ‘Beantwoorden’ om de klant direct te antwoorden.",
  );
}

export function contactCustomerMail(d: ContactInput): Mail {
  if (d.locale === "tr") {
    return mail(
      "Mesajını aldık — Glow by Dilek",
      `Teşekkürler, ${d.name}`,
      [
        ["Konu", topicLabels[d.topic].tr],
        ["Mesajın", d.message],
      ],
      "Mesajın için teşekkürler. Sorunsuz ulaştı; Dilek en kısa sürede sana kişisel olarak yanıt verecek.",
      "Bu otomatik bir alındı bildirimidir. Eklemek istediğin bir şey var mı? Bu e-postayı yanıtlaman yeterli.\n\nSevgiyle,\nDilek — Glow by Dilek",
    );
  }
  if (d.locale === "en") {
    return mail(
      "We have received your message — Glow by Dilek",
      `Thank you, ${d.name}`,
      [
        ["Subject", topicLabels[d.topic].en],
        ["Your message", d.message],
      ],
      "Thank you for your message. It has arrived safely, and Dilek will reply personally as soon as she can.",
      "This is an automatic confirmation of receipt. Anything to add? Simply reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
    );
  }
  return mail(
    "We hebben je bericht ontvangen — Glow by Dilek",
    `Dank je wel, ${d.name}`,
    [
      ["Onderwerp", topicLabels[d.topic].nl],
      ["Je bericht", d.message],
    ],
    "Dank je wel voor je bericht. Het is goed aangekomen en Dilek antwoordt zo snel mogelijk persoonlijk.",
    "Dit is een automatische ontvangstbevestiging. Wil je nog iets toevoegen? Beantwoord dan gewoon deze e-mail.\n\nHartelijke groet,\nDilek — Glow by Dilek",
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
      ["Taal", languageName[d.locale]],
    ],
    "Er is een nieuwe afspraakaanvraag binnengekomen via glowbydilek.nl. Deze afspraak is nog NIET bevestigd. Beantwoord deze e-mail om de afspraak te bevestigen, een ander moment voor te stellen of de aanvraag af te wijzen — je antwoord gaat direct naar de klant. Deel praktische locatiegegevens pas in je persoonlijke bevestiging.",
  );
}

export function appointmentCustomerMail(d: AppointmentInput, treatmentNames: string[]): Mail {
  if (d.locale === "tr") {
    return mail(
      "Randevu talebin alındı — Glow by Dilek",
      `Teşekkürler, ${d.name}`,
      [
        ["Bakım(lar)", treatmentNames.join(", ")],
        ["Tercih edilen tarih", formatDate(d.preferredDate, "tr")],
        ["Tercih edilen saat", timeLabels[d.timeRange].tr],
        ["Alternatif", d.alternative ?? "—"],
      ],
      "Teşekkürler — randevu talebin bize ulaştı. Lütfen dikkat: bu bir talep, henüz onaylanmış bir randevu değil. Dilek talebini inceleyecek ve tarihi ile saati onaylamak ya da seninki uygun değilse başka bir zaman önermek için seninle kişisel olarak iletişime geçecek.",
      "Randevun ancak Dilek onayladığında kesinleşir. Bakımlar yalnızca randevu ile yapılır; adres gibi pratik bilgiler onaydan sonra kişisel olarak paylaşılır. Bir şeyi değiştirmek ya da eklemek mi istiyorsun? Bu e-postayı yanıtlaman yeterli.\n\nSevgiyle,\nDilek — Glow by Dilek",
    );
  }
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
      "Thank you — your appointment request has arrived. Please note: this is a request, not yet a confirmed appointment. Dilek will review it and contact you personally to confirm the date and time, or to suggest another moment if yours isn't available.",
      "Your appointment is only final once Dilek has confirmed it. Treatments are available by appointment only; practical location details are shared personally after confirmation. Want to change or add something? Simply reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
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
    "Dank je wel — je afspraakaanvraag is binnen. Let op: dit is een aanvraag, nog geen bevestigde afspraak. Dilek bekijkt je aanvraag en neemt persoonlijk contact met je op om datum en tijd te bevestigen, of om een ander moment voor te stellen als het jouwe niet uitkomt.",
    "Je afspraak staat pas vast als Dilek hem heeft bevestigd. Behandelingen zijn uitsluitend op afspraak; praktische locatiegegevens worden na bevestiging persoonlijk gedeeld. Wil je iets wijzigen of aanvullen? Beantwoord dan gewoon deze e-mail.\n\nHartelijke groet,\nDilek — Glow by Dilek",
  );
}
