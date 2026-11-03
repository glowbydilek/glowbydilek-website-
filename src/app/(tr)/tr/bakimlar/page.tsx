import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { ServicesPage } from "@/views/ServicesPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "services");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="services">
      <ServicesPage locale="tr" />
    </PageFrame>
  );
}
