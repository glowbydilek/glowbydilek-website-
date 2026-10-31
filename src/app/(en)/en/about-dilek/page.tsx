import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AboutPage } from "@/views/AboutPage";

export const metadata: Metadata = pageMetadata("en", "about");

export default function Page() {
  return <AboutPage locale="en" />;
}
