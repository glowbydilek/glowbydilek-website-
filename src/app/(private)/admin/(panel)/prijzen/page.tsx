import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { requireCan } from "@/lib/auth/session";
import { QuickPriceRow, type QuickPriceLabels } from "@/components/private/cms/QuickPriceRow";
import { Card, PageHeader } from "@/components/private/ui";
import { BUILTIN_ITEMS } from "@/lib/catalogue/builtin";
import { getDb } from "@/lib/db/client";
import { priceHistory, serviceSections, treatments } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { getPanelLang } from "@/lib/private/panelLangServer";

export const metadata = { title: "Prijzen beheren" };

const L: Record<"nl" | "tr", QuickPriceLabels & { title: string; subtitle: string; search: string; more: string; empty: string }> = {
  nl: {
    title: "Prijzen beheren",
    subtitle: "Kies per behandeling ‘Op aanvraag’ of ‘Vaste prijs’, vul het bedrag in en tik op OK. De website, de agenda en nieuwe facturen gebruiken direct de nieuwe prijs.",
    search: "Zoek een behandeling",
    more: "Teksten, duur of publicatie wijzigen? Dat doe je onder Behandelingen.",
    empty: "Geen behandelingen gevonden.",
    onRequest: "Op aanvraag",
    fixed: "Vaste prijs",
    from: "Vanaf",
    amount: "Bedrag in euro",
    ok: "OK",
    saving: "…",
    draft: "Concept (niet op de website)",
    hidden: "Verborgen",
    earlier: "Eerdere prijzen",
    restore: "Terugzetten",
    restoreTitle: "Welke eerdere prijs wil je terugzetten?",
    confirm: "Bevestigen en opslaan",
    cancel: "Annuleren",
    changedOn: "gewijzigd op",
  },
  tr: {
    title: "Fiyatları yönet",
    subtitle: "Her işlem için ‘Fiyat sorunuz’ veya ‘Sabit fiyat’ seçin, tutarı girin ve OK'a dokunun. Web sitesi, ajanda ve yeni faturalar yeni fiyatı hemen kullanır.",
    search: "İşlem ara",
    more: "Metin, süre veya yayın durumunu değiştirmek için İşlemler sayfasını kullanın.",
    empty: "İşlem bulunamadı.",
    onRequest: "Fiyat sorunuz",
    fixed: "Sabit fiyat",
    from: "Başlangıç",
    amount: "Euro tutarı",
    ok: "OK",
    saving: "…",
    draft: "Taslak (sitede değil)",
    hidden: "Gizli",
    earlier: "Önceki fiyatlar",
    restore: "Geri al",
    restoreTitle: "Hangi önceki fiyatı geri almak istiyorsun?",
    confirm: "Onayla ve kaydet",
    cancel: "Vazgeç",
    changedOn: "değişiklik tarihi",
  },
};

/**
 * Prijzen beheren: the everyday price screen. One compact row per treatment,
 * grouped by the existing categories. It edits the same treatment records as
 * Behandelingen (no second price list); everything else stays untouched.
 */
export default async function PricesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCan("admin", "cms.publish");
  const lang = (await getPanelLang()) === "tr" ? "tr" : "nl";
  const t = L[lang];
  const db = getDb();
  await ensureSeeded(db);
  const q = ((await searchParams).q ?? "").trim().toLowerCase().slice(0, 60);
  const [sections, rows, history] = await Promise.all([
    db.select().from(serviceSections).orderBy(asc(serviceSections.sort)),
    db.select().from(treatments).orderBy(asc(treatments.sort)),
    db.select().from(priceHistory).orderBy(desc(priceHistory.createdAt), desc(priceHistory.id)).limit(2000),
  ]);
  const items = rows
    .filter((r) => r.status !== "archived")
    .map((r) => {
      const b = BUILTIN_ITEMS.find((x) => x.id === r.id);
      const name = lang === "tr" ? r.nameTr || b?.name.tr || r.nameNl : r.nameNl;
      return {
        id: r.id,
        name,
        search: `${r.nameNl} ${r.nameTr ?? ""} ${b?.name.tr ?? ""}`.toLowerCase(),
        sectionId: r.sectionId ?? b?.sectionId ?? "waxing",
        mode: (r.pricingMode ?? (r.priceCents == null ? "on_request" : r.priceFrom ? "from" : "fixed")) as "on_request" | "fixed" | "from",
        priceCents: r.priceCents,
        status: r.status,
        visible: r.visible,
      };
    })
    .map((i) => {
      // Earlier prices (newest first, without repeats of today's price), to review and put back.
      const seen = new Set<string>([`${i.mode}:${i.priceCents}`]);
      const earlier = history
        .filter((h) => h.itemId === i.id)
        .filter((h) => {
          const k = `${h.pricingMode}:${h.priceCents}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .slice(0, 6)
        .map((h) => ({ mode: h.pricingMode as "on_request" | "fixed" | "from", priceCents: h.priceCents, at: h.createdAt }));
      return { ...i, earlier };
    })
    .filter((i) => !q || i.search.includes(q));
  const secName = (s: (typeof sections)[number]) => (lang === "tr" ? s.nameTr || s.nameNl : s.nameNl);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <form className="mb-5" role="search">
        <label className="sr-only" htmlFor="q">{t.search}</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t.search}
          className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-base outline-none focus:border-accent-deep"
        />
      </form>
      {items.length === 0 && <p className="text-muted">{t.empty}</p>}
      <div className="space-y-5">
        {sections.map((s) => {
          const list = items.filter((i) => i.sectionId === s.id);
          if (!list.length) return null;
          return (
            <Card key={s.id} title={secName(s)} className="!p-4 sm:!p-5">
              <ul>
                {list.map((i) => (
                  <QuickPriceRow
                    key={i.id}
                    id={i.id}
                    name={i.name}
                    mode={i.mode}
                    priceCents={i.priceCents}
                    status={i.status}
                    visible={i.visible}
                    earlier={i.earlier.map((e) => ({ mode: e.mode, priceCents: e.priceCents, date: e.at.toLocaleDateString(lang === "tr" ? "tr-NL" : "nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric" }) }))}
                    labels={t}
                  />
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/admin/behandelingen" className="underline">{t.more}</Link>
      </p>
    </>
  );
}
