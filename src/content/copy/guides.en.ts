import type { FaqPageCopy, GuideCopy, GuideKey } from "./types";

export const guidesEn: Record<GuideKey, GuideCopy> = {
  process: {
    seoTitle: "How an appointment works",
    seoDescription:
      "From request to confirmation: how to request a waxing appointment with Glow by Dilek, what happens next and how the treatment itself goes.",
    hero: {
      eyebrow: "Appointment process",
      title: "Personally planned,",
      titleEm: "step by step.",
      subtitle:
        "There is no automatic booking system. Every request is read by Dilek herself and confirmed personally. Here is how it works, from your first message to after your treatment.",
    },
    sections: [
      {
        title: "1. You request an appointment",
        paragraphs: [
          "In the appointment form you choose one or more treatments, a preferred date and a time of day (morning, afternoon, evening or flexible). If another moment would also work, you can add it straight away.",
          "Right after sending, you receive an automatic acknowledgement by email. That is not yet an appointment: it only means your request has arrived safely.",
        ],
      },
      {
        title: "2. Dilek reviews your request",
        paragraphs: [
          "Dilek reads your request herself and checks her calendar. If your preferred moment doesn’t work, she suggests another. If she has a question about your skin or the treatment, you’ll hear that too.",
        ],
      },
      {
        title: "3. You receive a personal confirmation",
        paragraphs: [
          "Your appointment is only fixed once Dilek has confirmed it personally. That confirmation includes the date, the time and the practical information you need.",
          "Treatments are available by appointment only. Practical location details are shared personally after confirmation.",
        ],
      },
      {
        title: "4. You prepare",
        paragraphs: [
          "Let the hair grow for two to four weeks, exfoliate lightly one or two days beforehand and come without lotion or oil on the area. The Preparation page has everything in one place.",
        ],
      },
      {
        title: "5. The treatment",
        paragraphs: [
          "Every appointment starts with a short conversation: what would you like, how does your skin react, and is there anything to take into account? Then the skin is cleansed and waxed calmly, in sections. Dilek explains what she is doing before she does it.",
        ],
      },
      {
        title: "6. Aftercare",
        paragraphs: [
          "After the treatment your skin is soothed and you leave with advice for the days that follow. If you have a question afterwards, you can always send an email.",
        ],
      },
      {
        title: "Can’t make it after all?",
        paragraphs: [
          "Please let us know as soon as possible by replying to your confirmation email or writing to hello@glowbydilek.nl, so the time can be offered to someone else.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is my appointment fixed once I send the form?",
        a: "No. You first receive an automatic acknowledgement. Your appointment is only fixed once Dilek has confirmed it personally.",
      },
      {
        q: "Where do treatments take place?",
        a: "Treatments are available by appointment only. Practical location details are shared personally after confirmation.",
      },
      {
        q: "Can I ask a question first?",
        a: "Of course. Use the contact form or email hello@glowbydilek.nl. Dilek replies personally.",
      },
    ],
  },

  preparation: {
    seoTitle: "Preparing for your waxing appointment",
    seoDescription:
      "How to prepare for waxing: hair length, exfoliation, skincare, sun and medication — everything to know beforehand for a comfortable treatment.",
    hero: {
      eyebrow: "Preparation",
      title: "Well prepared,",
      titleEm: "more comfortable.",
      subtitle:
        "A few simple steps in the days before your appointment make the treatment more comfortable and help towards calmer skin and a better result.",
    },
    sections: [
      {
        title: "Hair length",
        paragraphs: [
          "The hair needs to be at least 0.5 cm long — roughly the length of a grain of rice. That is usually two to four weeks after shaving. If it is shorter, the wax can’t grip it properly; if it is much longer than a centimetre, it will be trimmed first.",
        ],
      },
      {
        title: "Exfoliation",
        paragraphs: [
          "Exfoliate lightly one or two days beforehand. This removes loose skin cells, so the wax grips the hair better and ingrown hairs are less likely. Don’t exfoliate on the day itself; your skin is more sensitive then.",
        ],
      },
      {
        title: "On the day of your appointment",
        items: [
          "Skip body lotion, oil, deodorant and self-tan on the area to be treated.",
          "For a facial treatment, ideally come without make-up.",
          "Wear comfortable, loose clothing; for an intimate treatment, clean cotton underwear.",
        ],
      },
      {
        title: "Sun and sunbeds",
        paragraphs: [
          "Avoid sunbathing and sunbeds in the 48 hours before your appointment. Burnt or freshly tanned skin is more sensitive and irritates more easily.",
        ],
      },
      {
        title: "Skincare and treatments",
        items: [
          "Stop using retinol, AHA, BHA and other exfoliating products on the area at least one week beforehand.",
          "Had a recent peel, microneedling, laser or other intensive skin treatment? Mention it beforehand.",
        ],
      },
      {
        title: "Medication and health",
        items: [
          "Using prescription retinoids, or recently completed a course of isotretinoin? Then waxing is not suitable.",
          "Taking blood thinners, or living with diabetes, varicose veins or a skin condition on the area? Consult your doctor first and mention it in your request.",
          "If you are pregnant, your skin may react more sensitively. When in doubt, check with your midwife or doctor.",
        ],
      },
      {
        title: "Waxing for the first time?",
        paragraphs: [
          "It is less daunting than it seems. Let the hair grow for a few weeks, ask all your questions beforehand and expect a calm, clear explanation during the treatment.",
        ],
      },
    ],
    caveat:
      "This information is general and does not replace medical advice. If you have a skin or health concern, take medication or are unsure whether waxing is sensible for you, please consult your GP, dermatologist or midwife first.",
  },

  aftercare: {
    seoTitle: "Aftercare after waxing",
    seoDescription:
      "What to do after waxing: tips for the first 24 hours, the days after and preventing ingrown hairs — plus when it is wise to call your GP.",
    hero: {
      eyebrow: "Aftercare",
      title: "After waxing,",
      titleEm: "give your skin a rest.",
      subtitle:
        "Slight redness is normal and usually fades within a day. A few simple habits keep your skin calm and the result looking good for longer.",
    },
    sections: [
      {
        title: "The first 24 hours",
        items: [
          "Avoid sauna, steam rooms, sunbeds, swimming pools, hot showers and intense exercise.",
          "Wear loose, breathable clothing over the treated skin.",
          "Touch the skin as little as possible and avoid fragranced products.",
          "After underarm waxing, skip deodorant; after a facial treatment, skip make-up.",
          "After an intimate treatment: loose cotton underwear and no intimate contact.",
        ],
      },
      {
        title: "The days after",
        items: [
          "After two days, start exfoliating gently and regularly — two or three times a week.",
          "Keep your skin supple with a mild, fragrance-free cream.",
          "Apply self-tan only after 48 hours.",
          "Try not to shave between appointments, so your hair growth stays in the same rhythm.",
        ],
      },
      {
        title: "Preventing ingrown hairs",
        paragraphs: [
          "Ingrown hairs develop when a hair tries to grow back under the skin. Gentle regular exfoliation, supple skin and no tight clothing straight after the treatment help most. Don’t squeeze or pick at them; that increases the risk of inflammation or a mark.",
        ],
      },
      {
        title: "What is normal?",
        items: [
          "Redness and small bumps around the follicles that fade within one or two days.",
          "A slightly warm or tight feeling on the day itself.",
          "The odd tiny pinpoint bleed with coarse hair.",
        ],
      },
      {
        title: "When to contact your GP",
        paragraphs: [
          "If a spot becomes more painful, warmer or more swollen instead of calmer, you see pus, or you develop a fever, please contact your GP. Feel free to let Dilek know too.",
        ],
      },
      {
        title: "A regular rhythm",
        paragraphs: [
          "For most areas, every four to six weeks is a comfortable rhythm; for the face and underarms sometimes a little more often. With regular waxing, hair often grows back finer and more evenly.",
        ],
      },
    ],
    caveat:
      "This advice is general and does not replace medical advice. With persistent complaints, signs of infection or any doubt, please contact your GP or dermatologist.",
  },
};

export const faqPageEn: FaqPageCopy = {
  seoTitle: "Waxing FAQ",
  seoDescription:
    "Answers to the most common questions about waxing with Glow by Dilek: preparation, pain, results, intimate treatments, appointments and privacy.",
  hero: {
    eyebrow: "Frequently asked questions",
    title: "Honest answers,",
    titleEm: "without detours.",
    subtitle:
      "The questions asked most often, answered briefly and clearly. Can’t find yours? Feel free to send a message.",
  },
  groups: [
    {
      title: "About waxing",
      items: [
        {
          q: "How long does my hair need to be for waxing?",
          a: "At least 0.5 cm, roughly the length of a grain of rice. That is usually two to four weeks after shaving. If the hair is much longer, it will be trimmed first.",
        },
        {
          q: "Does waxing hurt?",
          a: "You feel a short, sharp sensation that fades quickly. How it feels differs per person and per area; the first time is usually the most sensitive. With regular waxing hair often grows back finer, and many people find it less intense afterwards.",
        },
        {
          q: "How long does my skin stay smooth?",
          a: "Usually three to five weeks, depending on your hair growth and the area. Because the hair is removed from the root, it grows back more slowly and softly than after shaving.",
        },
        {
          q: "Is waxing the same as ‘harsen’?",
          a: "Yes. In the Netherlands both words are used for removing hair with wax. The hair is removed from the root, so the result lasts for weeks.",
        },
        {
          q: "How often should I wax?",
          a: "For most areas, every four to six weeks is a comfortable rhythm. Try not to shave in between: regular waxing keeps your hair growth in the same phase and often gives a more even result.",
        },
      ],
    },
    {
      title: "Skin and safety",
      items: [
        {
          q: "When should I not wax?",
          a: "Not on burnt, irritated or damaged skin, with cuts or inflammation, and not shortly after a peel or laser treatment. If you use prescription retinoids or recently completed a course of isotretinoin, waxing is not suitable. Unsure? Consult your doctor first and always mention it beforehand.",
        },
        {
          q: "How do I prevent ingrown hairs?",
          a: "From two days after the treatment, exfoliate gently and regularly and keep your skin supple. Loose clothing in the first few days helps too.",
        },
        {
          q: "I’m pregnant. Can I have a wax?",
          a: "Often, yes, but your skin may be more sensitive during this time. When in doubt, check with your midwife or doctor first, and mention it in your request.",
        },
      ],
    },
    {
      title: "Intimate treatments",
      items: [
        {
          q: "What is the difference between bikini line, Brazilian and Hollywood?",
          a: "A bikini line removes only the hair visible outside your bikini or underwear. A Brazilian removes almost everything, leaving a small strip or triangle if you like. A Hollywood is completely smooth.",
        },
        {
          q: "An intimate treatment makes me nervous. Is that normal?",
          a: "Completely normal. Dilek works discreetly and respectfully, explains every step beforehand and you set the pace. You can also ask all your questions by email before your appointment.",
        },
        {
          q: "Can I have a wax during my period?",
          a: "Feel free to mention it beforehand. Your skin may be more sensitive at that time, and you can choose whether to reschedule.",
        },
      ],
    },
    {
      title: "Appointments and practical",
      items: [
        {
          q: "How do I request an appointment?",
          a: "On the ‘Book appointment’ page you choose your treatment, a preferred date and a time of day. You receive an acknowledgement straight away. Your appointment is only final once Dilek has confirmed it personally.",
        },
        {
          q: "Where do treatments take place?",
          a: "Treatments are available by appointment only. Practical location details are shared personally after confirmation.",
        },
        {
          q: "What does a treatment cost?",
          a: "You’ll receive the current rates personally by email. Feel free to mention which treatments you’re interested in.",
        },
        {
          q: "Do you also offer laser hair removal or other treatments?",
          a: "At the moment Glow by Dilek focuses entirely on waxing. New treatments are only announced once they are genuinely available.",
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          q: "What happens to the details I enter?",
          a: "They are only used to answer your question and arrange your appointment, and are not stored in a database on the website. Read more in the privacy policy.",
        },
        {
          q: "Should I include medical information in the form?",
          a: "No, preferably not. Just mention that there is something to take into account; you can discuss the details in person.",
        },
      ],
    },
  ],
};
