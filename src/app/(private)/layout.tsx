import "../globals.css";
import { fontVariables } from "../fonts";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getPanelLang } from "@/lib/private/panelLangServer";

/** Root layout for the private areas (/admin and /agenda). Never indexed. */
export const metadata: Metadata = {
  title: { default: "Glow by Dilek", template: "%s · Glow by Dilek" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: "#2b202b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function PrivateRoot({ children }: { children: ReactNode }) {
  // Dutch by default; Turkish when chosen in the panel (correct hyphenation and screen-reader voice).
  const lang = await getPanelLang();
  return (
    <html lang={lang} className={fontVariables}>
      <body className="min-h-dvh bg-[#f4f1ea] text-ink antialiased">{children}</body>
    </html>
  );
}
