import type { LegalDoc, LegalKey } from "./legal.nl";

/** Legal pages (EN). See legal.nl.ts for the rules; the Dutch text prevails. */
export const legalEn: Record<LegalKey, LegalDoc> = {
  cookies: {
    title: "Cookie policy",
    effectiveDate: "1 November 2026",
    intro: "This page explains which cookies and similar techniques this website uses, what for, and how to change your choice.",
    sections: [
      {
        title: "Without consent: only what is necessary",
        paragraphs: [
          "As a visitor we do not place cookies for advertising or profiling. Your choice about statistics (yes or no) is stored in your own browser (local storage, key ‘glow-consent-v1’) so we do not ask again on every visit.",
          "The owner’s management area uses one necessary session cookie to stay signed in. It applies to the owner only, not to visitors.",
        ],
      },
      {
        title: "Statistics (only with your consent)",
        paragraphs: [
          "If the owner has switched statistics on and you give consent, the website uses Google Analytics 4 to see how the site is used. Google then places cookies such as ‘_ga’ and ‘_ga_…’. Advertising features are off, and no names, email addresses, phone numbers or appointment details are sent to Google.",
          "Without your consent, Google Analytics is not loaded.",
        ],
      },
      {
        title: "Form security",
        paragraphs: ["The contact, appointment and review forms use Cloudflare Turnstile to prevent abuse by bots. Cloudflare processes technical data about your browser and connection for this. See Cloudflare’s privacy policy for details."],
      },
      {
        title: "Changing your choice",
        paragraphs: ["Use ‘Cookie settings’ at the bottom of every page to change or withdraw your choice at any time. You can also delete cookies in your browser settings."],
      },
    ],
  },
  terms: {
    title: "Terms and conditions",
    effectiveDate: "[INVULLEN: effective date]",
    intro: "These terms apply to appointments at Glow by Dilek. The Dutch version prevails. [INVULLEN: have this text checked before publishing.]",
    sections: [
      { title: "Appointments", paragraphs: ["An appointment is only final after personal confirmation by email.", "[INVULLEN: how far ahead appointments can be made, and whether a deposit applies — or remove this line.]"] },
      { title: "Prices and payment", paragraphs: ["Prices include VAT. For ‘price on request’ you first receive a price proposal that you accept yourself.", "[INVULLEN: accepted payment methods.]"] },
      { title: "Health and safety", paragraphs: ["Please mention medication, skin conditions, allergies or pregnancy beforehand. If in doubt, a treatment may not go ahead; this is in your interest.", "A beauty treatment is not a medical treatment."] },
      { title: "Complaints", paragraphs: ["Not happy with something? Let us know as soon as possible via hello@glowbydilek.nl and we will look for a solution together.", "[INVULLEN: period within which a complaint can be reported.]"] },
      { title: "Liability", paragraphs: ["[INVULLEN: have the liability clause drafted or checked by a lawyer or your trade association.]"] },
    ],
  },
  cancellation: {
    title: "Cancellation policy",
    effectiveDate: "[INVULLEN: effective date]",
    intro: "Can’t make it after all? Please let us know as soon as possible so someone else can have your spot.",
    sections: [
      { title: "Cancelling or rescheduling", paragraphs: ["Cancel or reschedule by replying to your confirmation email or by emailing hello@glowbydilek.nl.", "[INVULLEN: until how many hours beforehand cancelling or rescheduling is free of charge.]"] },
      { title: "Late or no-show", paragraphs: ["[INVULLEN: what happens with late cancellation or a no-show — for example no charge, or a fixed amount. Only mention charges you actually apply.]"] },
      { title: "If Glow by Dilek has to cancel", paragraphs: ["If an appointment has to be cancelled due to illness or circumstances beyond our control, you will hear as soon as possible and we will plan a new time together. No charges apply."] },
    ],
  },
  reviews: {
    title: "Review policy",
    effectiveDate: "[INVULLEN: effective date]",
    intro: "How we handle reviews on this website.",
    sections: [
      { title: "Who can post a review", paragraphs: ["Anyone can submit a review through the website. After a completed appointment Dilek may also send a personal invitation; such a review is linked to a real appointment."] },
      { title: "Checked before publication", paragraphs: ["Every review is read before it goes online. Reviews are not published if they contain other people’s personal data, offensive content, advertising or medical claims, or are not about the writer’s own experience. Reviews are never edited; Dilek may post a public reply."] },
      { title: "No rewards", paragraphs: ["No discount, gift or other reward is given for a review."] },
      { title: "Reporting", paragraphs: ["Something wrong with a published review? Use the ‘Report’ button. After several reports the review is looked at again."] },
    ],
  },
};
