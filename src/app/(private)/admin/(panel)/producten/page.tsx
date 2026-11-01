import { asc, desc, eq } from "drizzle-orm";
import { ProductForm, ProductsPublicForm, ProtocolForm, StockForm, type ProductView } from "@/components/private/cms/ProductForms";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { ownerTreatments } from "@/lib/catalogue/owner";
import { getDb } from "@/lib/db/client";
import { media, products, protocols } from "@/lib/db/schema";
import { getSetting } from "@/lib/db/settings";
import { ensureSeeded } from "@/lib/db/seed";
import { centsToInput } from "@/lib/finance/money";
import { parseSteps, PRODUCT_CATEGORIES, stockFlags } from "@/lib/products/core";
import { todayLocal } from "@/lib/time";

export const metadata = { title: "Producten & materialen" };

const FLAG: Record<string, string> = { out: "Op", low: "Bijna op", expired: "Over datum", expiring: "Bijna over datum" };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  await ensureSeeded(db);
  const [rows, items, mediaRows, pub] = await Promise.all([
    db.select().from(products).orderBy(asc(products.status), asc(products.category), asc(products.name)),
    ownerTreatments(db),
    db.select({ id: media.id, name: media.filename }).from(media).orderBy(desc(media.createdAt)).limit(100),
    getSetting(db, "products_public", { enabled: false }),
  ]);
  const today = todayLocal();
  const selected = items.find((i) => i.id === sp.protocol) ?? null;
  const [proto] = selected ? await db.select().from(protocols).where(eq(protocols.treatmentId, selected.id)) : [];
  const view = (r: (typeof rows)[number]): ProductView => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    variant: r.variant,
    category: r.category,
    mediaId: r.mediaId,
    description: r.description ?? "",
    usage: r.usage ?? "",
    notes: r.notes ?? "",
    professionalOnly: r.professionalOnly,
    supplier: r.supplier,
    cost: r.costCents != null ? centsToInput(r.costCents) : "",
    stockQty: r.stockQty != null ? String(r.stockQty) : "",
    reorderLevel: r.reorderLevel != null ? String(r.reorderLevel) : "",
    batch: r.batch,
    expiresOn: r.expiresOn ?? "",
    status: r.status,
    showPublic: r.showPublic,
  });
  const blank: ProductView = { id: null, name: "", brand: "", variant: "", category: "other", mediaId: null, description: "", usage: "", notes: "", professionalOnly: false, supplier: "", cost: "", stockQty: "", reorderLevel: "", batch: "", expiresOn: "", status: "active", showPublic: false };
  const warnings = rows.flatMap((r) => stockFlags(r, today).map((f) => ({ name: `${r.brand ? `${r.brand} ` : ""}${r.name}`, flag: f! })));
  return (
    <>
      <PageHeader title="Producten & materialen" subtitle="Welke producten je gebruikt, voorraad, houdbaarheid en je eigen behandelprotocollen." />
      <div className="mb-5 space-y-3">
        <Notice tone="info">
          Er zijn geen producten vooraf ingevuld: alleen jij weet welke producten (bijv. van Depilève of Extenso) je echt gebruikt en hoe. Sommige producten zijn uitsluitend voor professioneel gebruik — markeer die, zodat ze nooit als thuisadvies verschijnen. Dit is geen webshop.
        </Notice>
        {warnings.length > 0 && (
          <Notice tone="warning">
            {warnings.map((w) => `${w.name}: ${FLAG[w.flag]}`).join(" · ")}
          </Notice>
        )}
      </div>
      <div className="space-y-6">
        <Card title="Producten">
          <div className="space-y-3">
            {rows.map((r) => (
              <details key={r.id} className="rounded-2xl border border-line p-3">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.brand ? `${r.brand} · ` : ""}{r.name}{r.variant ? ` (${r.variant})` : ""}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    {PRODUCT_CATEGORIES[r.category] ?? r.category} · voorraad {r.stockQty ?? "—"}
                    {stockFlags(r, today).map((f) => <Badge key={f!} tone="warning">{FLAG[f!]}</Badge>)}
                    {r.status === "archived" && <Badge tone="cancelled">Gearchiveerd</Badge>}
                  </span>
                </summary>
                <div className="mt-3 space-y-4">
                  <ProductForm p={view(r)} media={mediaRows} />
                  <StockForm productId={r.id} />
                </div>
              </details>
            ))}
            {!rows.length && <p className="text-sm text-muted">Nog geen producten.</p>}
          </div>
          <details className="mt-5 rounded-2xl border border-dashed border-ink/25 p-3">
            <summary className="cursor-pointer font-medium">＋ Nieuw product</summary>
            <div className="mt-3"><ProductForm p={blank} media={mediaRows} /></div>
          </details>
        </Card>

        <Card title="Behandelprotocollen (intern)">
          <p className="mb-3 text-sm text-muted">Je eigen werkwijze per behandeling, stap voor stap, met de producten die je daarbij gebruikt. Alleen zichtbaar voor jou.</p>
          <form className="mb-4 flex flex-wrap items-end gap-3">
            <label className="w-full min-w-0 text-sm sm:w-auto">
              <span className="mb-1 block text-muted">Behandeling</span>
              <select name="protocol" defaultValue={selected?.id ?? ""} className="min-h-11 w-full max-w-full rounded-xl border border-ink/20 bg-white px-3 sm:w-auto">
                <option value="">— kies —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.category} · {i.name}</option>)}
              </select>
            </label>
            <button className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">Openen</button>
          </form>
          {selected && (
            <ProtocolForm
              key={selected.id}
              treatmentId={selected.id}
              steps={parseSteps(proto?.steps)}
              notes={proto?.notes ?? ""}
              products={rows.filter((r) => r.status === "active").map((r) => ({ id: r.id, label: `${r.brand ? `${r.brand} ` : ""}${r.name}` }))}
            />
          )}
        </Card>

        <Card title="Publieke pagina">
          <ProductsPublicForm enabled={pub.enabled} />
        </Card>
      </div>
    </>
  );
}
