import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { ContactPage } from "@/views/ContactPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "contact");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="contact">
      <ContactPage locale="tr" />
    </PageFrame>
  );
}
