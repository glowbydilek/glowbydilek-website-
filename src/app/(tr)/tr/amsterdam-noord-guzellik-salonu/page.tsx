import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { noordCopy } from "@/content/copy/blog";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { ArticlePage } from "@/views/ArticlePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "noord");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="noord">
      <ArticlePage locale="tr" copy={noordCopy("tr")} photo="interior" crumbs={[{ name: getDictionary("tr").nav.noord }]} />
    </PageFrame>
  );
}
