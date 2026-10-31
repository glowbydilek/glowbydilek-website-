import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PrivacyPage } from "@/views/PrivacyPage";

export const metadata: Metadata = pageMetadata("en", "privacy");

export default function Page() {
  return (
    <PageFrame locale="en" route="privacy">
      <PrivacyPage locale="en" />
    </PageFrame>
  );
}
