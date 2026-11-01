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
    effectiveDate: "1 november 2026",
    intro: "Op deze pagina lees je welke cookies en vergelijkbare technieken deze website gebruikt, waarvoor, en hoe je je keuze wijzigt.",
    sections: [
      {
        title: "Zonder toestemming: alleen wat nodig is",
        paragraphs: [
          "Als bezoeker van de website plaatsen wij geen cookies voor advertenties of profielen. Je keuze voor statistieken (ja of nee) wordt in je eigen browser bewaard (lokale opslag, sleutel ‘glow-consent-v1’), zodat we het niet bij elk bezoek opnieuw vragen.",
          "De beheeromgeving van de eigenaar gebruikt één noodzakelijke sessiecookie om ingelogd te blijven. Die geldt alleen voor de eigenaar, niet voor bezoekers.",
        ],
      },
      {
        title: "Statistieken (alleen met jouw toestemming)",
        paragraphs: [
          "Als de eigenaar statistieken heeft aangezet én jij toestemming geeft, gebruikt de website Google Analytics 4 om te zien hoe de site wordt gebruikt. Google plaatst dan cookies zoals ‘_ga’ en ‘_ga_…’. Advertentiefuncties staan uit en er worden geen namen, e-mailadressen, telefoonnummers of afspraakgegevens naar Google gestuurd.",
          "Geef je geen toestemming, dan wordt Google Analytics niet geladen.",
        ],
      },
      {
        title: "Beveiliging van formulieren",
        paragraphs: [
          "Bij het contact-, afspraak- en beoordelingsformulier gebruiken we Cloudflare Turnstile om misbruik door robots te voorkomen. Cloudflare verwerkt daarbij technische gegevens over je browser en verbinding. Meer informatie vind je in de privacyverklaring van Cloudflare.",
        ],
      },
      {
        title: "Je keuze wijzigen",
        paragraphs: ["Via ‘Cookie-instellingen’ onderaan elke pagina kun je je keuze altijd wijzigen of intrekken. Je kunt cookies ook verwijderen via de instellingen van je browser."],
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
