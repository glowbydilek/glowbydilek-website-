import { SocialEditor } from "@/components/private/cms/SocialAnalyticsForms";
import { Card, PageHeader } from "@/components/private/ui";
import { DEFAULT_SOCIAL, validateBusiness, validateSocial } from "@/lib/cms/menu";
import { editorValue } from "@/lib/cms/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Social media" };

export default async function SocialPage() {
  const db = getDb();
  const [social, biz] = await Promise.all([editorValue(db, "social", "all", DEFAULT_SOCIAL), editorValue(db, "business", "all", {})]);
  const value = validateSocial(social.value).value;
  // Carry over an Instagram name entered earlier under "Menu & footer".
  const ig = validateBusiness(biz.value).value.instagram;
  const links = value.links.map((l) => (l.network === "instagram" && !l.url && ig ? { ...l, url: `https://www.instagram.com/${ig}` } : l));
  return (
    <>
      <PageHeader title="Social media" subtitle="Links naar je eigen profielen. Ze verschijnen als icoon in de footer zodra je ze invult en aanzet." />
      <Card>
        <SocialEditor initial={{ links }} />
      </Card>
    </>
  );
}
