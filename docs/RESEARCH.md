# Design research and rationale

This research was done in November 2026 to support the premium redesign. Sources were consulted through web search; the results were summaries of the pages listed. No market statistics, reviews or credentials from these sources are used on the website.

## 1. Reference brands and what we took from them (patterns only, nothing copied)

| Brand / site | Observed pattern | Applied as |
| --- | --- | --- |
| **Aesop** (skincare, global) | Ivory canvas, charcoal type, restrained typography and a strongly art-directed editorial feel; design treated as part of the product experience ([webdesignhot design notes](https://www.webdesignhot.com/design.md/aesop/), [brand analysis](https://madegooddesigns.com/aesop-brand-guidelines/)). | Warm-ivory base, a tight typographic system, editorial asymmetry, no visual clutter. |
| **Tatcha** (luxury skincare) | Dreamy editorial photography paired with a disciplined two-colour brand system ([Colorlib skincare examples](https://colorlib.com/wp/skincare-brand-website-examples/)). | One dark brand colour (charcoal) plus one metallic accent (champagne gold). |
| **Luxury spa sites** (e.g. Spa Belles, Burke Williams) | High-quality photography, timeless serif type, and named rituals that make services feel like an experience ([Colorlib spa sites](https://colorlib.com/wp/spa-websites/), [Zarla spa examples](https://www.zarla.com/guides/spa-website-examples)). | A "ritual" section on the homepage and a step-by-step visit experience. |
| **Strip: Ministry of Waxing** (waxing specialist) | Hygiene communicated explicitly (single-use tools, "no double dipping"); hot wax for sensitive zones ([Interview](https://www.interviewmagazine.com/fashion/strip-ministry-of-waxing), [SheerLuxe etiquette](https://sheerluxe.com/beauty/bath-body/your-waxing-etiquette-101)). | Hygiene is the first trust promise. Specific techniques are **not** claimed until Dilek confirms them. |
| **European Wax Center** (waxing, conversion-focused) | First-visit reassurance: intake questions, hair length (about a grain of rice), cleansing, pacing for first-timers ([Haute Living first visit](https://hauteliving.com/hautebeauty/672129/what-to-expect-at-european-wax-center/), [The Everygirl review](https://theeverygirl.com/european-wax-center-review/)). | A "What to expect" section, a 0.5 cm rule and first-timer FAQs. |
| **Allure Aesthetics / clinic sites** | Hover animations on service cards and an emphasis on individual treatment plans ([Kijo London](https://kijo.london/blog/luxury-skincare-brands)). | Refined hover states on treatment cards and personal-attention messaging. |

## 2. What premium beauty customers expect (synthesis)

From salon-selection guides ([Starpil](https://www.starpilwax.com/blogs/news/how-to-find-the-best-waxing-salon)) and the patterns above:

1. **Visible hygiene.** This ranks first for waxing, because hair is removed from the root.
2. **Expertise and calm.** Clear explanations, especially for intimate waxing and first-timers.
3. **Privacy and discretion.** One client at a time, and a respectful tone.
4. **Low-friction booking** with clarity about what happens next.
5. **Honest information:** preparation, aftercare and contra-indications.

Statistics often quoted on salon blogs (for example "82% rate hygiene as extremely important") have **no traceable primary source** and are deliberately not used.

## 3. Dutch and English search intent

From marketplace listings ([Treatwell NL](https://treatwell.nl/en/places/at-waxing-salon/in-nl), [Treatwell Brazilian NL](https://treatwell.nl/salons/behandeling-vrouwen-harsen-brazilian/aanbod-type-lokaal/in-nl/pagina-2)) and Q&A content ([webwoordenboek](https://webwoordenboek.nl/kenniscentrum/wat-is-het-verschil-tussen-wax-en-hars)):

- Dutch searchers use **"waxen"** and **"harsen"** interchangeably. Both terms are in titles and FAQs.
- High-intent service terms: *Brazilian wax*, *wenkbrauwen waxen*, *benen waxen*, *oksels waxen*, *bikinilijn*, *Hollywood*. These are covered by the treatment names, the page title and the meta description.
- Informational intent: hair length, pain, how long results last, aftercare, ingrown hairs, the difference between bikini line, Brazilian and Hollywood, and when not to wax. These are answered in the FAQs and the preparation/aftercare tabs, with FAQPage structured data.
- **Local SEO** is limited to "Netherlands" until a city or region is confirmed (`siteConfig.contact.region`).

Search volumes were **not** measured; a tool such as Google Keyword Planner is needed for that.

## 4. Design decisions

- **Palette (revised, based on the approved logo):** Warm Ivory `#F8F5EF`, Soft Nude `#E9D5C7`, Stone Beige `#DDD2C4`, Champagne Gold `#C4A16F` and Elegant Charcoal `#292724`, plus accessible text variants: gold-deep `#85663A` (4.9:1) and muted `#6B635C` (5.6:1). The earlier deep-green direction was dropped at the owner's request.
- **Typography:** Cormorant Garamond (editorial display, with italic accents), Jost (clean geometric text with spaced uppercase labels) and Parisienne (Dilek's signature, echoing the logo).
- **Layout:** editorial splits, an index-style treatment list instead of repeated cards, a single dark band per page, glass UI only for the header and the sticky zone navigation, and images that sit fully below the header (no edge-bleed, no hero parallax). Image positions are adaptive while photography is missing.
- **Motion:** IntersectionObserver reveals, clip-path image unmasking, subtle parallax (at most 10%), a hide-on-scroll glass header and a scroll-snap gallery. All of it is disabled under `prefers-reduced-motion`, and content stays visible without JavaScript.
- **Conversion:** two primary paths, *Afspraak aanvragen* (charcoal and gold buttons) and *Contact*, repeated at natural decision points. Forms state clearly that a request is not yet a confirmed appointment.
