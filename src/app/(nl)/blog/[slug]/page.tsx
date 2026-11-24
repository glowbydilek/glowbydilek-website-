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
  return postIds.map((id) => ({ slug: postSlugs[id].nl }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = findPost("nl", (await params).slug);
  if (!id) return {};
  await ensureContent();
  return postMetadata("nl", id);
}

export default async function Page({ params }: Props) {
  const id = findPost("nl", (await params).slug);
  if (!id) notFound();
  const dict = getDictionary("nl");
  const copy = postCopy("nl", id);
  return (
    <PageFrame
      locale="nl"
      crumbs={[
        { name: dict.nav.blog, path: href("nl", "blog") },
        { name: copy.seoTitle, path: postHref("nl", id) },
      ]}
    >
      <ArticlePage
        locale="nl"
        copy={copy}
        published={postDates[id]}
        crumbs={[{ name: dict.nav.blog, href: href("nl", "blog") }, { name: copy.seoTitle }]}
      />
      <JsonLd data={postJsonLd("nl", id)} />
    </PageFrame>
  );
}
