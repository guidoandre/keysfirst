import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Marketing pages: static, no wallet code (spec §4, route groups). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
