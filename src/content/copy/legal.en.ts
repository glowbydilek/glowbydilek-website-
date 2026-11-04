import type { LegalDoc, LegalKey } from "./legal.nl";

/** Legal pages (EN). See legal.nl.ts for the rules; the Dutch text prevails. */
export const legalEn: Record<LegalKey, LegalDoc> = {
  cookies: {
    title: "Cookie policy",
    effectiveDate: "4 November 2026",
    intro: "This page explains which cookies and similar techniques (such as local storage in your browser) this website uses, what for, for how long, and how to change or withdraw your choice. Optional cookies are only placed after you say ‘yes’.",
    sections: [
      {
        title: "Your choice",
        paragraphs: [
          "On your first visit you choose ‘Accept all’, ‘Reject all’ or ‘Customise preferences’. Rejecting is as easy as accepting and does not affect booking, getting in touch or browsing the website. Nothing is pre-ticked and scrolling does not count as consent.",
          "You can change or withdraw your choice at any time via ‘Cookie settings’ at the bottom of every page. If you withdraw consent, the Google Analytics cookies are removed and Google Analytics is no longer loaded. You are asked again after 12 months or when this policy changes materially.",
        ],
      },
      {
        title: "Necessary (always on)",
        paragraphs: [
          "glow-consent-v2 — Glow by Dilek (local storage in your browser) — remembers your cookie choice, its time and the version of this policy. Not sent to us. Retention: 12 months.",
          "glow-lang — Glow by Dilek (local storage) — remembers the language you chose. Retention: until you clear your browser data.",
          "Cloudflare Turnstile — Cloudflare, Inc. — protects the contact, appointment and review forms against bots. Turnstile places no cookies on glowbydilek.nl; Cloudflare processes technical data about your browser and connection for this check only. See Cloudflare’s privacy policy.",
          "__Host-glow_session — Glow by Dilek — keeps the owner signed in to the secure management area. For the owner and staff only, not for visitors. Retention: up to 30 days, or shorter when signing out.",
          "__prerender_bypass — Glow by Dilek — only for the owner while previewing a draft. Retention: until the end of the browser session.",
        ],
      },
      {
        title: "Statistics (only with your consent)",
        paragraphs: [
          "_ga and _ga_<code> — Google Ireland Ltd. (Google Analytics 4) — counts, anonymously, which pages and treatments are viewed and whether a request or message was sent. Retention: up to 13 months.",
          "What we do not do: send names, email addresses, phone numbers, appointment details, health information or personal links to Google; use advertising features, Google Signals or personalised ads. The secure management area and personal links (such as a price proposal) are never measured.",
          "Google Consent Mode v2: without consent no Google script is loaded. With consent, only ‘analytics_storage’ is ‘granted’; ‘ad_storage’, ‘ad_user_data’ and ‘ad_personalization’ always stay ‘denied’.",
        ],
      },
      {
        title: "Marketing",
        paragraphs: ["This website uses no marketing or advertising cookies. If that ever changes, this policy will be updated and your consent asked again before anything is placed."],
      },
      {
        title: "External content",
        paragraphs: ["There are no embedded videos, maps or social media widgets. Links to social media are ordinary links: you only leave this website when you click them."],
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
