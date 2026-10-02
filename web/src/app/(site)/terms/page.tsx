import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, MailLink } from "@/components/site/LegalPage";
import { BANK_FEE_PERCENT, CARD_FEE_PERCENT, INTL_CARD_FEE_PERCENT, MIN_FEE } from "@/content/fees";
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
          Keysfirst is not a bank, a payment service, an escrow agent or a party to any rental agreement. Keysfirst can&apos;t take the locked
          deposit: a public program on Solana holds it and pays it out only by its published rules (see{" "}
          <Link href="/how-it-works" className={LINK}>
            How it works
          </Link>
          ). Keysfirst has no button to take the locked money, and cannot reverse, stop or redirect a step you confirm. While this is a
          prototype the developer can still update the program, which is the upgrade key described in section 4 and in the{" "}
          <Link href="/how-it-works#limits" className={LINK}>
            known limits
          </Link>
          .
        </p>
        <p>
          Card payments are collected on Keysfirst&apos;s Stripe account before the deposit is locked. In this prototype they run in
          Stripe&apos;s test mode with test money; a live version would collect them through a licensed payment partner.
        </p>
        <p>
          Rental contracts, deposits and disputes between landlord and tenant are a matter between them under the tenancy law of the
          country where the room is. The information on this site about deposit rules is general and not legal advice.
        </p>
        <p>
          Fees: the tenant pays a Keysfirst fee on top of the deposit, shown before paying: {CARD_FEE_PERCENT} with a card issued in the
          European Economic Area, {INTL_CARD_FEE_PERCENT} with a card issued elsewhere, at least {MIN_FEE}. The exact fee for your card is
          shown after you enter it and before anything is charged; your card is charged exactly that amount. The fee is not refunded if the deposit goes back to the tenant. Only card payment is switched on; paying by bank
          transfer ({BANK_FEE_PERCENT} fee) isn&apos;t available in this prototype. All payments, the fee included, use Stripe&apos;s test mode
          and test money, so no real money is charged: the fee shown is the one Keysfirst would charge. Withdrawals to a bank account are
          simulated: the test money leaves your balance, but no real bank transfer happens.
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
          reset or shut down at any time without notice. While it is a prototype, the developer can still update the program on Solana with its upgrade key; before any real money, that key would be locked or shared between several people.
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
