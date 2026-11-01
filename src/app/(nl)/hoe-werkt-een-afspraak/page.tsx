import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("nl", "process");
}

export default function Page() {
  return (
    <PageFrame locale="nl" route="process">
      <GuidePage locale="nl" page="process" />
    </PageFrame>
  );
}
