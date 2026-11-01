import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { GuidePage } from "@/views/GuidePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "process");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="process">
      <GuidePage locale="en" page="process" />
    </PageFrame>
  );
}
