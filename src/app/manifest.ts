import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glow by Dilek",
    short_name: "Glow by Dilek",
    description: "Professioneel waxen op afspraak",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#f8f5ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
