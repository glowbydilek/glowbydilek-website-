/**
 * Dutch copy — primary language. Written as native Netherlands Dutch.
 * The shape of this object defines the `Dictionary` type; the English
 * dictionary must match it, so missing translations fail the type check.
 *
 * Truthfulness rules: no invented prices, durations, certifications, years
 * of experience, addresses, opening hours, product claims or reviews.
 */
export const nl = {
  meta: {
    tagline: "Professional waxing",
    pages: {
      home: {
        title: "Glow by Dilek — Waxstudio op afspraak",
        description:
          "Persoonlijke waxstudio voor gezicht, lichaam en bikinizone. Eén klant tegelijk, een vaste hygiënische werkwijze en tijd voor jou. Vraag online je afspraak aan.",
      },
      treatments: {
        title: "Waxen voor gezicht, lichaam en bikinizone",
        description:
          "Wenkbrauwen, bovenlip, oksels, armen, benen, rug, bikinilijn, Brazilian en Hollywood waxen (harsen). Lees voor wie het geschikt is, wat je kunt verwachten en hoe je je voorbereidt.",
      },
      prices: {
        title: "Tarieven waxbehandelingen",
        description:
          "Alle waxbehandelingen van Glow by Dilek op een rij. De actuele tarieven ontvang je snel en persoonlijk via hello@glowbydilek.nl.",
      },
      about: {
        title: "Over Dilek",
        description:
          "Het verhaal en de werkwijze achter Glow by Dilek: een kleine, persoonlijke waxstudio waar rust, zorg en eerlijk advies centraal staan.",
      },
      contact: {
        title: "Contact",
        description:
          "Een vraag over waxen of een behandeling? Stuur een bericht via het formulier of mail naar hello@glowbydilek.nl. Dilek antwoordt persoonlijk.",
      },
      booking: {
        title: "Afspraak aanvragen",
        description:
          "Vraag online je waxafspraak aan. Kies je behandeling en voorkeursmoment; Dilek bekijkt je aanvraag en bevestigt de afspraak persoonlijk.",
      },
      privacy: {
        title: "Privacyverklaring",
        description: "Welke gegevens Glow by Dilek ontvangt via het contact- en afspraakformulier, waarvoor ze worden gebruikt en welke rechten je hebt.",
      },
    },
  },
  nav: {
    home: "Home",
    treatments: "Behandelingen",
    prices: "Tarieven",
    about: "Over Dilek",
    contact: "Contact",
    booking: "Afspraak aanvragen",
    privacy: "Privacy",
    openMenu: "Menu openen",
    closeMenu: "Menu sluiten",
    skipToContent: "Direct naar inhoud",
    language: "Taal",
    main: "Hoofdmenu",
  },
  cta: {
    request: "Afspraak aanvragen",
    explore: "Bekijk de behandelingen",
    viewTreatments: "Alle behandelingen",
    viewPrices: "Tarieven",
    contact: "Stel je vraag",
    aboutDilek: "Lees het verhaal van Dilek",
    allFaqs: "Meer vragen en antwoorden",
    sendMessage: "Stuur een bericht",
    emailDirect: "Mail direct",
  },
  common: {
    byAppointment: "Uitsluitend op afspraak",
    location: "Behandelingen vinden plaats op afspraak, vanuit huis. Het adres ontvang je zodra je afspraak is bevestigd.",
    onRequest: "Op aanvraag",
    goodToKnow: "Goed om te weten",
    suitableFor: "Geschikt voor",
    prev: "Vorige",
    next: "Volgende",
  },
  whatsapp: {
    label: "Stuur een WhatsApp-bericht",
    short: "WhatsApp",
    message: "Hoi Dilek, ik heb een vraag over een waxbehandeling.",
  },
  trust: [
    {
      icon: "hygiene",
      title: "Hygiëne als vertrekpunt",
      body: "Een opgeruimde, schone werkplek, verse materialen voor iedere klant en elke keer dezelfde zorgvuldige volgorde. Bij waxen is dat geen extraatje, maar de basis.",
    },
    {
      icon: "privacy",
      title: "Eén klant tegelijk",
      body: "Geen wachtkamer en geen haast. Je hebt de behandelruimte en de aandacht van Dilek helemaal voor jezelf — prettig, zeker bij een intieme behandeling.",
    },
    {
      icon: "comfort",
      title: "In jouw tempo",
      body: "Dilek vertelt wat ze gaat doen voordat ze het doet. Wil je even pauzeren of heb je een vraag? Dan is daar altijd ruimte voor.",
    },
    {
      icon: "attention",
      title: "Eerlijk advies",
      body: "Liever een goed gesprek vooraf dan een verkeerde verwachting achteraf. Is een behandeling op dit moment niet verstandig voor je huid, dan hoor je dat ook.",
    },
  ],
  home: {
    hero: {
      eyebrow: "Waxstudio · op afspraak",
      title: "Zacht voor je huid.",
      titleEm: "Rustig voor jou.",
      subtitle:
        "Glow by Dilek is een kleine, persoonlijke waxstudio voor gezicht, lichaam en bikinizone. Eén klant tegelijk, een vaste hygiënische werkwijze en de tijd om je op je gemak te voelen.",
      facts: ["Eén klant tegelijk", "Uitsluitend op afspraak", "Persoonlijk bevestigd"],
    },
    statement: {
      eyebrow: "De gedachte achter Glow",
      quote: "Waxen is persoonlijk. Daarom hoort het ook zo te voelen.",
      body: "Je vertrouwt iemand je huid toe, soms op plekken waar je liever niet over praat. Bij Glow by Dilek begint een behandeling daarom niet bij de wax, maar bij een kort gesprek: wat wil je, hoe reageert je huid, waar moet rekening mee worden gehouden? Pas daarna wordt er gewerkt — nauwkeurig, rustig en zonder haast.",
      signature: "Dilek",
    },
    treatments: {
      eyebrow: "Behandelingen",
      title: "Drie zones, één zorgvuldige werkwijze",
      intro: "Van een strakke wenkbrauwlijn tot een volledig gladde bikinizone. Elke behandeling wordt afgestemd op jouw huid, je haargroei en wat jij prettig vindt.",
      count: "behandelingen",
      more: "Lees meer",
    },
    experience: {
      eyebrow: "Zo werkt het",
      title: "Van aanvraag tot gladde huid",
      intro: "Geen ingewikkeld boekingssysteem, wel persoonlijk contact. Zo verloopt een afspraak.",
      steps: [
        { title: "Je vraagt een afspraak aan", body: "Kies online je behandeling en een voorkeursmoment. Je ontvangt meteen een ontvangstbevestiging per e-mail." },
        { title: "Dilek bevestigt persoonlijk", body: "Dilek bekijkt je aanvraag en stemt datum en tijd met je af. Pas na haar bevestiging staat je afspraak vast." },
        { title: "Een kort gesprek", body: "Bij binnenkomst bespreken jullie je wensen, je huid en eventuele gevoeligheden of medicijnen." },
        { title: "Behandeling en nazorg", body: "Rustig en nauwkeurig gewaxt, daarna een kalmerende verzorging en advies voor de dagen erna." },
      ],
    },
    standards: {
      eyebrow: "Waarom Glow by Dilek",
      title: "Waar je op kunt rekenen",
      intro: "Wat een goede waxbehandeling onderscheidt, zit zelden in grote woorden. Het zit in de details die je merkt zodra je binnenstapt.",
    },
    care: {
      eyebrow: "Voorbereiding en nazorg",
      title: "Een mooi resultaat begint thuis",
      intro: "Een paar eenvoudige stappen voor en na je afspraak maken de behandeling prettiger en houden je huid rustig.",
      firstTime: {
        title: "Voor het eerst waxen?",
        body: "Dat is spannender dan het hoeft te zijn. Laat het haar een paar weken groeien, stel gerust al je vragen vooraf en reken op een rustige, duidelijke uitleg tijdens de behandeling.",
      },
    },
    dilek: {
      eyebrow: "Maak kennis",
      title: "Hoi, ik ben Dilek",
      body: "Ik heb Glow by Dilek opgericht omdat ik geloof dat waxen meer aandacht verdient dan het vaak krijgt. Bij mij ben je de enige klant op dat moment. Ik neem de tijd, leg uit wat ik doe en werk nauwkeurig — en je mag me alles vragen.",
      quote: "Jouw comfort en vertrouwen gaan bij mij voor alles.",
    },
    faq: {
      eyebrow: "Veelgestelde vragen",
      title: "Goed om te weten",
      intro: "De vragen die het vaakst worden gesteld, kort en eerlijk beantwoord. Staat jouw vraag er niet bij? Stuur dan gerust een bericht.",
    },
    closing: {
      eyebrow: "Afspraak",
      title: "Zin in een gladde huid, zonder haast?",
      body: "Vraag in een paar stappen je afspraak aan. Je krijgt direct een ontvangstbevestiging, en Dilek neemt persoonlijk contact met je op om datum en tijd te bevestigen.",
    },
    contact: {
      eyebrow: "Liever eerst iets vragen?",
      body: "Twijfel je welke behandeling bij je past, of wil je iets bespreken voordat je een afspraak aanvraagt? Stuur een bericht of mail direct.",
    },
  },
  care: {
    before: {
      title: "Voor je afspraak",
      lead: "Een goede voorbereiding maakt de behandeling prettiger en het resultaat mooier.",
      items: [
        "Laat het haar minimaal 0,5 cm lang worden, ongeveer de lengte van een rijstkorrel. Dat is meestal twee tot vier weken na het scheren.",
        "Scrub de huid een of twee dagen van tevoren licht, zodat losse huidschilfers verdwijnen.",
        "Gebruik op de dag zelf geen bodylotion, olie of deodorant op de zone die wordt behandeld.",
        "Ga in de 48 uur voor je afspraak niet zonnebaden en sla de zonnebank over.",
        "Gebruik je medicijnen of huidproducten met retinoïden, of heb je een huidaandoening? Meld het vooraf.",
      ],
    },
    after: {
      title: "Na je behandeling",
      lead: "Lichte roodheid is normaal en trekt meestal binnen een dag weg.",
      items: [
        "Vermijd de eerste 24 uur sauna, zonnebank, zwembad, hete douches en intensief sporten.",
        "Draag liefst losse, ademende kleding over de behandelde huid.",
        "Raak de huid zo min mogelijk aan en gebruik die eerste dag geen geparfumeerde producten.",
        "Begin na twee dagen met regelmatig, mild scrubben; dat helpt ingegroeide haartjes voorkomen.",
        "Houd je huid soepel met een milde, verzorgende crème of olie.",
      ],
    },
  },
  faq: {
    general: [
      {
        q: "Hoe lang moet mijn haar zijn om te kunnen waxen?",
        a: "Minimaal 0,5 cm, ongeveer de lengte van een rijstkorrel. Dat is meestal twee tot vier weken na het scheren. Is het haar veel langer, dan wordt het vooraf iets ingekort.",
      },
      {
        q: "Doet waxen pijn?",
        a: "Je voelt een korte, felle prikkel die snel wegtrekt. Hoe dat voelt, verschilt per persoon en per zone; de eerste keer is meestal het gevoeligst. Bij regelmatig waxen groeit het haar vaak fijner terug, waardoor veel mensen het daarna minder intens vinden.",
      },
      {
        q: "Hoe lang blijft mijn huid glad?",
        a: "Meestal drie tot vijf weken, afhankelijk van je haargroei en de zone. Omdat het haar met wortel en al wordt verwijderd, groeit het langzamer en zachter terug dan na scheren.",
      },
      {
        q: "Is waxen hetzelfde als harsen?",
        a: "Ja. In Nederland worden beide woorden gebruikt voor het verwijderen van haar met (warme) wax. Het haar wordt met wortel en al verwijderd, waardoor het resultaat weken meegaat.",
      },
      {
        q: "Waar vinden de behandelingen plaats?",
        a: "Op afspraak, vanuit huis, in een rustige en schone behandelruimte. Het adres deelt Dilek persoonlijk zodra je afspraak is bevestigd.",
      },
      {
        q: "Hoe vraag ik een afspraak aan?",
        a: "Via de pagina ‘Afspraak aanvragen’ kies je je behandeling, een voorkeursdatum en een tijdvak. Je ontvangt meteen een ontvangstbevestiging. De afspraak is pas definitief als Dilek hem persoonlijk heeft bevestigd.",
      },
      {
        q: "Bieden jullie ook laserontharing of andere behandelingen aan?",
        a: "Op dit moment richt Glow by Dilek zich volledig op waxing. Nieuwe behandelingen worden pas aangekondigd als ze echt beschikbaar zijn.",
      },
    ],
    treatments: [
      {
        q: "Wanneer kan ik beter niet waxen?",
        a: "Niet op een verbrande, geïrriteerde of beschadigde huid, bij wondjes of ontstekingen, en niet kort na een peeling of laserbehandeling. Gebruik je medicijnen of huidproducten met retinoïden (zoals tretinoïne of isotretinoïne), dan is waxen niet geschikt. Twijfel je? Overleg eerst met je arts en meld het altijd vooraf.",
      },
      {
        q: "Wat is het verschil tussen bikinilijn, Brazilian en Hollywood?",
        a: "Bij de bikinilijn verdwijnt alleen het haar dat buiten je bikini of ondergoed zichtbaar is. Bij een Brazilian wordt bijna alles verwijderd, met naar wens een smal strookje of klein driehoekje. Een Hollywood is volledig glad.",
      },
      {
        q: "Hoe voorkom ik ingegroeide haartjes?",
        a: "Begin twee dagen na de behandeling met regelmatig, mild scrubben en houd je huid soepel. Draag de eerste dagen bij voorkeur losse kleding.",
      },
      {
        q: "Hoe vaak moet ik waxen?",
        a: "Voor de meeste zones is elke vier tot zes weken een prettig ritme. Scheer liever niet tussendoor: door regelmatig te waxen blijft je haargroei in dezelfde fase en wordt het resultaat vaak egaler.",
      },
      {
        q: "Ik vind een intieme behandeling spannend. Is dat normaal?",
        a: "Heel normaal. Dilek werkt discreet en respectvol, legt elke stap vooraf uit en jij bepaalt het tempo. Je kunt al je vragen ook vóór je afspraak per e-mail stellen.",
      },
    ],
  },
  treatments: {
    hero: {
      eyebrow: "Behandelingen",
      title: "Waxen met aandacht,",
      titleEm: "zone voor zone.",
      subtitle:
        "Gezicht, lichaam en bikinizone. Hieronder lees je per zone welke behandelingen er zijn, voor wie ze geschikt zijn en hoe je je het beste voorbereidt.",
    },
    about: {
      eyebrow: "Waarom waxen",
      title: "Langer glad, zonder stoppels",
      paragraphs: [
        "Bij waxen — ook wel harsen genoemd — wordt het haar met wortel en al verwijderd. Je huid blijft daardoor weken glad, zonder de stoppels, jeuk of scheerirritatie die scheren vaak geeft.",
        "Wie regelmatig waxt, merkt vaak dat het haar fijner en zachter terugkomt. Met een goede voorbereiding en de juiste nazorg blijft je huid rustig en ziet het resultaat er op zijn mooist uit.",
      ],
      facts: [
        { value: "0,5 cm", label: "ideale haarlengte" },
        { value: "3–5 wk", label: "meestal glad" },
        { value: "4–6 wk", label: "prettig ritme" },
      ],
    },
    zonesLabel: "Kies een zone",
    expect: {
      eyebrow: "Wat je kunt verwachten",
      title: "Een behandeling in vier stappen",
      items: [
        { title: "Kennismaken", body: "Een kort gesprek over je wensen, je huid en eventuele gevoeligheden of medicijnen." },
        { title: "Voorbereiden", body: "De huid wordt gereinigd, zodat de wax goed hecht en er geen olie of lotion achterblijft." },
        { title: "Waxen", body: "Deel voor deel, rustig en nauwkeurig. Dilek vertelt steeds wat ze gaat doen." },
        { title: "Verzorgen", body: "Wax-resten worden verwijderd en de huid wordt gekalmeerd. Je krijgt advies mee voor thuis." },
      ],
    },
    contra: {
      title: "Wanneer liever niet",
      intro: "Voor je veiligheid wordt in deze situaties niet gewaxt:",
      items: [
        "Bij een verbrande, geïrriteerde of beschadigde huid",
        "Bij wondjes, ontstekingen of een huidinfectie op de zone",
        "Bij gebruik van retinoïden, zoals tretinoïne of isotretinoïne",
        "Kort na een peeling, laser- of andere intensieve huidbehandeling",
      ],
      outro: "Twijfel je? Overleg met je arts en meld het altijd vooraf.",
    },
    faqTitle: "Vragen over waxen",
  },
  prices: {
    hero: {
      eyebrow: "Tarieven",
      title: "Helder geprijsd,",
      titleEm: "persoonlijk afgestemd.",
      subtitle:
        "Hieronder staan alle behandelingen op een rij. De actuele tarieven stuurt Dilek je graag persoonlijk toe, zodat je precies weet waar je aan toe bent.",
    },
    notice: {
      title: "Tarieven op aanvraag",
      body: "De prijslijst verschijnt binnenkort op deze pagina. Tot die tijd ontvang je de actuele tarieven per e-mail — vermeld gerust welke behandelingen je interesseren.",
      cta: "Vraag de tarieven op",
      subject: "Vraag over tarieven",
    },
    columns: { treatment: "Behandeling", duration: "Duur", price: "Tarief" },
    from: "vanaf",
    minutes: "min",
    notes: [
      "Combineer je meerdere zones? Vermeld het bij je aanvraag, dan wordt de afspraak daarop afgestemd.",
      "Weet je nog niet welke behandeling bij je past? Vraag gerust om advies.",
    ],
  },
  about: {
    hero: {
      eyebrow: "Over Dilek",
      title: "Een studio met",
      titleEm: "één paar handen.",
      subtitle:
        "Glow by Dilek is bewust klein gehouden. Geen team en geen lopende band, maar één persoon die jouw afspraak van begin tot eind met dezelfde aandacht verzorgt.",
    },
    story: {
      eyebrow: "Het verhaal",
      title: "Waarom Glow by Dilek bestaat",
      paragraphs: [
        "Mijn naam is Dilek. Ik ben Glow by Dilek begonnen met één wens: dat waxen voelt als een moment voor jezelf, en niet als iets wat je snel even ‘moet’.",
        "Dat begint bij de basis. Een rustige, schone ruimte. Tijd voor een gesprek. Uitleg over wat ik doe en waarom. En een werkwijze die elke keer hetzelfde is, zodat jij weet waar je aan toe bent.",
        "Of het nu je allereerste behandeling is of je al jaren waxt: je bent welkom zoals je bent, met al je vragen.",
      ],
    },
    quote: "Ik werk liever met minder klanten en meer aandacht.",
    approach: {
      eyebrow: "Mijn werkwijze",
      title: "Wat je van mij mag verwachten",
      items: [
        { title: "Tijd", body: "Afspraken worden ruim ingepland. Je hoeft je nooit gehaast te voelen." },
        { title: "Uitleg", body: "Ik vertel wat ik ga doen voordat ik het doe, zeker bij je eerste behandeling." },
        { title: "Discretie", body: "Eén klant tegelijk en een respectvolle omgang. Wat je deelt, blijft tussen ons." },
        { title: "Eerlijkheid", body: "Is waxen op dit moment niet verstandig voor je huid, dan zeg ik dat — ook als het betekent dat we de afspraak verzetten." },
      ],
    },
    vision: {
      eyebrow: "Vooruitkijken",
      title: "Klein begonnen, met ruimte om te groeien",
      body: "Glow by Dilek begint bij waxing, omdat ik daar volledig achter sta. Stap voor stap wil ik de studio verder uitbouwen, altijd met dezelfde zorg. Nieuwe behandelingen kondig ik pas aan als ze echt beschikbaar zijn.",
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Een vraag?",
      titleEm: "Stel hem gerust.",
      subtitle:
        "Over een behandeling, je huid of het maken van een afspraak: Dilek leest elk bericht zelf en antwoordt persoonlijk.",
    },
    emailLabel: "E-mail",
    emailNote: "Liever zelf mailen? Dat kan natuurlijk ook.",
    locationTitle: "Locatie",
    hoursTitle: "Afspraken",
    hoursBody: "Behandelingen vinden uitsluitend plaats op afspraak.",
    formTitle: "Stuur een bericht",
    formIntro: "Je ontvangt direct een ontvangstbevestiging per e-mail.",
    appointmentHint: "Wil je meteen een afspraak aanvragen? Het afspraakformulier is daar speciaal voor gemaakt.",
  },
  booking: {
    hero: {
      eyebrow: "Afspraak aanvragen",
      title: "Jouw moment,",
      titleEm: "persoonlijk ingepland.",
      subtitle:
        "Kies je behandeling en een moment dat jou uitkomt. Dilek bekijkt je aanvraag en neemt persoonlijk contact op om de afspraak te bevestigen.",
    },
    steps: [
      { title: "Je vraagt aan", body: "Vul het formulier in. Je krijgt direct een ontvangstbevestiging." },
      { title: "Dilek beoordeelt", body: "Ze bekijkt je aanvraag en haar agenda, en stemt zo nodig een ander moment met je af." },
      { title: "Bevestiging", body: "Je ontvangt een persoonlijke bevestiging met alle details. Pas dan staat je afspraak vast." },
    ],
    notConfirmed: "Dit is een aanvraag, nog geen afspraak. Je afspraak staat pas vast als Dilek hem persoonlijk heeft bevestigd.",
    formTitle: "Je aanvraag",
    future: {
      title: "Online boeken volgt",
      body: "Er wordt gewerkt aan een veilig online afsprakensysteem met beschikbare tijden en herinneringen. Tot die tijd plant Dilek elke afspraak persoonlijk met je in.",
    },
  },
  forms: {
    name: "Naam",
    email: "E-mailadres",
    phone: "Telefoonnummer",
    optional: "optioneel",
    topic: "Onderwerp",
    topics: {
      question: "Algemene vraag",
      treatment: "Vraag over een behandeling",
      appointment: "Afspraak",
      other: "Iets anders",
    },
    message: "Je bericht",
    messagePlaceholder: "Waar kan Dilek je mee helpen?",
    treatments: "Welke behandeling(en)?",
    treatmentsHint: "Je kunt meerdere zones kiezen.",
    preferredDate: "Voorkeursdatum",
    timeRange: "Voorkeur voor tijd",
    timeRanges: { morning: "Ochtend", afternoon: "Middag", evening: "Avond", flexible: "Flexibel" },
    alternative: "Een ander moment dat ook past",
    alternativePlaceholder: "Bijvoorbeeld: ook dinsdagavond of zaterdagochtend",
    notes: "Opmerking",
    notesPlaceholder: "Bijvoorbeeld: eerste keer waxen, of een vraag vooraf (geen medische details)",
    privacy: "Ik ga ermee akkoord dat mijn gegevens worden gebruikt om mijn aanvraag te beantwoorden, zoals beschreven in de",
    privacyLink: "privacyverklaring",
    submitContact: "Verstuur bericht",
    submitAppointment: "Verstuur aanvraag",
    sending: "Bezig met versturen…",
    required: "verplicht",
    errors: {
      required: "Vul dit veld in.",
      invalid: "Controleer dit veld.",
      tooShort: "Dit is iets te kort.",
      tooLong: "Dit is te lang.",
      pastDate: "Kies een datum vanaf vandaag.",
      tooFar: "Kies een datum binnen een jaar.",
      consent: "Geef toestemming, dan kunnen we je aanvraag beantwoorden.",
      summary: "Controleer de gemarkeerde velden.",
    },
    status: {
      contactTitle: "Dank je wel — je bericht is verstuurd",
      contactBody: "Je ontvangt een ontvangstbevestiging per e-mail. Dilek antwoordt zo snel mogelijk persoonlijk.",
      appointmentTitle: "Je aanvraag is ontvangen",
      appointmentBody:
        "Dank je wel! Je ontvangt een ontvangstbevestiging per e-mail. Let op: je afspraak is nog niet bevestigd. Dilek neemt persoonlijk contact met je op.",
      noAck: "De automatische bevestiging kon niet worden verstuurd, maar je aanvraag is wel goed ontvangen.",
      again: "Nog een bericht sturen",
      unavailable: "Het formulier is tijdelijk niet beschikbaar. Mail je bericht gerust direct naar",
      sendFailed: "Er ging iets mis bij het versturen. Probeer het later opnieuw of mail direct naar",
      rateLimited: "Je hebt kort na elkaar meerdere berichten gestuurd. Probeer het over een paar minuten opnieuw.",
      generic: "Er ging iets mis. Probeer het opnieuw of mail direct naar",
    },
  },
  privacy: {
    title: "Privacyverklaring",
    updated: "Laatst bijgewerkt: november 2026",
    sections: [
      {
        h: "Wie wij zijn",
        p: "Glow by Dilek is een waxstudio die behandelingen aanbiedt op afspraak. Vragen over privacy kun je stellen via hello@glowbydilek.nl.",
      },
      {
        h: "Welke gegevens we ontvangen",
        p: "Als je het contact- of afspraakformulier gebruikt, ontvangen we de gegevens die je zelf invult: je naam, je e-mailadres, eventueel je telefoonnummer en je bericht, en bij een afspraakaanvraag de gekozen behandeling(en) en je voorkeursmoment. Deel via de formulieren geen medische of andere gevoelige gegevens die niet nodig zijn.",
      },
      {
        h: "Waarvoor we ze gebruiken",
        p: "Alleen om je vraag te beantwoorden en je afspraak met je af te stemmen. We sturen geen nieuwsbrieven of reclame zonder je uitdrukkelijke toestemming en verkopen je gegevens nooit aan derden.",
      },
      {
        h: "Hoe ze worden bewaard",
        p: "De website zelf slaat je gegevens niet op in een database. Je bericht wordt als e-mail verstuurd naar de mailbox van Glow by Dilek, die door onze e-mailprovider wordt gehost. Berichten bewaren we niet langer dan nodig is om je vraag of afspraak af te handelen, tenzij een wettelijke bewaarplicht geldt.",
      },
      {
        h: "Cookies en meetinstrumenten",
        p: "Deze website gebruikt geen tracking- of advertentiecookies en geen analysediensten van derden.",
      },
      {
        h: "Jouw rechten",
        p: "Je kunt vragen om inzage in je gegevens, om correctie of om verwijdering. Stuur daarvoor een e-mail naar hello@glowbydilek.nl. Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.",
      },
    ],
  },
  footer: {
    tagline: "Een kleine, persoonlijke waxstudio voor gezicht, lichaam en bikinizone. Uitsluitend op afspraak.",
    treatments: "Behandelingen",
    studio: "Studio",
    contact: "Contact",
    rights: "Alle rechten voorbehouden.",
    note: "Geen tracking, geen reclamecookies.",
  },
  notFound: {
    title: "Deze pagina bestaat niet (meer)",
    body: "Misschien is de link verouderd of zit er een typfout in het adres. Via de homepage of de behandelingen vind je snel je weg terug.",
    back: "Naar de homepage",
  },
};

export type Dictionary = typeof nl;
