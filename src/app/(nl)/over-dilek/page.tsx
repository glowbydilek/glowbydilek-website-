import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/views/AboutPage";

export const metadata: Metadata = pageMetadata("nl", "about");

export default function Page() {
  return <AboutPage locale="nl" />;
}
