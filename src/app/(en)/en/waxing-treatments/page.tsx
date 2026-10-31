import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { TreatmentsPage } from "@/views/TreatmentsPage";

export const metadata: Metadata = pageMetadata("en", "treatments");

export default function Page() {
  return <TreatmentsPage locale="en" />;
}
