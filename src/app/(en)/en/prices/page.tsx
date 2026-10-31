import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PricesPage } from "@/views/PricesPage";

export const metadata: Metadata = pageMetadata("en", "prices");

export default function Page() {
  return (
    <PageFrame locale="en" route="prices">
      <PricesPage locale="en" />
    </PageFrame>
  );
}
