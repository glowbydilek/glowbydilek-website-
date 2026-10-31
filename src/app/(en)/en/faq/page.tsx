import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { FaqPage } from "@/views/FaqPage";

export const metadata: Metadata = pageMetadata("en", "faq");

export default function Page() {
  return (
    <PageFrame locale="en" route="faq">
      <FaqPage locale="en" />
    </PageFrame>
  );
}
