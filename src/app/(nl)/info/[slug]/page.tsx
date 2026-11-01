import type { Metadata } from "next";
import { CustomPageView, customPageMetadata } from "@/views/CustomPage";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return customPageMetadata("nl", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <CustomPageView locale="nl" slug={(await params).slug} />;
}
