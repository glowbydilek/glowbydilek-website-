import Link from "next/link";
import { inArray } from "drizzle-orm";
import { Card, PageHeader } from "@/components/private/ui";
import { EDITOR_PAGES } from "@/lib/cms/registry";
import { getDb } from "@/lib/db/client";
import { contentEntries } from "@/lib/db/schema";

export const metadata = { title: "Pagina's" };

export default async function Pages() {
  const keys = EDITOR_PAGES.flatMap((p) => p.docs.map((d) => d.key));
  const rows = await getDb().select({ docKey: contentEntries.docKey, locale: contentEntries.locale, status: contentEntries.status }).from(contentEntries).where(inArray(contentEntries.docKey, keys));
  const groups = [...new Set(EDITOR_PAGES.map((p) => p.group))];
  const state = (docs: string[]) => {
    const r = rows.filter((x) => docs.includes(x.docKey));
    return { drafts: r.filter((x) => x.status === "draft").length, edited: r.filter((x) => x.status === "published").length };
  };
  return (
    <>
      <PageHeader title="Pagina's" subtitle="Kies een pagina om teksten, koppen, knoppen en de volgorde van onderdelen te bewerken. Nederlands en Engels worden apart bewerkt en gepubliceerd." />
      <div className="space-y-5">
        {groups.map((g) => (
          <Card key={g} title={g}>
            <ul className="divide-y divide-stone">
              {EDITOR_PAGES.filter((p) => p.group === g).map((p) => {
                const st = state(p.docs.map((d) => d.key));
                return (
                  <li key={p.id}>
                    <Link href={`/admin/paginas/${p.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2">
                      <span>
                        <span className="block font-medium">{p.label}</span>
                        <span className="text-xs text-muted">{p.paths.nl}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs">
                        {st.drafts > 0 && <span className="rounded-full bg-[#fbf0d9] px-2 py-0.5 text-[#6b4b12]">concept</span>}
                        {st.edited > 0 && <span className="rounded-full bg-[#e3efe1] px-2 py-0.5 text-[#2f4b2d]">aangepast</span>}
                        <span aria-hidden="true" className="text-muted">›</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
