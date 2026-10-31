import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export const metadata: Metadata = pageMetadata("nl", "preparation");

export default function Page() {
  return (
    <PageFrame locale="nl" route="preparation">
      <GuidePage locale="nl" page="preparation" />
    </PageFrame>
  );
}
