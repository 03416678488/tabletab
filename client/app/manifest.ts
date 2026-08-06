import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TableTap POS",
    short_name: "TableTap",
    description: "Restaurant POS & ordering — keeps taking orders offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c3090c",
    icons: [
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icons/app-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
