import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { noordCopy } from "@/content/copy/blog";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { ArticlePage } from "@/views/ArticlePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("nl", "noord");
}

export default function Page() {
  return (
    <PageFrame locale="nl" route="noord">
      <ArticlePage locale="nl" copy={noordCopy("nl")} photo="interior" crumbs={[{ name: getDictionary("nl").nav.noord }]} />
    </PageFrame>
  );
}
