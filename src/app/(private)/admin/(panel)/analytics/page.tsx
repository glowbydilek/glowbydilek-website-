import { requireOwner } from "@/lib/auth/session";
import { AnalyticsEditor } from "@/components/private/cms/SocialAnalyticsForms";
import { Card, PageHeader } from "@/components/private/ui";
import { DEFAULT_ANALYTICS, validateAnalytics } from "@/lib/cms/menu";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";
import { panelT } from "@/lib/private/panelLangServer";

export const metadata = { title: "Analytics & cookies" };

export default async function AnalyticsPage() {
  const t = await panelT();
  await requireOwner("admin");
  const v = validateAnalytics((await editorValue(getDb(), "analytics", "all", DEFAULT_ANALYTICS)).value).value;
  return (
    <>
      <PageHeader title={t("Analytics & cookies")} subtitle="Google Analytics 4, alleen met toestemming van de bezoeker." />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title={t("Instellen")}>
          <AnalyticsEditor initial={v} />
        </Card>
        <Card title={t("Hoe het werkt")}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-soft">
            <li>{t("Zolang Analytics uit staat of er geen geldige ID is, wordt er niets geladen en geen cookie geplaatst.")}</li>
            <li>{t("Staat het aan, dan krijgt elke bezoeker eerst de vraag. Pas na ‘Akkoord’ wordt Google Analytics geladen. ‘Liever niet’ is net zo makkelijk, en de keuze is te wijzigen via ‘Cookie-instellingen’ in de footer.")}</li>
            <li>{t("Advertentiefuncties en Google Signals staan altijd uit. Er worden nooit namen, e-mailadressen, telefoonnummers, afspraakgegevens of gezondheidsinformatie verstuurd.")}</li>
            <li>{t("Gemeten worden: paginaweergaven, bekeken behandelpagina's, gestart met boeken, aanvraag verstuurd, contactbericht verstuurd en klikken op ‘afspraak maken’.")}</li>
            <li>{t("Sluit in Google Analytics een verwerkersovereenkomst af en zet de bewaartermijn op 2 of 14 maanden. Zie docs/ANALYTICS.md.")}</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
