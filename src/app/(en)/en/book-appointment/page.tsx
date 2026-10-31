import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BookingPage } from "@/views/BookingPage";

export const metadata: Metadata = pageMetadata("en", "booking");

export default function Page() {
  return <BookingPage locale="en" />;
}
