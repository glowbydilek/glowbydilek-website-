import { BusinessForm } from "@/components/private/cms/BusinessForm";
import { Card, Notice, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { getInvoiceSettings } from "@/lib/finance/invoices";
import { invoiceReadiness } from "@/lib/finance/invoice-core";

export const metadata = { title: "Bedrijf & facturen" };

export default async function Business() {
  const v = await getInvoiceSettings(getDb());
  const missing = invoiceReadiness(v);
  return (
    <>
      <PageHeader title="Bedrijf & facturen" subtitle="Gegevens voor facturen. Ze verschijnen alleen op facturen en worden nooit op de website getoond." />
      <div className="mb-5">
        {missing.length ? (
          <Notice tone="warning">Facturen uitgeven is nog geblokkeerd. Nog nodig: {missing.join(" · ")}.</Notice>
        ) : (
          <Notice tone="success">✓ Compleet: je kunt facturen uitgeven. Laat de gegevens eenmalig controleren door je boekhouder.</Notice>
        )}
      </div>
      <Card>
        <BusinessForm v={v} />
      </Card>
      <p className="mt-4 text-xs text-muted">Wijzigingen gelden alleen voor nieuwe facturen. Uitgegeven facturen blijven precies zoals ze zijn uitgegeven.</p>
    </>
  );
}
