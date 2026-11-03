import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/views/AboutPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "about");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="about">
      <AboutPage locale="tr" />
    </PageFrame>
  );
}
