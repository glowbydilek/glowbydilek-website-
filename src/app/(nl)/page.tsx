import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { HomePage } from "@/views/HomePage";

export const metadata: Metadata = pageMetadata("nl", "home");

export default function Page() {
  return <HomePage locale="nl" />;
}
