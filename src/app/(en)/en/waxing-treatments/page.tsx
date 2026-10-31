import type { Metadata } from "next";
import { ensureContent } from "@/lib/cms/store";
import { PageFrame } from "@/components/PageFrame";
import { pageMetadata } from "@/lib/seo";
import { TreatmentsPage } from "@/views/TreatmentsPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "treatments");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="treatments">
      <TreatmentsPage locale="en" />
    </PageFrame>
  );
}
