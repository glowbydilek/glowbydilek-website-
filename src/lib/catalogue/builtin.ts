/**
 * NOTE: section ids must never equal a group id ("bodycare" vs the waxing
 * zone "body"), because older code paths still read the `category` column.
 *
 * Built-in catalogue: the approved waxing treatments (published) plus the
 * planned facial, body, massage and package entries as UNPUBLISHED DRAFTS.
 *
 * Drafts are never shown on the website. The owner reviews the texts,
 * confirms that the treatment is offered (and how), sets a price mode and
 * duration, and publishes it in Admin → Behandelingen. Nothing here claims a
 * price, duration, technique, product, certificate or medical benefit.
 */
import { categorySlugs, relatedTreatments, treatmentSlugs, type CategoryId } from "@/content/slugs";
import { treatmentGroups } from "@/content/treatments";
import type { Group, Item, PackagePart, Section } from "./types";

export const BUILTIN_SECTIONS: Section[] = [
  { id: "waxing", kind: "treatments", slug: { nl: "waxbehandelingen", en: "waxing-treatments" }, name: { nl: "Waxbehandelingen", en: "Waxing" }, status: "published", sort: 0, photo: "treatments-hero", mediaId: null, builtin: true },
  { id: "facial", kind: "treatments", slug: { nl: "gezichtsbehandelingen", en: "facial-treatments" }, name: { nl: "Gezichtsbehandelingen", en: "Facial treatments" }, status: "draft", sort: 1, photo: "dropper", mediaId: null, builtin: true },
  { id: "bodycare", kind: "treatments", slug: { nl: "lichaamsbehandelingen", en: "body-treatments" }, name: { nl: "Lichaamsbehandelingen", en: "Body treatments" }, status: "draft", sort: 2, photo: "linen", mediaId: null, builtin: true },
  { id: "massage", kind: "treatments", slug: { nl: "massages", en: "massages" }, name: { nl: "Massages", en: "Massages" }, status: "draft", sort: 3, photo: "botanical", mediaId: null, builtin: true },
  { id: "packages", kind: "packages", slug: { nl: "pakketten", en: "packages" }, name: { nl: "Pakketten", en: "Packages" }, status: "draft", sort: 4, photo: "aftercare", mediaId: null, builtin: true },
];

export const BUILTIN_GROUPS: Group[] = treatmentGroups.map((g, i) => ({
  id: g.id,
  sectionId: "waxing",
  slug: { nl: categorySlugs[g.id as CategoryId].nl, en: categorySlugs[g.id as CategoryId].en },
  name: g.name,
  status: "published",
  sort: i,
  photo: g.photo,
  mediaId: null,
  builtin: true,
}));

const base = {
  mediaId: null,
  active: true,
  visible: true,
  featured: false,
  bookableOnline: false,
  pricing: { mode: "on_request" as const, cents: null },
  durationMinutes: null,
  bufferMinutes: 0,
  vat: "standard" as const,
  parts: [] as PackagePart[],
  builtin: true,
};

const waxing: Item[] = treatmentGroups.flatMap((g, gi) =>
  g.treatments.map((t, ti) => ({
    ...base,
    id: t.id,
    kind: "treatment" as const,
    sectionId: "waxing",
    groupId: g.id,
    slug: { nl: treatmentSlugs[t.id].nl, en: treatmentSlugs[t.id].en },
    name: t.name,
    description: t.description,
    photo: t.photo,
    status: "published" as const,
    sort: gi * 100 + ti,
    pricing: t.price ? { mode: t.price.from ? ("from" as const) : ("fixed" as const), cents: Math.round(t.price.amount * 100) } : base.pricing,
    durationMinutes: t.durationMinutes ?? null,
    related: [...relatedTreatments[t.id]],
  })),
);

type DraftSpec = Pick<Item, "id" | "sectionId" | "slug" | "name" | "description" | "photo" | "sort"> & { related?: string[]; parts?: PackagePart[] };

const draft = (d: DraftSpec, kind: Item["kind"] = "treatment"): Item => ({
  ...base,
  kind,
  groupId: null,
  status: "draft",
  related: d.related ?? [],
  ...d,
  parts: d.parts ?? [],
});

