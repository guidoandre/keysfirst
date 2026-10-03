import type { ReactNode } from "react";
import { PlayOnPointer } from "@/components/marketing/PlayOnPointer";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SiteHeader } from "@/components/site/SiteHeader";

/**
 * Marketing pages: static, no wallet code (spec §4, route groups). Sections rise into view (ScrollReveal) and icons act
 * out their word when the pointer arrives (PlayOnPointer); design system §5 and §8.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <ScrollReveal />
      <PlayOnPointer />
    </>
  );
}
