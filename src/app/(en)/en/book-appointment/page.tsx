import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { BookingPage } from "@/views/BookingPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "booking");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="booking">
      <BookingPage locale="en" />
    </PageFrame>
  );
}
