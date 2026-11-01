import "@fontsource-variable/newsreader/standard.css";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/instrument-sans/standard.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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

export default function PrivateRoot({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-dvh bg-[#f4f1ea] text-ink antialiased">{children}</body>
    </html>
  );
}
