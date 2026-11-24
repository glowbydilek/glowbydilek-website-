import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { noordCopy } from "@/content/copy/blog";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { ArticlePage } from "@/views/ArticlePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "noord");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="noord">
      <ArticlePage locale="en" copy={noordCopy("en")} photo="interior" crumbs={[{ name: getDictionary("en").nav.noord }]} />
    </PageFrame>
  );
}
