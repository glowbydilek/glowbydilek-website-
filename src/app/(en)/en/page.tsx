import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { HomePage } from "@/views/HomePage";

export const metadata: Metadata = pageMetadata("en", "home");

export default function Page() {
  return (
    <PageFrame locale="en" route="home">
      <HomePage locale="en" />
    </PageFrame>
  );
}
