import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export const metadata: Metadata = pageMetadata("nl", "process");

export default function Page() {
  return (
    <PageFrame locale="nl" route="process">
      <GuidePage locale="nl" page="process" />
    </PageFrame>
  );
}
