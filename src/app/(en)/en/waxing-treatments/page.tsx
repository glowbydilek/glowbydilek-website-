import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { TreatmentsPage } from "@/views/TreatmentsPage";

export const metadata: Metadata = pageMetadata("en", "treatments");

export default function Page() {
  return (
    <PageFrame locale="en" route="treatments">
      <TreatmentsPage locale="en" />
    </PageFrame>
  );
}
