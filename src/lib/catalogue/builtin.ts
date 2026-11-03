/**
 * NOTE: section ids must never equal a group id ("bodycare" vs the waxing
 * zone "body"), because older code paths still read the `category` column.
 *
 * Built-in catalogue (NL, EN, TR). Published: the 13 waxing treatments, the
 * five massages the owner confirmed (whole body, face, head, hands, feet) and
 * the facial care with steam (owner confirmed, November 2026). Facial
 * sub-treatments, body care and packages stay UNPUBLISHED DRAFTS until the
 * owner confirms them.
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
  { id: "waxing", kind: "treatments", slug: { nl: "waxbehandelingen", en: "waxing-treatments", tr: "agda" }, name: { nl: "Waxbehandelingen", en: "Waxing", tr: "Ağda" }, status: "published", sort: 0, photo: "treatments-hero", mediaId: null, builtin: true },
  // Published for the confirmed facial care with steam; the other facial entries remain drafts.
  { id: "facial", kind: "treatments", slug: { nl: "gezichtsbehandelingen", en: "facial-treatments", tr: "yuz-bakimlari" }, name: { nl: "Gezichtsbehandelingen", en: "Facial treatments", tr: "Yüz bakımları" }, status: "published", sort: -2, photo: "facial", mediaId: null, builtin: true },
  { id: "bodycare", kind: "treatments", slug: { nl: "lichaamsbehandelingen", en: "body-treatments", tr: "vucut-bakimlari" }, name: { nl: "Lichaamsbehandelingen", en: "Body treatments", tr: "Vücut bakımları" }, status: "draft", sort: 2, photo: "bodycare", mediaId: null, builtin: true },
  { id: "massage", kind: "treatments", slug: { nl: "massages", en: "massages", tr: "masajlar" }, name: { nl: "Massages", en: "Massages", tr: "Masajlar" }, status: "published", sort: -1, photo: "massage-body", mediaId: null, builtin: true },
  { id: "packages", kind: "packages", slug: { nl: "pakketten", en: "packages", tr: "paketler" }, name: { nl: "Pakketten", en: "Packages", tr: "Paketler" }, status: "draft", sort: 4, photo: "aftercare", mediaId: null, builtin: true },
];

export const BUILTIN_GROUPS: Group[] = treatmentGroups.map((g, i) => ({
  id: g.id,
  sectionId: "waxing",
  slug: { nl: categorySlugs[g.id as CategoryId].nl, en: categorySlugs[g.id as CategoryId].en, tr: categorySlugs[g.id as CategoryId].tr },
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
    slug: { nl: treatmentSlugs[t.id].nl, en: treatmentSlugs[t.id].en, tr: treatmentSlugs[t.id].tr },
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
  {
    ...draft({
      id: "facial-steam",
      sectionId: "facial",
      slug: { nl: "gezichtsbehandeling-met-stoom", en: "facial-care-with-steam", tr: "buhar-destekli-yuz-bakimi" },
      name: { nl: "Gezichtsbehandeling met stoom", en: "Facial care with steam", tr: "Buhar destekli yüz bakımı" },
      description: {
        nl: "Een verzorgend moment voor je gezicht, waarbij stoom een van de stappen kan zijn. Dilek bespreekt eerst je huid en je wensen, en of stoom voor jou geschikt is.",
        en: "A caring moment for your face, in which steam can be one of the steps. Dilek first discusses your skin and your wishes, and whether steam is suitable for you.",
        tr: "Buharın adımlardan biri olabildiği, yüzüne ayrılmış bir bakım anı. Dilek önce cildini ve beklentilerini, buharın sana uygun olup olmadığını seninle konuşur.",
      },
      photo: "facial-steam",
      sort: -1,
      related: ["massage-face", "massage-head", "eyebrows"],
    }),
    // Owner confirmed facial steaming (November 2026). Whether it is a standalone
    // appointment or part of a longer facial, and price/duration, are still open: on request.
    status: "published" as const,
  },
  draft({
    id: "facial-manual-cleansing",
    sectionId: "facial",
    slug: { nl: "manuele-gezichtsreiniging", en: "manual-facial-cleansing", tr: "elle-yuz-temizligi" },
    name: { nl: "Manuele gezichtsreiniging", en: "Manual facial cleansing", tr: "Elle yüz temizliği" },
    description: { nl: "Een grondige reiniging van de huid met de hand, rustig opgebouwd en afgestemd op hoe je huid aanvoelt.", en: "A thorough cleanse of the skin by hand, built up calmly and adjusted to how your skin feels.", tr: "Cildin elle, sakin adımlarla ve cildinin o günkü durumuna göre yapılan özenli temizliği." },
    photo: "botanical",
    sort: 0,
    related: ["facial-brush-cleansing", "facial-mask", "facial-complete"],
  }),
  draft({
    id: "facial-brush-cleansing",
    sectionId: "facial",
    slug: { nl: "gezichtsreiniging-borstelapparaat", en: "brush-facial-cleansing", tr: "firca-ile-yuz-temizligi" },
    name: { nl: "Gezichtsreiniging met borstelapparaat", en: "Facial cleansing with a brush device", tr: "Fırça cihazıyla yüz temizliği" },
    description: { nl: "Reiniging met een zacht roterend borstelapparaat, als aanvulling op of in plaats van reinigen met de hand.", en: "Cleansing with a soft rotating brush device, alongside or instead of cleansing by hand.", tr: "Elle temizliğe ek olarak ya da onun yerine yumuşak, dönen bir fırça cihazıyla temizlik." },
    photo: "aftercare",
    sort: 1,
    related: ["facial-manual-cleansing", "facial-exfoliation", "facial-complete"],
  }),
  draft({
    id: "facial-exfoliation",
    sectionId: "facial",
    slug: { nl: "gezichtspeeling", en: "facial-exfoliation", tr: "yuz-peelingi" },
    name: { nl: "Gezichtspeeling", en: "Facial exfoliation", tr: "Yüz peelingi" },
    description: { nl: "Een peeling die losse huidschilfers verwijdert, zodat de huid zachter en gladder aanvoelt.", en: "An exfoliation that lifts away loose skin flakes, so your skin feels softer and smoother.", tr: "Ölü deri pullarını uzaklaştıran bir peeling; cildin daha yumuşak ve pürüzsüz hissedilir." },
    photo: "facial",
    sort: 2,
    related: ["facial-mask", "facial-manual-cleansing", "facial-complete"],
  }),
  draft({
    id: "facial-mask",
    sectionId: "facial",
    slug: { nl: "gezichtsmasker", en: "face-mask", tr: "yuz-maskesi" },
    name: { nl: "Gezichtsmasker", en: "Face mask", tr: "Yüz maskesi" },
    description: { nl: "Een masker als rustig moment voor je huid, gekozen in overleg en passend bij hoe je huid zich voelt.", en: "A mask as a quiet moment for your skin, chosen together to suit how your skin feels.", tr: "Cildin için sakin bir an: cildinin durumuna göre birlikte seçilen bir maske." },
    photo: "facial",
    sort: 3,
    related: ["facial-exfoliation", "facial-manual-cleansing", "facial-complete"],
  }),
  draft({
    id: "facial-complete",
    sectionId: "facial",
    slug: { nl: "complete-gezichtsbehandeling", en: "complete-facial", tr: "kapsamli-yuz-bakimi" },
    name: { nl: "Complete gezichtsbehandeling", en: "Complete facial", tr: "Kapsamlı yüz bakımı" },
    description: { nl: "Reiniging, peeling en masker in één afspraak, met de tijd om tot rust te komen.", en: "Cleansing, exfoliation and a mask in one appointment, with time to unwind.", tr: "Temizlik, peeling ve maske tek randevuda; dinlenmeye zaman ayırarak." },
    photo: "dropper",
    sort: 4,
    related: ["facial-manual-cleansing", "facial-exfoliation", "facial-mask"],
  }),
];

const body: Item[] = [
  draft({
    id: "body-wrap",
    sectionId: "bodycare",
    slug: { nl: "lichaamspakking", en: "body-wrap", tr: "vucut-sargisi" },
    name: { nl: "Lichaamspakking", en: "Body wrap", tr: "Vücut sargısı" },
    description: { nl: "Een verzorgende pakking voor de huid van het lichaam, met een moment van rust terwijl de pakking inwerkt.", en: "A caring wrap for the skin of the body, with a moment of rest while the wrap does its work.", tr: "Vücut cildine bakım yapan bir sargı; sargı etki ederken dinlenme anı." },
    photo: "bodycare",
    sort: 0,
  }),
];

/**
 * The five massages the owner confirmed (November 2026). `massage-relaxation`
 * keeps its id and NL/EN URLs (existing bookings and links) and is the
 * whole-body massage. No technique, pressure style, duration, price or health
 * benefit is claimed; prices are "on request" until Dilek enters them.
 */
