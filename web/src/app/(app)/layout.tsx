import type { ReactNode } from "react";
import { AppHeader } from "@/components/wallet/AppHeader";
import { Providers } from "./providers";

/** Account pages: one provider tree; logging in opens the Privy login (email, Google or Phantom). */
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
