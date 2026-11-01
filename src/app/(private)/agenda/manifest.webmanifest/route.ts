/** Home-screen app for the agenda ("Zet op beginscherm" on iPhone). No offline caching of customer data. */
export const dynamic = "force-static";

export function GET() {
  return new Response(
    JSON.stringify({
      name: "Glow by Dilek — Agenda",
      short_name: "Agenda",
      start_url: "/agenda",
      scope: "/agenda",
      display: "standalone",
      background_color: "#f4f1ea",
      theme_color: "#292724",
      lang: "nl",
      icons: [
        { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