const massageSpec: (Pick<Item, "id" | "slug" | "name" | "description" | "photo"> & { related: string[] })[] = [
  {
    id: "massage-relaxation",
    slug: { nl: "ontspanningsmassage", en: "relaxation-massage", tr: "tum-vucut-rahatlama-masaji" },
    name: { nl: "Ontspanningsmassage (hele lichaam)", en: "Full-body relaxation massage", tr: "Tüm vücut rahatlama masajı" },
    description: {
      nl: "Een ontspannen moment met aandacht voor het hele lichaam. Vooraf bespreek je welke gebieden behandeld worden en wat voor jou prettig aanvoelt.",
      en: "A quiet moment with attention to the whole body. Beforehand you discuss which areas are treated and what feels comfortable for you.",
      tr: "Tüm bedenine özen gösterilen sakin bir zaman. Öncesinde hangi bölgelere odaklanılacağını ve senin için neyin rahat olduğunu konuşursunuz.",
    },
    photo: "massage-body",
    related: ["massage-head", "massage-foot", "massage-hand"],
  },
  {
    id: "massage-face",
    slug: { nl: "gezichtsmassage", en: "facial-massage", tr: "yuz-masaji" },
    name: { nl: "Gezichtsmassage", en: "Facial massage", tr: "Yüz masajı" },
    description: {
      nl: "Een zachte verzorging met de aandacht op je gezicht. De behandeling en jouw comfort worden vooraf samen afgestemd.",
      en: "Gentle care focused on your face. The treatment and your comfort are agreed together beforehand.",
      tr: "Yüzüne odaklanan nazik bir bakım. Uygulama ve rahatlık tercihlerin önceden birlikte belirlenir.",
    },
    photo: "massage-face",
    related: ["facial-steam", "massage-head", "massage-relaxation"],
  },
  {
    id: "massage-head",
    slug: { nl: "hoofdmassage", en: "head-massage", tr: "bas-masaji" },
    name: { nl: "Hoofdmassage", en: "Head massage", tr: "Baş masajı" },
    description: {
      nl: "Even een moment voor je hoofd en jezelf. Vooraf bespreek je welke aanraking prettig is en of de hoofdhuid erbij hoort.",
      en: "A moment for your head and yourself. Beforehand you discuss the touch you prefer and whether the scalp is included.",
      tr: "Başına ve kendine ayırdığın kısa bir dinlenme. Öncesinde nasıl bir dokunuştan hoşlandığını ve saç derisinin dahil olup olmayacağını konuşursunuz.",
    },
    photo: "massage-head",
    related: ["massage-face", "massage-relaxation", "massage-hand"],
  },
  {
    id: "massage-hand",
    slug: { nl: "handmassage", en: "hand-massage", tr: "el-masaji" },
    name: { nl: "Handmassage", en: "Hand massage", tr: "El masajı" },
    description: {
      nl: "Je handen zijn de hele dag bezig. Gun ze een rustige massage, afgestemd op wat voor jou prettig voelt.",
      en: "Your hands are busy all day. Give them a calm massage, tuned to what feels comfortable for you.",
      tr: "Ellerin gün boyu çalışıyor. Onlara, senin için rahat olana göre ayarlanan sakin bir masaj armağan et.",
    },
    photo: "massage-hand",
    related: ["massage-foot", "massage-head", "massage-relaxation"],
  },
  {
    id: "massage-foot",
    slug: { nl: "voetmassage", en: "foot-massage", tr: "ayak-masaji" },
    name: { nl: "Voetmassage", en: "Foot massage", tr: "Ayak masajı" },
    description: {
      nl: "Een rustig verzorgingsmoment voor je voeten. Je bespreekt vooraf je wensen en eventuele gevoeligheden.",
      en: "A calm care moment for your feet. You share your wishes and any sensitivities beforehand.",
      tr: "Ayakların için sakin bir bakım anı. Tercihlerini ve varsa hassasiyetlerini önceden paylaşırsın.",
    },
    photo: "massage-foot",
    related: ["massage-hand", "massage-relaxation", "massage-head"],
  },
];

