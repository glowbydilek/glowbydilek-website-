import { ThemeEditor } from "@/components/private/cms/ThemeEditor";
import { Card, PageHeader } from "@/components/private/ui";
import { editorValue } from "@/lib/cms/service";
import { APPROVED_THEME, validateTheme } from "@/lib/cms/theme";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Thema & Design" };

export default async function ThemePage() {
  const ev = await editorValue(getDb(), "theme", "all", APPROVED_THEME);
  const { theme } = validateTheme(ev.value);
  return (
    <>
      <PageHeader title="Thema & Design" subtitle="Kleuren, knoppen, lettertypes, header en footer. Wijzigingen zijn pas zichtbaar na Publiceren; bekijk ze eerst als voorbeeld." />
      <Card>
        <ThemeEditor initial={theme} hasDraft={ev.hasDraft} customised={Boolean(ev.published)} />
      </Card>
    </>
  );
}
