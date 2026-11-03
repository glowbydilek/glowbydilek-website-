import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { BookingPage } from "@/views/BookingPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("tr", "booking");
}

export default function Page() {
  return (
    <PageFrame locale="tr" route="booking">
      <BookingPage locale="tr" />
    </PageFrame>
  );
}
