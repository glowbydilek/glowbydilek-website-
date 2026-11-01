import { BusinessForm, MenuEditor } from "@/components/private/cms/MenuEditor";
import { Card, PageHeader } from "@/components/private/ui";
import { getDictionary } from "@/i18n/dictionaries";
import { DEFAULT_MENU, MENU_CHOICES, validateBusiness, validateMenu } from "@/lib/cms/menu";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Menu & footer" };

export default async function NavPage() {
  const db = getDb();
  const [menu, biz] = await Promise.all([editorValue(db, "menu", "all", DEFAULT_MENU), editorValue(db, "business", "all", {})]);
  const dict = getDictionary("nl");
  const labels = Object.fromEntries(MENU_CHOICES.map((k) => [k, dict.nav[k]]));
  const b = validateBusiness(biz.value).value;
  return (
    <>
      <PageHeader title="Menu & footer" subtitle="Kies welke pagina's in het menu en de footer staan, en in welke volgorde. Alleen bestaande pagina's kunnen worden gekozen, zodat er nooit een kapotte link ontstaat." />
      <div className="space-y-5">
        <Card title="Menu's"><MenuEditor initial={validateMenu(menu.value)} choices={MENU_CHOICES} labels={labels} /></Card>
        <Card title="Contactgegevens"><BusinessForm phone={b.phone} instagram={b.instagram} /></Card>
      </div>
    </>
  );
}
