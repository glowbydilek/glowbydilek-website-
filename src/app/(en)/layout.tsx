import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/jost";
import "@fontsource/parisienne/400.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/SiteShell";
import { ensureContent } from "@/lib/cms/store";
import { rootMetadata } from "@/lib/seo";

/** Owner edits from the CMS appear within 5 minutes even without an explicit publish revalidation. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  await ensureContent();
  return rootMetadata("en");
}

export const viewport: Viewport = {
  themeColor: "#f8f5ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
