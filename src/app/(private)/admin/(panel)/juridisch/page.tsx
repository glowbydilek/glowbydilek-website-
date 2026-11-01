import Link from "next/link";
import { LegalToggle } from "@/components/private/cms/LegalForms";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { legalEn } from "@/content/copy/legal.en";
import { legalNl } from "@/content/copy/legal.nl";
import { mergeContent } from "@/lib/cms/registry";
import { getPublishedEntry } from "@/lib/cms/store";
import { DEFAULT_LEGAL_STATUS, hasPlaceholder, LEGAL_KEYS, LEGAL_LABELS, LEGAL_PATHS } from "@/lib/legal";

export const metadata = { title: "Juridische pagina's" };

export default async function LegalAdmin() {
  const statusRow = await getPublishedEntry("legal-status", "all");
  const status = { ...DEFAULT_LEGAL_STATUS, ...((statusRow?.data as object) ?? {}) } as Record<string, boolean>;
  const rows = await Promise.all(
    LEGAL_KEYS.map(async (k) => {
      const [nl, en] = await Promise.all([getPublishedEntry(`legal:${k}`, "nl"), getPublishedEntry(`legal:${k}`, "en")]);
      const dnl = nl ? mergeContent(legalNl[k], nl.data) : legalNl[k];
      const den = en ? mergeContent(legalEn[k], en.data) : legalEn[k];
      return { k, on: status[k], todo: hasPlaceholder(dnl) || hasPlaceholder(den), date: dnl.effectiveDate, version: nl?.version ?? 0 };
    }),
  );
  return (
    <>
      <PageHeader title="Juridische pagina's" subtitle="Cookiebeleid, voorwaarden, annuleringsbeleid en beoordelingsbeleid — met ingangsdatum en versiegeschiedenis." />
      <div className="mb-5 space-y-3">
        <Notice tone="warning">
          Deze teksten zijn een zorgvuldig startpunt, <strong>geen juridisch advies</strong>. Stukken met <code>[INVULLEN …]</code> vragen om jouw keuzes (bijv. annuleringstermijn en eventuele kosten). Zolang die markeringen er staan, kan de pagina niet online. Laat voorwaarden bij voorkeur controleren door een jurist of je beroepsvereniging.
        </Notice>
        <Notice tone="info">De privacyverklaring bewerk je onder Pagina&apos;s → Privacyverklaring; die staat altijd online.</Notice>
      </div>
      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        {rows.map((r) => (
          <Card key={r.k} title={LEGAL_LABELS[r.k]} actions={<Badge tone={r.on && !r.todo ? "done" : "pending"}>{r.on && !r.todo ? "Online" : "Offline"}</Badge>}>
            <p className="text-sm text-muted">
              {LEGAL_PATHS[r.k].nl} · {LEGAL_PATHS[r.k].en}
              <br />
              {r.date ? `Ingangsdatum: ${r.date}` : "Nog geen ingangsdatum"} · {r.version ? `versie ${r.version}` : "oorspronkelijke tekst"}
            </p>
            {r.todo && <p className="mt-2 text-sm text-[#8e2f24]">Bevat nog [INVULLEN …]-markeringen.</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/admin/paginas/legal-${r.k}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">Tekst bewerken</Link>
              <LegalToggle k={r.k} on={r.on} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
