import type { ReactNode } from "react";
import { AppHeader } from "@/components/wallet/AppHeader";
import { Providers } from "./providers";

/** Wallet pages: one provider tree and one connect sheet. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AppHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
    </Providers>
  );
}
