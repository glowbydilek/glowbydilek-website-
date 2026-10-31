import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { FaqPage } from "@/views/FaqPage";

export const metadata: Metadata = pageMetadata("nl", "faq");

export default function Page() {
  return (
    <PageFrame locale="nl" route="faq">
      <FaqPage locale="nl" />
    </PageFrame>
  );
}
