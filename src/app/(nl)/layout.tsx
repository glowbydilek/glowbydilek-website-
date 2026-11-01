import "@fontsource-variable/newsreader/standard.css";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "@fontsource-variable/instrument-sans/standard.css";
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
  return rootMetadata("nl");
}

export const viewport: Viewport = {
  themeColor: "#fffcfb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <SiteShell locale="nl">{children}</SiteShell>;
}
