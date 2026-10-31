import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { PricesPage } from "@/views/PricesPage";

export const metadata: Metadata = pageMetadata("nl", "prices");

export default function Page() {
  return (
    <PageFrame locale="nl" route="prices">
      <PricesPage locale="nl" />
    </PageFrame>
  );
}
