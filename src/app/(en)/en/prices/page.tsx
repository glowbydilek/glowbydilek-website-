import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PricesPage } from "@/views/PricesPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "prices");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="prices">
      <PricesPage locale="en" />
    </PageFrame>
  );
}
