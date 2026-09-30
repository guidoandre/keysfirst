import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteUrl } from "@/lib/site";
import { barlow, barlowCondensed } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Keysfirst · The deposit moves only when the keys do", template: "%s · Keysfirst" },
  description:
    "A deposit link for renting a room in Europe from abroad. The landlord is paid only when the tenant confirms the key handover; otherwise the deposit goes back. Solana devnet prototype with test money.",
  // "./" resolves to each page's own path on metadataBase, so keysfirst.vercel.app and www point search engines to one URL.
  alternates: { canonical: "./" },
  openGraph: { siteName: "Keysfirst", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#16181D" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-inverse focus:px-4 focus:py-3 focus:text-fg-inverse"
        >
          Skip to content
        </a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