const massage: Item[] = massageSpec.map((m, i) => ({
  ...draft({ ...m, sectionId: "massage", sort: i }),
  // Owner confirmed all five (November 2026); price and duration not yet: on request.
  status: "published" as const,
}));

const packages: Item[] = [
  draft(
    {
      id: "pkg-glow-face-trio",
      sectionId: "packages",
      slug: { nl: "glow-face-trio", en: "glow-face-trio", tr: "glow-face-trio" },
      name: { nl: "Glow Face Trio", en: "Glow Face Trio", tr: "Glow Face Trio" },
      description: { nl: "Reiniging, peeling en masker voor het gezicht, samen in één afspraak.", en: "Cleansing, exfoliation and a mask for the face, together in one appointment.", tr: "Yüz için temizlik, peeling ve maske; tek randevuda bir arada." },
      photo: "facial",
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
      slug: { nl: "smooth-essentials", en: "smooth-essentials", tr: "smooth-essentials" },
      name: { nl: "Smooth Essentials", en: "Smooth Essentials", tr: "Smooth Essentials" },
      description: { nl: "Oksels, onderbenen en bikinilijn in één afspraak.", en: "Underarms, half legs and bikini line in one appointment.", tr: "Koltuk altı, diz altı ve bikini çizgisi tek randevuda." },
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
      slug: { nl: "glow-complete", en: "glow-complete", tr: "glow-complete" },
      name: { nl: "Glow Complete", en: "Glow Complete", tr: "Glow Complete" },
      description: { nl: "Een complete gezichtsbehandeling en wenkbrauwen in één verzorgend moment.", en: "A complete facial and brows in one caring appointment.", tr: "Kapsamlı yüz bakımı ve kaşlar; tek, özenli bir randevuda." },
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
      slug: { nl: "bikini-en-smooth", en: "bikini-and-smooth", tr: "bikini-ve-smooth" },
      name: { nl: "Bikini & Smooth", en: "Bikini & Smooth", tr: "Bikini & Smooth" },
      description: { nl: "Een Brazilian en hele benen samen, voor wie alles in één keer wil laten doen.", en: "A Brazilian and full legs together, for anyone who wants it all done in one visit.", tr: "Brezilya ağdası ve tüm bacak bir arada; hepsini tek seferde yaptırmak isteyenler için." },
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
