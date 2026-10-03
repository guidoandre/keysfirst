import type { NextConfig } from "next";

/**
 * Sent with every response. No page is meant to be shown inside another site's frame (a framed deal page could be used
 * to trick a click on "release"), so framing is refused outright. The CSP holds only rules that can't break the app;
 * Stripe's and Privy's own frames are children of our pages and are not affected by frame-ancestors.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clipboard (copy buttons) and payment (card wallets inside Stripe's form) stay allowed.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Link-preview images read the approved TTF at request time (deal previews): ship it with every server function.
  outputFileTracingIncludes: { "/**": ["./assets/fonts/**"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
