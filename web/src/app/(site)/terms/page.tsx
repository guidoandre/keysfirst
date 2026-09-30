import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, MailLink } from "@/components/site/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Keysfirst is a student prototype on Solana's test network that handles only test money. What that means for you.",
};

const LINK = "font-semibold underline underline-offset-2";

const DONT = [
  "use it for real rental deposits or send real money to any address shown here;",
  "put names, street addresses, phone numbers or other personal details in a room title;",
  "attack, overload or misuse the site, the test card payments or the program, or use them to deceive other people.",
];

export default function TermsPage() {
  return (
    <LegalPage
      label="Terms"
      title="Terms of use"
      lead="Keysfirst is a prototype built for a student competition. It handles only test money, so no real money is ever charged. By using it you accept these terms."
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
          ). Keysfirst cannot reverse, stop or redirect a step you confirm.
        </p>
        <p>
          Rental contracts, deposits and disputes between landlord and tenant are a matter between them under the tenancy law of the
          country where the room is. The information on this site about deposit rules is general and not legal advice.
        </p>
        <p>
          Fees: the tenant pays a Keysfirst fee on top of the deposit, 3.5% by card or 2% by bank transfer, at least €12, shown before paying.
          The fee is not refunded if the deposit goes back to the tenant. In this prototype all payments, the fee included, use Stripe&apos;s test
          mode and test money, so no real money is charged: the fee shown is the one Keysfirst would charge. Withdrawals to a bank account are
          simulated.
        </p>
      </LegalSection>

      <LegalSection id="you" title="3. Your part">
        <p>You are responsible for access to your login (your email or Google account, or your own wallet) and for every step you confirm. Please don&apos;t:</p>
        <ul className="list-disc space-y-2 pl-5">
          {DONT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="availability" title="4. Availability">
        <p>
          The prototype is provided as it is and charges no real money, with no promise that it works without errors or stays online. It may be changed,
          reset or shut down at any time without notice. The program on Solana can still be updated by its developer while it is a prototype.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="5. Liability">
        <p>
          Because Keysfirst is a free prototype that handles only test money, its developer is liable only for intent and gross negligence. This limit does not apply to injury to life,
          body or health, to claims under the German Product Liability Act (Produkthaftungsgesetz), or to defects that were fraudulently
          concealed; in those cases the law applies in full.
        </p>
      </LegalSection>

      <LegalSection id="ownership" title="6. Ownership">
        <p>
          The Keysfirst name, logo, design, text, images, video and software are the work of {OPERATOR.name} and are protected by copyright.
          You may use the site as described in these terms, but you may not copy, reuse or build on any of it without written permission.
        </p>
        <p>
          The source code is public so the project can be reviewed, but it is not open source: its licence allows viewing and evaluating it,
          nothing more.
        </p>
      </LegalSection>

      <LegalSection id="law" title="7. Law">
        <p>
          German law applies. If you use Keysfirst as a consumer living in another country, you keep the protection of the mandatory rules of
          that country.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="8. Contact and changes">
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
