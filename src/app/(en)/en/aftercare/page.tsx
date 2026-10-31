import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export const metadata: Metadata = pageMetadata("en", "aftercare");

export default function Page() {
  return (
    <PageFrame locale="en" route="aftercare">
      <GuidePage locale="en" page="aftercare" />
    </PageFrame>
  );
}
