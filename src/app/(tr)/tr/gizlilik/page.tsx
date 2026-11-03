import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PrivacyPage } from "@/views/PrivacyPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "privacy");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="privacy">
      <PrivacyPage locale="tr" />
    </PageFrame>
  );
}
