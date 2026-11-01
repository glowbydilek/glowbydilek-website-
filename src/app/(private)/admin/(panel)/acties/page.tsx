import { asc, desc } from "drizzle-orm";
import { CampaignForm, PromotionForm, type CampaignView, type PromoView } from "@/components/private/cms/MarketingForms";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { ownerTreatments } from "@/lib/catalogue/owner";
import { getDb } from "@/lib/db/client";
import { campaigns, media, promotions, serviceSections } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { centsToInput } from "@/lib/finance/money";
import { isRunning } from "@/lib/promotions/core";
import { toPromotion } from "@/lib/promotions/service";
import { toLocalParts } from "@/lib/time";

export const metadata = { title: "Acties & kortingen" };

const day = (d: Date | null) => (d ? toLocalParts(d).date : "");

export default async function MarketingAdmin() {
  const db = getDb();
  await ensureSeeded(db);
  const [promoRows, campaignRows, sections, items, mediaRows] = await Promise.all([
    db.select().from(promotions).orderBy(desc(promotions.createdAt)),
    db.select().from(campaigns).orderBy(asc(campaigns.sort), asc(campaigns.id)),
    db.select().from(serviceSections).orderBy(asc(serviceSections.sort)),
    ownerTreatments(db),
    db.select({ id: media.id, name: media.filename }).from(media).orderBy(desc(media.createdAt)).limit(100),
  ]);
  const opts = {
    sections: sections.map((s) => ({ id: s.id, label: s.nameNl })),
    items: items.filter((i) => i.status !== "archived").map((i) => ({ id: i.id, label: i.name, group: i.category })),
  };
  const view = (r: (typeof promoRows)[number]): PromoView => ({
    id: r.id,
    nameNl: r.nameNl,
    nameEn: r.nameEn,
    kind: r.kind,
    value: r.kind === "percent" ? String(r.value / 100).replace(".", ",") : centsToInput(r.value),
    scope: r.scope,
    scopeIds: Array.isArray(r.scopeIds) ? (r.scopeIds as string[]) : [],
    code: r.code ?? "",
    startsAt: day(r.startsAt),
    endsAt: day(r.endsAt),
    maxUses: r.maxUses != null ? String(r.maxUses) : "",
    minSpend: r.minSpendCents != null ? centsToInput(r.minSpendCents) : "",
    status: r.status,
    showPublic: r.showPublic,
    noteNl: r.noteNl ?? "",
    noteEn: r.noteEn ?? "",
  });
  const blankPromo: PromoView = { id: null, nameNl: "", nameEn: "", kind: "percent", value: "", scope: "all", scopeIds: [], code: "", startsAt: "", endsAt: "", maxUses: "", minSpend: "", status: "draft", showPublic: false, noteNl: "", noteEn: "" };
  const cview = (c: (typeof campaignRows)[number]): CampaignView => ({ id: c.id, titleNl: c.titleNl, titleEn: c.titleEn, textNl: c.textNl, textEn: c.textEn, ctaNl: c.ctaNl, ctaEn: c.ctaEn, href: c.href, mediaId: c.mediaId, startsAt: day(c.startsAt), endsAt: day(c.endsAt), status: c.status, sort: c.sort });
  const now = new Date();
  return (
    <>
      <PageHeader title="Acties & kortingen" subtitle="Kortingen, actiecodes en de actieslider op de homepage." />
      <div className="mb-5">
        <Notice tone="info">
          Er wordt nooit iets automatisch gepubliceerd: een actie werkt pas als je de status op <strong>Actief</strong> zet, en alleen binnen de ingestelde periode. Per afspraak geldt maximaal één actie. Kortingen gelden alleen voor behandelingen met een vaste prijs.
        </Notice>
      </div>
      <div className="space-y-6">
        <Card title="Acties">
          <div className="space-y-3">
            {promoRows.map((r) => {
              const p = toPromotion(r);
              const live = isRunning(p, now);
              return (
                <details key={r.id} className="rounded-2xl border border-line p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{r.nameNl}{r.code ? ` · code ${r.code}` : ""}</span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {r.kind === "percent" ? `${r.value / 100}%` : `€ ${centsToInput(r.value)}`} · {r.usedCount}× gebruikt{r.maxUses ? ` van ${r.maxUses}` : ""}
                      <Badge tone={live ? "done" : r.status === "archived" ? "cancelled" : "pending"}>{live ? "Loopt nu" : r.status === "active" ? "Buiten periode" : r.status === "archived" ? "Gearchiveerd" : "Concept"}</Badge>
                    </span>
                  </summary>
                  <div className="mt-3"><PromotionForm p={view(r)} opts={opts} /></div>
                </details>
              );
            })}
            {!promoRows.length && <p className="text-sm text-muted">Nog geen acties.</p>}
          </div>
          <details className="mt-5 rounded-2xl border border-dashed border-ink/25 p-3">
            <summary className="cursor-pointer font-medium">＋ Nieuwe actie</summary>
            <div className="mt-3"><PromotionForm p={blankPromo} opts={opts} /></div>
          </details>
        </Card>

        <Card title="Actieslider op de homepage">
          <p className="mb-4 text-sm text-muted">Zonder actieve slides wordt de slider niet getoond. Bezoekers met ‘minder beweging’ ingesteld zien geen automatische wisseling.</p>
          <div className="space-y-3">
            {campaignRows.map((c) => (
              <details key={c.id} className="rounded-2xl border border-line p-3">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{c.titleNl}</span>
                  <Badge tone={c.status === "active" ? "done" : c.status === "archived" ? "cancelled" : "pending"}>{c.status === "active" ? "Actief" : c.status === "archived" ? "Gearchiveerd" : "Concept"}</Badge>
                </summary>
                <div className="mt-3"><CampaignForm c={cview(c)} media={mediaRows} /></div>
              </details>
            ))}
          </div>
          <details className="mt-5 rounded-2xl border border-dashed border-ink/25 p-3">
            <summary className="cursor-pointer font-medium">＋ Nieuwe slide</summary>
            <div className="mt-3">
              <CampaignForm c={{ id: null, titleNl: "", titleEn: "", textNl: "", textEn: "", ctaNl: "", ctaEn: "", href: "", mediaId: null, startsAt: "", endsAt: "", status: "draft", sort: campaignRows.length }} media={mediaRows} />
            </div>
          </details>
        </Card>
      </div>
    </>
  );
}
