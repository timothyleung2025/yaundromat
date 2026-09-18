import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Yaundromat",
    short_name: "Yaundromat",
    description: "Silliman Basement laundry, in your pocket.",
    start_url: "/",
    scope: "/",
    lang: "en",
    categories: ["utilities", "lifestyle"],
    display: "standalone",
    background_color: "#f3f6fc",
    theme_color: "#f3f6fc",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
