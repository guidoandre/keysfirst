import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keysfirst",
    short_name: "Keysfirst",
    description: "The deposit moves only when the keys do. Prototype on Solana's test network (devnet) with test money.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#16181D",
    icons: [
      { src: "/icon.png?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/icon.png?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
