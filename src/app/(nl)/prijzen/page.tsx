import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PricesPage } from "@/views/PricesPage";

export const metadata: Metadata = pageMetadata("nl", "prices");

export default function Page() {
  return <PricesPage locale="nl" />;
}
