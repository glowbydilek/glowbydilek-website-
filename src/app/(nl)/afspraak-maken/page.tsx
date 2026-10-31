import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { BookingPage } from "@/views/BookingPage";

export const metadata: Metadata = pageMetadata("nl", "booking");

export default function Page() {
  return (
    <PageFrame locale="nl" route="booking">
      <BookingPage locale="nl" />
    </PageFrame>
  );
}
