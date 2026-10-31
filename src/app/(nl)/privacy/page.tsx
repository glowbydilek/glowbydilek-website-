import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PrivacyPage } from "@/views/PrivacyPage";

export const metadata: Metadata = pageMetadata("nl", "privacy");

export default function Page() {
  return (
    <PageFrame locale="nl" route="privacy">
      <PrivacyPage locale="nl" />
    </PageFrame>
  );
}
