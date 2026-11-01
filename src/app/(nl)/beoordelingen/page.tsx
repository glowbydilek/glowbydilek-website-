import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { ReviewsPage } from "@/views/ReviewsPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("nl", "reviews");
}

export default function Page() {
  return (
    <PageFrame locale="nl" route="reviews">
      <ReviewsPage locale="nl" />
    </PageFrame>
  );
}
