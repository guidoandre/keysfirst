import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { WalletButton } from "@/components/WalletButton";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Keysfirst — the deposit moves only when the keys do",
  description:
    "Lock a rental deposit on Solana. The landlord gets it when the tenant scans the handover QR code; otherwise it comes back automatically. Devnet prototype with test money.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Providers>
          <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
            Prototype on Solana devnet · test money only, nothing here has real value
          </div>
          <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
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
