import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { WalletButton } from "@/components/WalletButton";
import { siteUrl } from "@/lib/site";
import { barlow, barlowCondensed } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Keysfirst · The deposit moves only when the keys do", template: "%s · Keysfirst" },
  description:
    "A deposit link for renting a room in Germany from abroad. The landlord is paid only when the tenant scans their code at the key handover; otherwise the deposit goes back. Solana devnet prototype with test money.",
  openGraph: { siteName: "Keysfirst", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#16181D" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="bg-subtle px-4 py-2 text-center text-xs text-fg-muted">
            Prototype on Solana devnet · test money only, nothing here has real value
          </div>
          <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-display text-lg font-bold">
              Keysfirst
            </Link>
            <WalletButton />
          </header>
          <main className="mx-auto max-w-xl px-4 pb-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
