import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PageFrame } from "@/components/PageFrame";
import { postCopy } from "@/content/copy/blog";
import { postDates, postIds, postSlugs } from "@/content/slugs";
import { findPost, href, postHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ensureContent } from "@/lib/cms/store";
import { postJsonLd, postMetadata } from "@/lib/seo";
import { ArticlePage } from "@/views/ArticlePage";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return postIds.map((id) => ({ slug: postSlugs[id].tr }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = findPost("tr", (await params).slug);
  if (!id) return {};
  await ensureContent();
  return postMetadata("tr", id);
}

export default async function Page({ params }: Props) {
  const id = findPost("tr", (await params).slug);
  if (!id) notFound();
  const dict = getDictionary("tr");
  const copy = postCopy("tr", id);
  return (
    <PageFrame
      locale="tr"
      crumbs={[
        { name: dict.nav.blog, path: href("tr", "blog") },
        { name: copy.seoTitle, path: postHref("tr", id) },
      ]}
    >
      <ArticlePage
        locale="tr"
        copy={copy}
        published={postDates[id]}
        crumbs={[{ name: dict.nav.blog, href: href("tr", "blog") }, { name: copy.seoTitle }]}
      />
      <JsonLd data={postJsonLd("tr", id)} />
    </PageFrame>
  );
}
