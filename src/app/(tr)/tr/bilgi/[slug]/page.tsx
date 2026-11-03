import type { Metadata } from "next";
import { CustomPageView, customPageMetadata } from "@/views/CustomPage";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return customPageMetadata("tr", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <CustomPageView locale="tr" slug={(await params).slug} />;
}
