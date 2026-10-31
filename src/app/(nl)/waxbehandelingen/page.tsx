import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { TreatmentsPage } from "@/views/TreatmentsPage";

export const metadata: Metadata = pageMetadata("nl", "treatments");

export default function Page() {
  return (
    <PageFrame locale="nl" route="treatments">
      <TreatmentsPage locale="nl" />
    </PageFrame>
  );
}
