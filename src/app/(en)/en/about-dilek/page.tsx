import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/views/AboutPage";

export const metadata: Metadata = pageMetadata("en", "about");

export default function Page() {
  return (
    <PageFrame locale="en" route="about">
      <AboutPage locale="en" />
    </PageFrame>
  );
}
