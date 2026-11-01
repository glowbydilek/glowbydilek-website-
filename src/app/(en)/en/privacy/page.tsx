import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PrivacyPage } from "@/views/PrivacyPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "privacy");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="privacy">
      <PrivacyPage locale="en" />
    </PageFrame>
  );
}
