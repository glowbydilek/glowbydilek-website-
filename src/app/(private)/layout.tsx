import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/jost";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/** Root layout for the private areas (/admin and /ajanda). Never indexed. */
export const metadata: Metadata = {
  title: { default: "Glow by Dilek", template: "%s · Glow by Dilek" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: "#292724",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function PrivateRoot({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-dvh bg-[#f4f1ea] text-charcoal antialiased">{children}</body>
    </html>
  );
}
