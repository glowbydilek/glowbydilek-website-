/**
 * Dutch copy (primary language).
 * The shape of this object defines the `Dictionary` type that every other
 * language must follow, so missing translations fail the type check.
 *
 * Content rules: no invented prices, certifications, years of experience,
 * addresses or testimonials.
 */
export const nl = {
  meta: {
    tagline: "Beauty studio",
    pages: {
      home: {
        title: "Glow by Dilek — Professioneel waxen op afspraak",
        description:
          "Professionele waxbehandelingen voor gezicht, lichaam en bikinizone. Persoonlijke aandacht, hygiëne en privacy voorop. Vraag eenvoudig een afspraak aan bij Glow by Dilek.",
      },
      treatments: {
        title: "Waxbehandelingen — gezicht, lichaam & bikini",
        description:
          "Alle waxbehandelingen van Glow by Dilek: wenkbrauwen, bovenlip, oksels, armen, benen, rug, bikinilijn, Brazilian en Hollywood. Met uitleg, voorbereiding en nazorg.",
      },
      prices: {
        title: "Prijzen waxbehandelingen",
        description:
          "Overzicht van alle waxbehandelingen bij Glow by Dilek. Vraag eenvoudig de actuele tarieven op via hello@glowbydilek.nl.",
      },
      about: {
        title: "Over Dilek",
        description:
          "Maak kennis met Dilek, de oprichter van Glow by Dilek, en ontdek waar haar persoonlijke, zorgvuldige aanpak voor staat.",
      },
      contact: {
        title: "Contact",
        description:
          "Neem contact op met Glow by Dilek via hello@glowbydilek.nl voor vragen over waxbehandelingen of om een afspraak aan te vragen.",
      },
      booking: {
        title: "Afspraak aanvragen",
        description:
          "Vraag in een paar stappen een waxafspraak aan bij Glow by Dilek. Dilek bevestigt je afspraak persoonlijk per e-mail.",
      },
    },
  },
  nav: {
    home: "Home",
    treatments: "Waxbehandelingen",
    prices: "Prijzen",
    about: "Over Dilek",
    contact: "Contact",
    booking: "Afspraak aanvragen",
    openMenu: "Menu openen",
    closeMenu: "Menu sluiten",
    skipToContent: "Direct naar inhoud",
    language: "Taal",
    main: "Hoofdmenu",
  },
  announcement: {
    text: "Afspraken op aanvraag — Dilek bevestigt persoonlijk per e-mail",
    link: "Afspraak aanvragen",
  },
  cta: {
    request: "Afspraak aanvragen",
    viewTreatments: "Bekijk behandelingen",
    viewPrices: "Bekijk prijzen",
    contact: "Neem contact op",
    aboutDilek: "Maak kennis met Dilek",
    emailUs: "Mail ons",
    allFaqs: "Meer veelgestelde vragen",
  },
  common: {
    byAppointment: "Uitsluitend op afspraak",
    location: "Op afspraak, vanuit huis. Het adres ontvang je bij de bevestiging van je afspraak.",
    onRequest: "Op aanvraag",
    goodToKnow: "Goed om te weten",
  },
  trust: [
    {
      icon: "hygiene",
      title: "Hygiëne voorop",
      body: "Een schone werkplek, verse materialen en een zorgvuldige werkwijze bij elke afspraak.",
    },
    {
      icon: "comfort",
      title: "Comfort",
      body: "Een rustige behandeling in je eigen tempo, met een zachte techniek en verzorgende nazorg.",
    },
    {
      icon: "privacy",
      title: "Privacy & discretie",
      body: "Eén klant tegelijk, in een besloten en respectvolle omgeving. Wat je deelt, blijft tussen ons.",
    },
    {
      icon: "attention",
      title: "Persoonlijke aandacht",
      body: "Elke afspraak begint met een kort gesprek over je wensen, je huid en eventuele aandachtspunten.",
    },
  ],
  home: {
    hero: {
      eyebrow: "Professioneel waxen · op afspraak",
      title: "Zacht, zuiver",
      titleEm: "en stralend.",
      subtitle:
        "Glow by Dilek staat voor verfijnde waxbehandelingen in een rustige, hygiënische en persoonlijke setting. Met aandacht voor jou, je huid en je comfort.",
      cardTitle: "Persoonlijk bevestigd",
      cardBody: "Je aanvraag wordt door Dilek zelf beantwoord.",
    },
    strip: ["Gezicht", "Lichaam", "Bikini & intiem", "Persoonlijk advies", "Verzorgende nazorg"],
    featured: {
      eyebrow: "Waxbehandelingen",
      title: "Gladde huid, van top tot teen",
      intro: "Van een strakke wenkbrauwlijn tot zijdezachte benen. Ontdek de behandelingen per zone.",
      treatmentsCount: "behandelingen",
    },
    why: {
      eyebrow: "Waarom Glow by Dilek",
      title: "Een behandeling waarin jij je op je gemak voelt",
      intro:
        "Waxen is persoonlijk. Daarom draait alles bij Glow by Dilek om vertrouwen: een zorgvuldige werkwijze, heldere uitleg en tijd voor jou.",
    },
    dilek: {
      eyebrow: "Maak kennis",
      title: "Hoi, ik ben Dilek",
      body: "Met Glow by Dilek wil ik een plek bieden waar je je direct op je gemak voelt. Ik neem de tijd, leg alles helder uit en werk nauwkeurig — zodat je met een fijn gevoel en een gladde huid weer naar huis gaat.",
      signature: "Dilek",
    },
    visit: {
      eyebrow: "Jouw afspraak",
      title: "Zo verloopt je bezoek",
      steps: [
        { title: "Aanvragen", body: "Je vraagt een afspraak aan met je gewenste behandeling en voorkeursmomenten." },
        { title: "Bevestiging", body: "Dilek stemt het moment persoonlijk met je af en stuurt je de details." },
        { title: "Behandeling", body: "Na een kort gesprek volgt een rustige, nauwkeurige behandeling." },
        { title: "Nazorg", body: "Je huid wordt verzorgd en je krijgt persoonlijk nazorgadvies mee." },
      ],
    },
    care: {
      eyebrow: "Voorbereiding & nazorg",
      title: "Het beste resultaat begint thuis",
      intro: "Met een paar eenvoudige stappen voor en na je behandeling blijft je huid rustig en langer glad.",
    },
    faq: {
      eyebrow: "Veelgestelde vragen",
      title: "Goed om te weten",
    },
    final: {
      eyebrow: "Afspraak",
      title: "Klaar om te stralen?",
      body: "Vraag in een paar stappen je afspraak aan. Dilek reageert persoonlijk per e-mail om een moment met je af te stemmen.",
    },
  },
  care: {
    before: {
      title: "Voor je behandeling",
      items: [
        "Laat het haar minimaal 0,5 cm lang worden — dat is meestal 2 tot 4 weken na scheren.",
        "Scrub de huid een dag van tevoren licht.",
        "Gebruik op de dag zelf geen bodylotion, olie of deodorant op de te behandelen zone.",
        "Vermijd zonnebaden en de zonnebank in de 48 uur voor je behandeling.",
        "Meld gevoeligheden, huidaandoeningen of medicijngebruik altijd vooraf.",
      ],
    },
    after: {
      title: "Na je behandeling",
      items: [
        "Vermijd de eerste 24 uur sauna, zonnebank, zwembad en intensief sporten.",
        "Draag bij voorkeur losse, ademende kleding.",
        "Raak de behandelde huid zo min mogelijk aan en gebruik geen geparfumeerde producten.",
        "Begin na twee dagen met regelmatig scrubben om ingegroeide haartjes te voorkomen.",
        "Houd je huid goed gehydrateerd met een milde, verzorgende crème.",
      ],
    },
  },
  faq: {
    general: [
      {
        q: "Hoe lang moet mijn haar zijn om te kunnen waxen?",
        a: "Minimaal 0,5 cm, ongeveer de lengte van een rijstkorrel. Dat is meestal 2 tot 4 weken na het scheren. Is het haar veel langer, dan kan het vooraf iets worden ingekort.",
      },
      {
        q: "Doet waxen pijn?",
        a: "Je voelt een korte, felle sensatie die snel wegtrekt. De eerste keer is meestal het gevoeligst; bij regelmatig waxen wordt het haar vaak fijner en ervaren de meeste mensen het als minder intens. Dilek werkt rustig en vertelt steeds wat ze doet.",
      },
      {
        q: "Hoe lang blijft mijn huid glad?",
        a: "Gemiddeld 3 tot 5 weken, afhankelijk van je haargroei en de behandelde zone. Omdat het haar met wortel en al wordt verwijderd, groeit het langzamer en zachter terug dan na scheren.",
      },
      {
        q: "Waar vinden de behandelingen plaats?",
        a: "Behandelingen vinden plaats op afspraak, vanuit huis, in een rustige en hygiënische omgeving. Het exacte adres ontvang je bij de bevestiging van je afspraak.",
      },
      {
        q: "Hoe maak ik een afspraak?",
        a: "Via de pagina ‘Afspraak aanvragen’ stel je eenvoudig een e-mail samen met je gewenste behandeling en voorkeursmomenten. Je kunt ook direct mailen naar hello@glowbydilek.nl. Dilek bevestigt je afspraak persoonlijk.",
      },
      {
        q: "Bieden jullie ook andere behandelingen aan, zoals laserontharing?",
        a: "Op dit moment richt Glow by Dilek zich volledig op waxing. Nieuwe behandelingen worden pas aangekondigd wanneer ze daadwerkelijk beschikbaar zijn.",
      },
    ],
    treatments: [
      {
        q: "Wanneer kan ik beter niet waxen?",
        a: "Niet op een verbrande, geïrriteerde of beschadigde huid, bij wondjes of ontstekingen, en niet kort na een peeling of laserbehandeling. Gebruik je medicijnen of huidproducten met retinoïden (zoals tretinoïne of isotretinoïne)? Dan is waxen niet geschikt. Twijfel je, overleg dan eerst met je arts en meld het altijd vooraf.",
      },
      {
        q: "Hoe voorkom ik ingegroeide haartjes?",
        a: "Begin twee dagen na je behandeling met regelmatig, mild scrubben en houd je huid goed gehydrateerd. Draag de eerste dagen bij voorkeur losse kleding.",
      },
      {
        q: "Hoe vaak moet ik waxen?",
        a: "Voor de meeste zones is elke 4 tot 6 weken een fijn ritme. Door regelmatig te waxen blijft de haargroei in dezelfde fase en wordt het resultaat vaak egaler.",
      },
      {
        q: "Is een intieme behandeling niet ongemakkelijk?",
        a: "Het is heel normaal om het de eerste keer spannend te vinden. Dilek werkt discreet en respectvol, legt elke stap uit en jij bepaalt het tempo. Je kunt altijd je vragen vooraf stellen.",
      },
    ],
  },
  treatments: {
    hero: {
      eyebrow: "Waxbehandelingen",
      title: "Verfijnde waxing,",
      titleEm: "met zorg uitgevoerd.",
      subtitle:
        "Professionele waxbehandelingen voor gezicht, lichaam en bikinizone. Hieronder vind je per zone alle behandelingen, met uitleg en tips.",
    },
    about: {
      eyebrow: "Over waxen",
      title: "Waarom kiezen voor waxen?",
      paragraphs: [
        "Bij waxen wordt het haar met wortel en al verwijderd. Daardoor blijft je huid weken glad, zonder de stoppels of jeukende huid die scheren vaak geeft.",
        "Bij regelmatig waxen groeit het haar vaak fijner en zachter terug. Een goede voorbereiding en nazorg zorgen voor een rustige huid en het mooiste resultaat.",
      ],
      facts: [
        { value: "0,5 cm", label: "minimale haarlengte" },
        { value: "3–5 wkn", label: "gemiddeld glad" },
        { value: "1 op 1", label: "persoonlijke aandacht" },
      ],
    },
    zonesLabel: "Kies een zone",
    contra: {
      title: "Wanneer niet waxen",
      intro: "Voor je veiligheid wordt in de volgende situaties niet gewaxt:",
      items: [
        "Bij een verbrande, geïrriteerde of beschadigde huid",
        "Bij wondjes, ontstekingen of huidinfecties op de zone",
        "Bij gebruik van retinoïden (zoals tretinoïne of isotretinoïne)",
        "Kort na een peeling, laser- of andere intensieve huidbehandeling",
      ],
      outro: "Twijfel je? Overleg met je arts en meld het altijd vooraf.",
    },
    faqTitle: "Vragen over waxen",
  },
  prices: {
    hero: {
      eyebrow: "Prijzen",
      title: "Heldere tarieven,",
      titleEm: "persoonlijk advies.",
      subtitle: "Een overzicht van alle waxbehandelingen. De tarieven ontvang je eenvoudig op aanvraag.",
    },
    notice: {
      title: "Actuele tarieven op aanvraag",
      body: "De prijslijst wordt binnenkort op deze pagina gepubliceerd. Tot die tijd stuurt Dilek je graag de actuele tarieven voor de behandelingen die je interesseren.",
      cta: "Vraag tarieven op",
      subject: "Vraag over tarieven",
    },
    columns: { treatment: "Behandeling", duration: "Duur", price: "Prijs" },
    from: "vanaf",
    minutes: "min",
    notes: [
      "Combineer je meerdere zones? Vermeld het bij je aanvraag, dan wordt de afspraak daarop afgestemd.",
      "Twijfel je welke behandeling bij je past? Vraag gerust om advies.",
    ],
  },
  about: {
    hero: {
      eyebrow: "Over Dilek",
      title: "Met aandacht,",
      titleEm: "voor jou en je huid.",
      subtitle: "Glow by Dilek is ontstaan vanuit één wens: waxen veranderen in een verzorgend, rustgevend moment voor jezelf.",
    },
    story: {
      eyebrow: "Mijn verhaal",
      title: "Een plek waar je je direct op je gemak voelt",
      paragraphs: [
        "Mijn naam is Dilek. Met Glow by Dilek wil ik een plek bieden die rustig, schoon en persoonlijk is — waar je niet zomaar een afspraak bent, maar écht gezien wordt.",
        "Ik geloof dat een goede behandeling begint bij aandacht. Ik neem de tijd om naar je te luisteren, leg uit wat je kunt verwachten en werk zorgvuldig, zodat je met een fijn gevoel en een gladde huid weer naar huis gaat.",
        "Of het nu je allereerste behandeling is of je al jaren waxt: bij mij ben je welkom zoals je bent.",
      ],
      portraitCaption: "Portret van Dilek volgt binnenkort",
    },
    quote: "Jouw comfort en vertrouwen zijn voor mij het allerbelangrijkst.",
    values: {
      eyebrow: "Waar ik voor sta",
      title: "Mijn belofte aan jou",
      items: [
        { title: "Zorg", body: "Een zachte, nauwkeurige aanpak die je huid respecteert." },
        { title: "Discretie", body: "Een veilige, respectvolle omgeving waarin privacy vanzelfsprekend is." },
        { title: "Eerlijk advies", body: "Heldere uitleg en advies dat past bij jouw huid en wensen." },
        { title: "Kwaliteit", body: "Aandacht voor detail en een verzorgd resultaat, elke keer opnieuw." },
      ],
    },
    vision: {
      eyebrow: "De toekomst",
      title: "Een beauty studio die met je meegroeit",
      body: "Glow by Dilek begint met waar ik in geloof: professioneel, persoonlijk waxen. Stap voor stap wil ik Glow by Dilek uitbouwen tot een beauty studio met dezelfde zorg en aandacht — en ik neem je graag mee op die reis.",
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Laten we",
      titleEm: "kennismaken.",
      subtitle: "Heb je een vraag over een behandeling of wil je een afspraak aanvragen? Stuur gerust een bericht.",
    },
    email: {
      label: "E-mail",
      note: "Dilek beantwoordt elk bericht persoonlijk.",
      subject: "Vraag via de website",
    },
    phone: "Telefoon",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    location: { title: "Locatie" },
    hours: { title: "Afspraken", body: "Behandelingen vinden uitsluitend plaats op afspraak." },
    privacy:
      "Deel via e-mail geen medische of andere gevoelige gegevens die niet nodig zijn voor het plannen van je afspraak. Gevoeligheden of aandachtspunten bespreek je gerust tijdens je afspraak.",
    requestTitle: "Direct een afspraak aanvragen?",
    requestBody: "Stel in een paar klikken je aanvraag samen.",
  },
  request: {
    eyebrow: "Afspraak aanvragen",
    title: "Stel je aanvraag samen",
    intro:
      "Kies je behandeling(en) en je voorkeursmomenten. Je e-mailprogramma opent daarna met een ingevuld bericht aan Dilek — jij verstuurt het zelf.",
    treatmentsLabel: "Welke behandeling(en)?",
    momentsLabel: "Voorkeur voor dag en tijd",
    momentsPlaceholder: "Bijvoorbeeld: dinsdagavond of zaterdagochtend, vanaf volgende week",
    noteLabel: "Opmerking (optioneel)",
    notePlaceholder: "Bijvoorbeeld: eerste keer waxen, of een vraag vooraf",
    submit: "Open e-mail met aanvraag",
    disclaimer:
      "Dit is een aanvraag, nog geen bevestigde afspraak. Er wordt niets via deze website verstuurd of opgeslagen.",
    fallback: "Werkt de knop niet? Mail dan direct naar",
    copy: "Kopieer adres",
    copied: "Gekopieerd",
    selected: "geselecteerd",
    mail: {
      subject: "Afspraakaanvraag",
      greeting: "Hoi Dilek,",
      intro: "Ik wil graag een afspraak aanvragen.",
      treatments: "Behandeling(en)",
      moments: "Voorkeur dag/tijd",
      note: "Opmerking",
      none: "nog niet zeker — graag advies",
      closing: "Met vriendelijke groet,",
      namePlaceholder: "[je naam en telefoonnummer]",
    },
  },
  booking: {
    hero: {
      eyebrow: "Afspraak aanvragen",
      title: "Jouw moment,",
      titleEm: "persoonlijk ingepland.",
      subtitle: "Vraag eenvoudig een afspraak aan. Dilek stemt het moment persoonlijk met je af en bevestigt per e-mail.",
    },
    steps: {
      title: "Zo werkt het",
      items: [
        { title: "Stel je aanvraag samen", body: "Kies je behandeling en geef je voorkeursmomenten door." },
        { title: "Verstuur de e-mail", body: "Je e-mailprogramma opent met een ingevuld bericht. Vul je naam aan en verstuur." },
        { title: "Persoonlijke bevestiging", body: "Dilek reageert om een moment af te stemmen en stuurt je de details." },
      ],
    },
    online: {
      title: "Online boeken komt eraan",
      body: "We werken aan een veilig online afsprakensysteem. Tot dat klaar is, plan je je afspraak eenvoudig via e-mail. Via deze website worden nu geen afspraken, betalingen of persoonsgegevens verwerkt.",
      features: [
        "Zelf je behandeling, datum en tijd kiezen",
        "Bevestiging en herinnering per e-mail",
        "Veilige en AVG-proof verwerking van je gegevens",
      ],
    },
  },
  footer: {
    tagline: "Professionele waxbehandelingen met persoonlijke aandacht, rust en oog voor detail.",
    treatments: "Behandelingen",
    studio: "Glow by Dilek",
    contact: "Contact",
    rights: "Alle rechten voorbehouden.",
  },
  notFound: {
    title: "Pagina niet gevonden",
    body: "De pagina die je zoekt bestaat niet (meer). Ga terug naar de homepage of bekijk de behandelingen.",
    back: "Terug naar home",
  },
};

export type Dictionary = typeof nl;
