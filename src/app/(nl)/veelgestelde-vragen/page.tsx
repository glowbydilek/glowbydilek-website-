import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { FaqPage } from "@/views/FaqPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("nl", "faq");
}

export default function Page() {
  return (
    <PageFrame locale="nl" route="faq">
      <FaqPage locale="nl" />
    </PageFrame>
  );
}
