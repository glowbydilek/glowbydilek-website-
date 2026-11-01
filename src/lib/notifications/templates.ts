/**
 * Customer notification templates: built-in defaults (NL/EN) that the
 * owner can edit in the admin. Placeholders use {{name}} syntax; values are
 * HTML-escaped when rendered. Each template lists the placeholders it must
 * keep, so an edit can never remove the date or time from a confirmation.
 *
 * Pure module (unit-tested).
 */
import { escapeHtml } from "../forms/validation";

export const TEMPLATE_KEYS = ["request_received", "confirmed", "proposed", "declined", "rescheduled", "cancelled", "reminder", "price_proposal", "price_accepted", "aftercare"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type TLocale = "nl" | "en";

export type TemplateDef = { subject: string; body: string };

export const PLACEHOLDERS: Record<string, { nl: string }> = {
  firstName: { nl: "Voornaam van de klant" },
  treatments: { nl: "Gekozen behandeling(en)" },
  date: { nl: "Datum van de afspraak" },
  time: { nl: "Begintijd" },
  endTime: { nl: "Eindtijd" },
  request: { nl: "Samenvatting van de aanvraag (datum/tijd of voorkeur)" },
  location: { nl: "Praktische locatiegegevens (alleen na bevestiging, uit Instellingen)" },
  message: { nl: "Persoonlijke toelichting van Dilek (optioneel)" },
  amount: { nl: "Voorgestelde of afgesproken prijs" },
  link: { nl: "Persoonlijke link om het prijsvoorstel te bekijken en te accepteren" },
  validUntil: { nl: "Datum tot wanneer het voorstel geldig is" },
};

export const REQUIRED: Record<TemplateKey, string[]> = {
  request_received: ["firstName", "request"],
  confirmed: ["firstName", "treatments", "date", "time"],
  proposed: ["firstName", "treatments", "date", "time"],
  declined: ["firstName"],
  rescheduled: ["firstName", "date", "time"],
  cancelled: ["firstName", "date", "time"],
  reminder: ["firstName", "treatments", "date", "time"],
  price_proposal: ["firstName", "treatments", "amount", "link"],
  price_accepted: ["firstName", "treatments", "amount"],
  aftercare: ["firstName"],
};

/** Placeholders that may appear in each template (others are rejected). */
export const ALLOWED: Record<TemplateKey, string[]> = {
  request_received: ["firstName", "request", "treatments"],
  confirmed: ["firstName", "treatments", "date", "time", "endTime", "location", "message"],
  proposed: ["firstName", "treatments", "date", "time", "endTime", "message"],
  declined: ["firstName", "treatments", "request", "message"],
  rescheduled: ["firstName", "treatments", "date", "time", "endTime", "location", "message"],
  cancelled: ["firstName", "treatments", "date", "time", "message"],
  reminder: ["firstName", "treatments", "date", "time", "endTime", "location"],
  price_proposal: ["firstName", "treatments", "amount", "link", "validUntil", "request", "message"],
  price_accepted: ["firstName", "treatments", "amount", "request"],
  aftercare: ["firstName", "treatments", "message"],
};

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  request_received: "Aanvraag ontvangen (naar klant)",
  confirmed: "Afspraak bevestigd",
  proposed: "Ander tijdstip voorgesteld",
  declined: "Aanvraag afgewezen",
  rescheduled: "Afspraak verplaatst",
  cancelled: "Afspraak geannuleerd",
  reminder: "Herinnering (24 uur vooraf)",
  price_proposal: "Prijsvoorstel (bij ‘prijs op aanvraag’)",
  price_accepted: "Prijsvoorstel geaccepteerd (bevestiging)",
  aftercare: "Nazorgbericht na de behandeling (optioneel)",
};

