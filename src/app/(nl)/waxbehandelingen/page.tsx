import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { TreatmentsPage } from "@/views/TreatmentsPage";

export const metadata: Metadata = pageMetadata("nl", "treatments");

export default function Page() {
  return <TreatmentsPage locale="nl" />;
}
