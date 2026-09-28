import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, MailLink } from "@/components/site/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Legal notice (Impressum)",
  description: "Who runs Keysfirst and how to reach them.",
};

export default function ImpressumPage() {
  return (
    <LegalPage label="Impressum" title="Legal notice">
      <LegalSection id="provider" title="Provider (Angaben gemäß § 5 DDG)">
        <address className="not-italic">
          {OPERATOR.name}
          <br />
          {OPERATOR.street}
          <br />
          {OPERATOR.city}
          <br />
          {OPERATOR.country}
        </address>
        <p>
          Email: <MailLink email={OPERATOR.email} />
        </p>
      </LegalSection>

      <LegalSection id="what" title="What this site is">
        <p>
          Keysfirst is a non-commercial prototype built by a student for Superteam Germany&apos;s &ldquo;Build an MVP with Solana at WHU&rdquo;
          challenge. It is not a registered business, it charges nothing and it runs only on Solana&apos;s test network with test money that has no
          value. It is not a bank, a payment service or an escrow agent. See the <Link href="/terms" className="font-semibold underline underline-offset-2">terms of use</Link>.
        </p>
      </LegalSection>

      <LegalSection id="content" title="Responsible for the content (§ 18 Abs. 2 MStV)">
        <p>{OPERATOR.name}, address as above.</p>
      </LegalSection>

      <LegalSection id="disputes" title="Consumer dispute resolution">
        <p>We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board (§ 36 VSBG).</p>
      </LegalSection>
    </LegalPage>
  );
}
