import type { Metadata } from "next";
import { BrandPage } from "@/views/BrandPage";

/** Internal brand review page — not linked, not indexed, not in the sitemap. */
export const metadata: Metadata = {
  title: "Merkidentiteit",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrandPage />;
}
