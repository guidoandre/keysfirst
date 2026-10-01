import type { Metadata } from "next";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingRoleProvider } from "@/components/marketing/LandingRole";
import { ProblemBand } from "@/components/marketing/ProblemBand";
import { WhySolana } from "@/components/marketing/WhySolana";

export const dynamic = "error";

export const metadata: Metadata = {
  // The root template doesn't reach the home page, so the title is written out in full.
  title: { absolute: "Keysfirst · The deposit moves only when the keys do" },
  description:
    "Renting a room in Europe from abroad? Keysfirst keeps the deposit in a lock until the key handover: the landlord is paid when you confirm the handover at the door, otherwise you can take it back after the deadline.",
};

/** "I'm renting" / "I'm letting" in the hero rewrites the hero, the problem band and the closing band (LandingRoleProvider). */
export default function LandingPage() {
  return (
    <LandingRoleProvider>
      <LandingHero />
      <ProblemBand />
      <WhySolana />
      <ClosingCta />
    </LandingRoleProvider>
  );
}
