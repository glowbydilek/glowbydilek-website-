import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { HomePage } from "@/views/HomePage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("nl", "home");
}

export default function Page() {
  return (
    <PageFrame locale="nl" route="home">
      <HomePage locale="nl" />
    </PageFrame>
  );
}
