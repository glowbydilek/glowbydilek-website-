import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { ContactPage } from "@/views/ContactPage";

export const metadata: Metadata = pageMetadata("nl", "contact");

export default function Page() {
  return (
    <PageFrame locale="nl" route="contact">
      <ContactPage locale="nl" />
    </PageFrame>
  );
}
