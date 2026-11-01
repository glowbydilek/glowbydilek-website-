import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { ReviewsPage } from "@/views/ReviewsPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "reviews");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="reviews">
      <ReviewsPage locale="en" />
    </PageFrame>
  );
}
