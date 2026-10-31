import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export const metadata: Metadata = pageMetadata("en", "preparation");

export default function Page() {
  return (
    <PageFrame locale="en" route="preparation">
      <GuidePage locale="en" page="preparation" />
    </PageFrame>
  );
}
