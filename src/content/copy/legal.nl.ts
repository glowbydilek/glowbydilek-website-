/**
 * Juridische pagina's (NL). Bewerkbaar in Admin → Pagina's → Juridisch, met
 * versiegeschiedenis. Alleen het cookiebeleid staat standaard online, omdat
 * het uitsluitend beschrijft wat de website zelf doet. Voorwaarden en
 * annuleringsbeleid bevatten [INVULLEN: …]-markeringen: zolang die er staan,
 * kan de pagina niet worden gepubliceerd. Geen juridisch advies.
 */
export type LegalSection = { title: string; paragraphs: string[] };
export type LegalDoc = { title: string; effectiveDate: string; intro: string; sections: LegalSection[] };
export type LegalKey = "cookies" | "terms" | "cancellation" | "reviews";

export const legalNl: Record<LegalKey, LegalDoc> = {
  cookies: {
    title: "Cookiebeleid",
    effectiveDate: "4 november 2026",
    intro: "Op deze pagina lees je welke cookies en vergelijkbare technieken (zoals lokale opslag in je browser) deze website gebruikt, waarvoor, hoe lang, en hoe je je keuze wijzigt of intrekt. Optionele cookies worden pas geplaatst nadat je daar zelf ‘ja’ op hebt gezegd.",
    sections: [
      {
        title: "Je keuze",
        paragraphs: [
          "Bij je eerste bezoek kies je ‘Alles accepteren’, ‘Alles weigeren’ of ‘Voorkeuren instellen’. Weigeren is net zo eenvoudig als accepteren en heeft geen invloed op afspraken maken, contact opnemen of het bekijken van de website. Niets is vooraf aangevinkt en doorscrollen telt niet als toestemming.",
          "Je kunt je keuze altijd wijzigen of intrekken via ‘Cookie-instellingen’ onderaan elke pagina. Trek je toestemming in, dan worden de Google Analytics-cookies verwijderd en wordt Google Analytics niet meer geladen. Je keuze wordt na 12 maanden, of wanneer dit beleid inhoudelijk wijzigt, opnieuw gevraagd.",
        ],
      },
      {
        title: "Noodzakelijk (altijd aan)",
        paragraphs: [
          "glow-consent-v2 — Glow by Dilek (lokale opslag in je browser) — onthoudt je cookiekeuze, het tijdstip en de versie van dit beleid. Wordt niet naar ons verstuurd. Bewaartermijn: 12 maanden.",
          "glow-lang — Glow by Dilek (lokale opslag) — onthoudt de taal die je zelf kiest. Bewaartermijn: tot je je browsergegevens wist.",
          "Cloudflare Turnstile — Cloudflare, Inc. — beveiligt het contact-, afspraak- en beoordelingsformulier tegen robots. Turnstile plaatst geen cookies op glowbydilek.nl; Cloudflare verwerkt technische gegevens over je browser en verbinding alleen voor deze controle. Zie de privacyverklaring van Cloudflare.",
          "__Host-glow_session — Glow by Dilek — houdt de eigenaar ingelogd in de beveiligde beheeromgeving. Alleen voor de eigenaar en medewerkers, niet voor bezoekers. Bewaartermijn: maximaal 30 dagen, of korter bij uitloggen.",
          "__prerender_bypass — Glow by Dilek — alleen voor de eigenaar tijdens het bekijken van een conceptversie. Bewaartermijn: tot het einde van de browsersessie.",
        ],
      },
      {
        title: "Statistieken (alleen met jouw toestemming)",
        paragraphs: [
          "_ga en _ga_<code> — Google Ireland Ltd. (Google Analytics 4) — telt anoniem welke pagina's worden bekeken, welke behandelingen worden bekeken en of een aanvraag of bericht is verstuurd. Bewaartermijn: maximaal 13 maanden.",
          "Wat we níet doen: geen namen, e-mailadressen, telefoonnummers, afspraakgegevens, gezondheidsinformatie of persoonlijke links naar Google sturen; geen advertentiefuncties, geen Google Signals, geen gepersonaliseerde advertenties. De beveiligde beheeromgeving en persoonlijke links (zoals een prijsvoorstel) worden nooit gemeten.",
          "Google Consent Mode v2: zonder toestemming wordt geen Google-script geladen. Geef je toestemming, dan staan ‘analytics_storage’ alleen op ‘granted’ en ‘ad_storage’, ‘ad_user_data’ en ‘ad_personalization’ altijd op ‘denied’.",
        ],
      },
      {
        title: "Marketing",
        paragraphs: ["Deze website gebruikt geen marketing- of advertentiecookies. Als dat ooit verandert, wordt dit beleid aangepast en wordt je toestemming opnieuw gevraagd voordat er iets wordt geplaatst."],
      },
      {
        title: "Externe inhoud",
        paragraphs: ["Er zijn geen ingesloten video's, kaarten of social-media-widgets. Links naar sociale media zijn gewone links: pas als je erop klikt, verlaat je deze website."],
      },
    ],
  },
  terms: {
    title: "Algemene voorwaarden",
    effectiveDate: "[INVULLEN: ingangsdatum]",
    intro: "Deze voorwaarden gelden voor afspraken bij Glow by Dilek. [INVULLEN: laat deze tekst controleren voordat je hem publiceert.]",
    sections: [
      { title: "Afspraken", paragraphs: ["Een afspraak is pas definitief na persoonlijke bevestiging per e-mail.", "[INVULLEN: hoe lang van tevoren een afspraak kan worden gemaakt, en of er een aanbetaling geldt — of verwijder deze regel.]"] },
      { title: "Prijzen en betaling", paragraphs: ["Prijzen zijn inclusief btw. Bij ‘prijs op aanvraag’ ontvang je eerst een prijsvoorstel dat je zelf accepteert.", "[INVULLEN: hoe er betaald kan worden (bijv. pin of contant).]"] },
      { title: "Gezondheid en veiligheid", paragraphs: ["Meld vooraf medicijngebruik, huidaandoeningen, allergieën of zwangerschap. Bij twijfel kan een behandeling niet doorgaan; dat is in jouw belang.", "Een schoonheidsbehandeling is geen medische behandeling."] },
      { title: "Klachten", paragraphs: ["Ben je ergens niet tevreden over? Laat het zo snel mogelijk weten via hello@glowbydilek.nl, dan zoeken we samen naar een oplossing.", "[INVULLEN: termijn waarbinnen een klacht gemeld kan worden.]"] },
      { title: "Aansprakelijkheid", paragraphs: ["[INVULLEN: laat de aansprakelijkheidsregeling opstellen of controleren door een jurist of je beroepsvereniging.]"] },
    ],
  },
  cancellation: {
    title: "Annuleringsbeleid",
    effectiveDate: "[INVULLEN: ingangsdatum]",
    intro: "Kun je onverhoopt niet? Laat het dan zo snel mogelijk weten, zodat iemand anders je plek kan krijgen.",
    sections: [
      { title: "Annuleren of verzetten", paragraphs: ["Annuleren of verzetten kan door te antwoorden op je bevestigingsmail of te mailen naar hello@glowbydilek.nl.", "[INVULLEN: tot hoeveel uur van tevoren kosteloos annuleren of verzetten kan.]"] },
      { title: "Te laat of niet verschenen", paragraphs: ["[INVULLEN: wat er gebeurt bij te laat annuleren of niet verschijnen — bijvoorbeeld geen kosten, of een vast bedrag. Noem alleen kosten die je echt rekent.]"] },
      { title: "Als Glow by Dilek moet annuleren", paragraphs: ["Moet een afspraak door ziekte of overmacht vervallen, dan hoor je dat zo snel mogelijk en plannen we samen een nieuw moment. Er worden dan geen kosten gerekend."] },
    ],
  },
  reviews: {
    title: "Beoordelingsbeleid",
    effectiveDate: "[INVULLEN: ingangsdatum]",
    intro: "Zo gaan we om met beoordelingen op deze website.",
    sections: [
      { title: "Wie een beoordeling kan plaatsen", paragraphs: ["Iedereen kan via de website een beoordeling insturen. Na een afgeronde afspraak kan Dilek je ook een persoonlijke uitnodiging sturen; zo’n beoordeling is gekoppeld aan een echte afspraak."] },
      { title: "Controle vóór publicatie", paragraphs: ["Elke beoordeling wordt gelezen voordat hij online komt. Beoordelingen worden niet geplaatst als ze persoonsgegevens van anderen, beledigende inhoud, reclame of medische claims bevatten, of niet over een eigen ervaring gaan. Beoordelingen worden niet aangepast; wel kan Dilek een openbare reactie plaatsen."] },
      { title: "Geen beloning", paragraphs: ["Voor een beoordeling wordt geen korting, cadeau of andere beloning gegeven."] },
      { title: "Melden", paragraphs: ["Klopt er iets niet aan een gepubliceerde beoordeling? Gebruik de knop ‘Melden’. Na meerdere meldingen wordt de beoordeling opnieuw bekeken."] },
    ],
  },
};