export const DEFAULT_TEMPLATES: Record<TemplateKey, Record<TLocale, TemplateDef>> = {
  request_received: {
    nl: {
      subject: "We hebben je aanvraag ontvangen — Glow by Dilek",
      body: "Hoi {{firstName}},\n\nDank je wel voor je afspraakaanvraag. Hij is goed aangekomen.\n\n{{request}}\n\nLet op: dit is nog geen bevestigde afspraak. Dilek bekijkt je aanvraag en laat je zo snel mogelijk persoonlijk weten of het tijdstip past.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "We have received your request — Glow by Dilek",
      body: "Hi {{firstName}},\n\nThank you for your appointment request. It has arrived safely.\n\n{{request}}\n\nPlease note: this is not yet a confirmed appointment. Dilek will review your request and let you know personally as soon as possible whether the time works.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  confirmed: {
    nl: {
      subject: "Je afspraak is bevestigd — {{date}} om {{time}}",
      body: "Hoi {{firstName}},\n\nJe afspraak is bevestigd:\n\nBehandeling: {{treatments}}\nDatum: {{date}}\nTijd: {{time}} – {{endTime}}\n\n{{location}}\n\n{{message}}\n\nKun je onverhoopt niet? Laat het dan zo snel mogelijk weten door op deze e-mail te antwoorden.\n\nTot dan!\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Your appointment is confirmed — {{date}} at {{time}}",
      body: "Hi {{firstName}},\n\nYour appointment is confirmed:\n\nTreatment: {{treatments}}\nDate: {{date}}\nTime: {{time}} – {{endTime}}\n\n{{location}}\n\n{{message}}\n\nIf you can't make it after all, please let us know as soon as possible by replying to this email.\n\nSee you then!\nDilek — Glow by Dilek",
    },
  },
  proposed: {
    nl: {
      subject: "Voorstel voor je afspraak — {{date}} om {{time}}",
      body: "Hoi {{firstName}},\n\nHet tijdstip uit je aanvraag is helaas niet beschikbaar. Dilek stelt dit moment voor:\n\nBehandeling: {{treatments}}\nDatum: {{date}}\nTijd: {{time}} – {{endTime}}\n\n{{message}}\n\nPast dit? Beantwoord dan deze e-mail. Je afspraak staat vast zodra Dilek hem daarna bevestigt.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "A suggested time for your appointment — {{date}} at {{time}}",
      body: "Hi {{firstName}},\n\nUnfortunately the time in your request isn't available. Dilek suggests this moment instead:\n\nTreatment: {{treatments}}\nDate: {{date}}\nTime: {{time}} – {{endTime}}\n\n{{message}}\n\nDoes this work for you? Please reply to this email. Your appointment is fixed once Dilek confirms it afterwards.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  declined: {
    nl: {
      subject: "Over je afspraakaanvraag — Glow by Dilek",
      body: "Hoi {{firstName}},\n\nDank je wel voor je aanvraag. Helaas kan Dilek deze afspraak niet inplannen.\n\n{{message}}\n\nJe bent van harte welkom om een ander moment aan te vragen of op deze e-mail te antwoorden.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "About your appointment request — Glow by Dilek",
      body: "Hi {{firstName}},\n\nThank you for your request. Unfortunately Dilek is unable to schedule this appointment.\n\n{{message}}\n\nYou're very welcome to request another time or simply reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  rescheduled: {
    nl: {
      subject: "Je afspraak is verplaatst — {{date}} om {{time}}",
      body: "Hoi {{firstName}},\n\nJe afspraak is verplaatst naar:\n\nBehandeling: {{treatments}}\nDatum: {{date}}\nTijd: {{time}} – {{endTime}}\n\n{{location}}\n\n{{message}}\n\nPast het nieuwe tijdstip niet? Beantwoord dan deze e-mail.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Your appointment has been moved — {{date}} at {{time}}",
      body: "Hi {{firstName}},\n\nYour appointment has been moved to:\n\nTreatment: {{treatments}}\nDate: {{date}}\nTime: {{time}} – {{endTime}}\n\n{{location}}\n\n{{message}}\n\nIf the new time doesn't work for you, please reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  cancelled: {
    nl: {
      subject: "Je afspraak op {{date}} is geannuleerd",
      body: "Hoi {{firstName}},\n\nJe afspraak op {{date}} om {{time}} is geannuleerd.\n\n{{message}}\n\nWil je een nieuwe afspraak maken? Vraag dan gerust een ander moment aan of beantwoord deze e-mail.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Your appointment on {{date}} has been cancelled",
      body: "Hi {{firstName}},\n\nYour appointment on {{date}} at {{time}} has been cancelled.\n\n{{message}}\n\nWould you like to make a new appointment? Feel free to request another time or reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  reminder: {
    nl: {
      subject: "Herinnering: je afspraak morgen om {{time}}",
      body: "Hoi {{firstName}},\n\nEen vriendelijke herinnering aan je afspraak:\n\nBehandeling: {{treatments}}\nDatum: {{date}}\nTijd: {{time}} – {{endTime}}\n\n{{location}}\n\nTip: op de pagina van je behandeling staat hoe je je het beste voorbereidt.\n\nKun je onverhoopt niet? Laat het dan zo snel mogelijk weten door op deze e-mail te antwoorden.\n\nTot morgen!\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Reminder: your appointment tomorrow at {{time}}",
      body: "Hi {{firstName}},\n\nA friendly reminder of your appointment:\n\nTreatment: {{treatments}}\nDate: {{date}}\nTime: {{time}} – {{endTime}}\n\n{{location}}\n\nTip: the page of your treatment explains how best to prepare.\n\nIf you can't make it after all, please let us know as soon as possible by replying to this email.\n\nSee you tomorrow!\nDilek — Glow by Dilek",
    },
  },
  price_proposal: {
    nl: {
      subject: "Je prijsvoorstel — Glow by Dilek",
      body: "Hoi {{firstName}},\n\nDank je wel voor je aanvraag voor: {{treatments}}.\n\n{{request}}\n\nHet prijsvoorstel is: {{amount}} (inclusief btw).\n\n{{message}}\n\nBekijk het voorstel en laat weten of je akkoord gaat via deze persoonlijke link:\n{{link}}\n\nHet voorstel is geldig tot en met {{validUntil}}. Je zit nergens aan vast zolang je niet akkoord gaat.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Your price proposal — Glow by Dilek",
      body: "Hi {{firstName}},\n\nThank you for your request for: {{treatments}}.\n\n{{request}}\n\nThe proposed price is: {{amount}} (including VAT).\n\n{{message}}\n\nView the proposal and let us know whether you agree via this personal link:\n{{link}}\n\nThe proposal is valid until {{validUntil}}. You are not committed to anything until you accept.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  price_accepted: {
    nl: {
      subject: "Je hebt het prijsvoorstel geaccepteerd — Glow by Dilek",
      body: "Hoi {{firstName}},\n\nDank je wel! Je hebt het prijsvoorstel geaccepteerd.\n\nBehandeling: {{treatments}}\nAfgesproken prijs: {{amount}} (inclusief btw)\n\n{{request}}\n\nAls het tijdstip nog niet vaststaat, laat Dilek je persoonlijk weten wanneer de afspraak is bevestigd.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "You accepted the price proposal — Glow by Dilek",
      body: "Hi {{firstName}},\n\nThank you! You have accepted the price proposal.\n\nTreatment: {{treatments}}\nAgreed price: {{amount}} (including VAT)\n\n{{request}}\n\nIf the time is not fixed yet, Dilek will let you know personally once the appointment is confirmed.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  },
  aftercare: {
    nl: {
      subject: "Fijn dat je er was — Glow by Dilek",
      body: "Hoi {{firstName}},\n\nDank je wel voor je bezoek. Hopelijk heb je ervan genoten.\n\n{{message}}\n\nOp de website vind je nog eens alle nazorgtips op een rij. Heb je vragen of reageert je huid anders dan verwacht? Antwoord dan gerust op deze e-mail.\n\nHartelijke groet,\nDilek — Glow by Dilek",
    },
    en: {
      subject: "Lovely to see you — Glow by Dilek",
      body: "Hi {{firstName}},\n\nThank you for your visit. We hope you enjoyed it.\n\n{{message}}\n\nYou can find all aftercare tips on the website. Any questions, or is your skin reacting differently than expected? Just reply to this email.\n\nWarm regards,\nDilek — Glow by Dilek",
    },
  }
};

const TAG = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

/** Validates an edited template. Returns Dutch error messages (empty = valid). */
export function validateTemplate(key: TemplateKey, t: TemplateDef): string[] {
  const errors: string[] = [];
  const all = `${t.subject}\n${t.body}`;
  if (!t.subject.trim()) errors.push("Het onderwerp mag niet leeg zijn.");
  if (t.subject.length > 200) errors.push("Het onderwerp is te lang (max. 200 tekens).");
  if (t.body.length > 5000) errors.push("De tekst is te lang (max. 5000 tekens).");
  if (/<\s*\/?\s*[a-z]/i.test(all)) errors.push("HTML is niet toegestaan; gebruik gewone tekst.");
  const used = new Set([...all.matchAll(TAG)].map((m) => m[1]));
  for (const p of used) if (!ALLOWED[key].includes(p)) errors.push(`Onbekende plaatshouder {{${p}}}.`);
  for (const p of REQUIRED[key]) if (!used.has(p)) errors.push(`De plaatshouder {{${p}}} (${PLACEHOLDERS[p].nl.toLowerCase()}) is verplicht.`);
  if ((all.match(/\{\{/g) ?? []).length !== (all.match(/\}\}/g) ?? []).length) errors.push("Een plaatshouder is niet goed afgesloten.");
  return errors;
}

export type RenderVars = Partial<Record<string, string>>;

/** Fills placeholders; empty optional values drop their paragraph. */
export function renderTemplate(t: TemplateDef, vars: RenderVars): { subject: string; text: string; paragraphs: string[] } {
  const fill = (s: string) => s.replace(TAG, (_, k: string) => vars[k] ?? "");
  const subject = fill(t.subject).replace(/\s+/g, " ").trim();
  const paragraphs = t.body
    .split(/\n{2,}/)
    .map((p) => fill(p).replace(/[ \t]+$/gm, "").trim())
    .filter(Boolean);
  return { subject, text: paragraphs.join("\n\n"), paragraphs };
}

/** Branded HTML for rendered paragraphs (values are escaped; line breaks kept). */
export function paragraphsToHtml(paragraphs: string[]): string {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;color:#292724;font-size:15px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f8f5ef;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
<div style="background:#292724;color:#f8f5ef;padding:22px 28px;border-radius:14px 14px 0 0;font-family:Georgia,serif;font-size:22px"><span style="color:#d6b98a">Glow</span> <i>by Dilek</i></div>
<div style="background:#ffffff;padding:28px;border-radius:0 0 14px 14px">${body}</div>
<p style="color:#635b54;font-size:12px;text-align:center;margin:20px 0 0">Glow by Dilek · hello@glowbydilek.nl · glowbydilek.nl</p>
</div></body></html>`;
}
