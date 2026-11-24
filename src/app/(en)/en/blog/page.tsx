import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { ensureContent } from "@/lib/cms/store";
import { pageMetadata } from "@/lib/seo";
import { BlogIndexPage } from "@/views/BlogIndexPage";

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return pageMetadata("en", "blog");
}

export default function Page() {
  return (
    <PageFrame locale="en" route="blog">
      <BlogIndexPage locale="en" />
    </PageFrame>
  );
}
