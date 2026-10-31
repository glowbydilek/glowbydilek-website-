import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ContactPage } from "@/views/ContactPage";

export const metadata: Metadata = pageMetadata("nl", "contact");

export default function Page() {
  return <ContactPage locale="nl" />;
}
