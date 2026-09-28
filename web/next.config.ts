import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link-preview images read the approved TTF at request time (deal previews): ship it with every server function.
  outputFileTracingIncludes: { "/**": ["./assets/fonts/**"] },
};

export default nextConfig;