const facial: Item[] = [
  draft({
    id: "facial-manual-cleansing",
    sectionId: "facial",
    slug: { nl: "manuele-gezichtsreiniging", en: "manual-facial-cleansing" },
    name: { nl: "Manuele gezichtsreiniging", en: "Manual facial cleansing" },
    description: { nl: "Een grondige reiniging van de huid met de hand, rustig opgebouwd en afgestemd op hoe je huid aanvoelt.", en: "A thorough cleanse of the skin by hand, built up calmly and adjusted to how your skin feels." },
    photo: "dropper",
    sort: 0,
    related: ["facial-brush-cleansing", "facial-mask", "facial-complete"],
  }),
  draft({
    id: "facial-brush-cleansing",
    sectionId: "facial",
    slug: { nl: "gezichtsreiniging-borstelapparaat", en: "brush-facial-cleansing" },
    name: { nl: "Gezichtsreiniging met borstelapparaat", en: "Facial cleansing with a brush device" },
    description: { nl: "Reiniging met een zacht roterend borstelapparaat, als aanvulling op of in plaats van reinigen met de hand.", en: "Cleansing with a soft rotating brush device, alongside or instead of cleansing by hand." },
    photo: "botanical",
    sort: 1,
    related: ["facial-manual-cleansing", "facial-exfoliation", "facial-complete"],
  }),
  draft({
    id: "facial-exfoliation",
    sectionId: "facial",
    slug: { nl: "gezichtspeeling", en: "facial-exfoliation" },
    name: { nl: "Gezichtspeeling", en: "Facial exfoliation" },
    description: { nl: "Een peeling die losse huidschilfers verwijdert, zodat de huid zachter en gladder aanvoelt.", en: "An exfoliation that lifts away loose skin flakes, so your skin feels softer and smoother." },
    photo: "materials",
    sort: 2,
    related: ["facial-mask", "facial-manual-cleansing", "facial-complete"],
  }),
  draft({
    id: "facial-mask",
    sectionId: "facial",
    slug: { nl: "gezichtsmasker", en: "face-mask" },
    name: { nl: "Gezichtsmasker", en: "Face mask" },
    description: { nl: "Een masker als rustig moment voor je huid, gekozen in overleg en passend bij hoe je huid zich voelt.", en: "A mask as a quiet moment for your skin, chosen together to suit how your skin feels." },
    photo: "aftercare",
    sort: 3,
    related: ["facial-exfoliation", "facial-manual-cleansing", "facial-complete"],
  }),
  draft({
    id: "facial-complete",
    sectionId: "facial",
    slug: { nl: "complete-gezichtsbehandeling", en: "complete-facial" },
    name: { nl: "Complete gezichtsbehandeling", en: "Complete facial" },
    description: { nl: "Reiniging, peeling en masker in één afspraak, met de tijd om tot rust te komen.", en: "Cleansing, exfoliation and a mask in one appointment, with time to unwind." },
    photo: "contact",
    sort: 4,
    related: ["facial-manual-cleansing", "facial-exfoliation", "facial-mask"],
  }),
];

const body: Item[] = [
  draft({
    id: "body-wrap",
    sectionId: "bodycare",
    slug: { nl: "lichaamspakking", en: "body-wrap" },
    name: { nl: "Lichaamspakking", en: "Body wrap" },
    description: { nl: "Een verzorgende pakking voor de huid van het lichaam, met een moment van rust terwijl de pakking inwerkt.", en: "A caring wrap for the skin of the body, with a moment of rest while the wrap does its work." },
    photo: "linen",
    sort: 0,
  }),
];

const massage: Item[] = [
  draft({
    id: "massage-relaxation",
    sectionId: "massage",
    slug: { nl: "ontspanningsmassage", en: "relaxation-massage" },
    name: { nl: "Ontspanningsmassage", en: "Relaxation massage" },
    description: { nl: "Een rustige massage om even helemaal tot jezelf te komen.", en: "A calm massage to take a moment entirely for yourself." },
    photo: "vase",
    sort: 0,
  }),
];

const packages: Item[] = [
  draft(
    {
      id: "pkg-glow-face-trio",
      sectionId: "packages",
      slug: { nl: "glow-face-trio", en: "glow-face-trio" },
      name: { nl: "Glow Face Trio", en: "Glow Face Trio" },
      description: { nl: "Reiniging, peeling en masker voor het gezicht, samen in één afspraak.", en: "Cleansing, exfoliation and a mask for the face, together in one appointment." },
      photo: "dropper",
      sort: 0,
      parts: [
        { treatmentId: "facial-manual-cleansing", quantity: 1 },
        { treatmentId: "facial-exfoliation", quantity: 1 },
        { treatmentId: "facial-mask", quantity: 1 },
      ],
    },
    "package",
  ),
  draft(
    {
      id: "pkg-smooth-essentials",
      sectionId: "packages",
      slug: { nl: "smooth-essentials", en: "smooth-essentials" },
      name: { nl: "Smooth Essentials", en: "Smooth Essentials" },
      description: { nl: "Oksels, onderbenen en bikinilijn in één afspraak.", en: "Underarms, half legs and bikini line in one appointment." },
      photo: "zone-body",
      sort: 1,
      parts: [
        { treatmentId: "underarms", quantity: 1 },
        { treatmentId: "half-legs", quantity: 1 },
        { treatmentId: "bikini-line", quantity: 1 },
      ],
    },
    "package",
  ),
  draft(
    {
      id: "pkg-glow-complete",
      sectionId: "packages",
      slug: { nl: "glow-complete", en: "glow-complete" },
      name: { nl: "Glow Complete", en: "Glow Complete" },
      description: { nl: "Een complete gezichtsbehandeling en wenkbrauwen in één verzorgend moment.", en: "A complete facial and brows in one caring appointment." },
      photo: "contact",
      sort: 2,
      parts: [
        { treatmentId: "facial-complete", quantity: 1 },
        { treatmentId: "eyebrows", quantity: 1 },
      ],
    },
    "package",
  ),
  draft(
    {
      id: "pkg-bikini-smooth",
      sectionId: "packages",
      slug: { nl: "bikini-en-smooth", en: "bikini-and-smooth" },
      name: { nl: "Bikini & Smooth", en: "Bikini & Smooth" },
      description: { nl: "Een Brazilian en hele benen samen, voor wie alles in één keer wil laten doen.", en: "A Brazilian and full legs together, for anyone who wants it all done in one visit." },
      photo: "zone-intimate",
      sort: 3,
      parts: [
        { treatmentId: "brazilian", quantity: 1 },
        { treatmentId: "full-legs", quantity: 1 },
      ],
    },
    "package",
  ),
];

export const BUILTIN_ITEMS: Item[] = [...waxing, ...facial, ...body, ...massage, ...packages];
