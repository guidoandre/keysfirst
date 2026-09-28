import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, MailLink } from "@/components/site/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Keysfirst is a free student prototype on Solana's test network. What that means for you.",
};

const LINK = "font-semibold underline underline-offset-2";

const DONT = [
  "use it for real rental deposits or send real money to any address shown here;",
  "put names, street addresses, phone numbers or other personal details in a room title;",
  "attack, overload or misuse the site, the test faucet or the program, or use them to deceive other people.",
];

export default function TermsPage() {
  return (
    <LegalPage
      label="Terms"
      title="Terms of use"
      lead="Keysfirst is a free prototype built for a student competition. By using it you accept these terms."
    >
      <LegalSection id="prototype" title="1. A prototype, not a live service">
        <p>
          Keysfirst is a non-commercial demonstration built by {OPERATOR.name} for Superteam Germany&apos;s &ldquo;Build an MVP with Solana at
          WHU&rdquo; challenge. It runs only on Solana&apos;s test network (devnet). The Test EUR and devnet SOL used here have no value, cannot
          be exchanged for money and can disappear at any time, for example when the test network is reset.
        </p>
        <p>Nothing on this site is an offer of financial, payment, escrow or legal services.</p>
      </LegalSection>

      <LegalSection id="role" title="2. What Keysfirst is not">
        <p>
          Keysfirst is not a bank, a payment service, an escrow agent or a party to any rental agreement. It never holds or controls the test
          money: a public program on Solana holds it and pays it out only by its published rules (see{" "}
          <Link href="/how-it-works" className={LINK}>
            How it works
          </Link>
          ). Keysfirst cannot reverse, stop or redirect a transaction you approve in your wallet.
        </p>
        <p>
          Rental contracts, deposits and disputes between landlord and tenant are a matter between them under German tenancy law. The
          information on this site about §551 BGB is general and not legal advice.
        </p>
      </LegalSection>

      <LegalSection id="you" title="3. Your part">
        <p>You are responsible for your own wallet, its keys and its recovery phrase, and for every transaction you approve. Please don&apos;t:</p>
        <ul className="list-disc space-y-2 pl-5">
          {DONT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="availability" title="4. Availability">
        <p>
          The prototype is provided as it is, free of charge, with no promise that it works without errors or stays online. It may be changed,
          reset or shut down at any time without notice. The program on Solana can still be updated by its developer while it is a prototype.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="5. Liability">
        <p>
          Because Keysfirst is free, its developer is liable only for intent and gross negligence. This limit does not apply to injury to life,
          body or health, to claims under the German Product Liability Act (Produkthaftungsgesetz), or to defects that were fraudulently
          concealed; in those cases the law applies in full.
        </p>
      </LegalSection>

      <LegalSection id="law" title="6. Law">
        <p>
          German law applies. If you use Keysfirst as a consumer living in another country, you keep the protection of the mandatory rules of
          that country.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="7. Contact and changes">
        <p>
          Questions: <MailLink email={OPERATOR.email} />. These terms may change as the prototype changes; the date at the top shows the latest
          version. See also the{" "}
          <Link href="/privacy" className={LINK}>
            privacy policy
          </Link>{" "}
          and the{" "}
          <Link href="/impressum" className={LINK}>
            legal notice
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
