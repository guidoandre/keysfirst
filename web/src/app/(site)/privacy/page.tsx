import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LegalPage, LegalSection, MailLink } from "@/components/site/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data Keysfirst processes, why, who else receives it, and your rights under the GDPR.",
};

const SHORT_VERSION = [
  "No database of our own: your account is created and kept by Privy, our login provider.",
  "No analytics, no tracking, no ads. Keysfirst itself sets no cookies; Privy sets cookies to keep you logged in.",
  "Your password, card details and account keys never reach us.",
  "Deals are written to a public blockchain, where nobody (not even us) can change or delete them. Keep personal details out of them.",
];

const RIGHTS = [
  "access to your data (Art. 15 GDPR)",
  "correction (Art. 16)",
  "deletion (Art. 17)",
  "restriction of processing (Art. 18)",
  "data portability (Art. 20)",
  "objection to processing based on legitimate interests (Art. 21)",
];

export default function PrivacyPage() {
  return (
    <LegalPage label="Privacy" title="Privacy policy" lead="Keysfirst collects as little as it can. Here is everything it does process, and why.">
      <LegalSection id="short" title="The short version">
        <ul className="list-disc space-y-2 pl-5">
          {SHORT_VERSION.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="controller" title="Who is responsible">
        <p>
          The controller under the GDPR is {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}, {OPERATOR.country}. Email:{" "}
          <MailLink email={OPERATOR.email} />. See also the <Link href="/impressum" className="font-semibold underline underline-offset-2">legal notice</Link>.
        </p>
      </LegalSection>

      <LegalSection id="hosting" title="Visiting the website">
        <p>
          The site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you open a page, Vercel&apos;s servers
          process your IP address, the date and time, the page requested, and your browser and operating system, and keep them in server logs
          for security and error-finding. We don&apos;t combine these logs with other data.
        </p>
        <p>
          Legal basis: our legitimate interest in running a secure, working website (Art. 6(1)(f) GDPR). Vercel processes the data on our
          behalf under a data processing agreement (Art. 28 GDPR) and is certified under the EU-U.S. Data Privacy Framework, which the EU
          Commission recognises as adequate protection (Art. 45 GDPR). More: <ExternalLink href="https://vercel.com/legal/privacy-notice">Vercel&apos;s privacy notice</ExternalLink>.
        </p>
        <p>Fonts are served from our own server. Your browser does not contact Google or any other font service.</p>
      </LegalSection>

      <LegalSection id="storage" title="Cookies and browser storage">
        <p>
          Keysfirst itself sets no cookies. Our login provider Privy sets two cookies (&ldquo;privy-token&rdquo;, &ldquo;privy-session&rdquo;) and
          several local-storage entries starting with &ldquo;privy:&rdquo; to keep you logged in. Keysfirst also uses your browser&apos;s storage:
          a card payment in progress is remembered in local storage (&ldquo;keysfirst:card:…&rdquo;) until the deposit is locked, so it survives a
          closed tab; session storage remembers that your account&apos;s network costs were covered this session (&ldquo;keysfirst:gas:…&rdquo;)
          and keeps your create-deal draft (room title, amount, rent, country and move-in; &ldquo;keysfirst:new-deal&rdquo;) until the deal is
          created or the tab closes; local storage also remembers that this browser is logged in (&ldquo;keysfirst:logged-in&rdquo;, no account details), so the site&apos;s header shows &ldquo;My deals&rdquo; instead of &ldquo;Log in&rdquo;, and whether you turned on Demo mode (&ldquo;keysfirst:demo:…&rdquo;). The name and IBAN you type for a demo withdrawal are not stored or sent anywhere: they never leave your
          browser. This is strictly necessary for the service you asked for, so it needs no consent
          (§ 25(2) no. 2 TDDDG). It stays on your device; clearing this site&apos;s data in your browser removes it.
        </p>
      </LegalSection>

      <LegalSection id="account" title="Logging in">
        <p>
          You log in with your email address or Google, or with your own Solana wallet such as Phantom. Login is provided by Privy (Privy, Inc.,
          USA), which receives your email address or the account you log in with, creates your Solana wallet and keeps its keys protected.
          Keysfirst never sees your keys, and the site only signs the steps you confirm with a button. Keysfirst receives your email address from
          Privy only to show it in the header, and your public account number. If you log in with Google, Google also processes that login and
          passes your email address to Privy, under{" "}
          <ExternalLink href="https://policies.google.com/privacy">Google&apos;s privacy policy</ExternalLink>.
        </p>
        <p>
          Legal basis: Art. 6(1)(b) GDPR (providing the service you asked for). Privy is based in the USA, so your login data is processed
          there. How Privy protects transfers from the EU is described in{" "}
          <ExternalLink href="https://www.privy.io/privacy-policy">Privy&apos;s privacy policy</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="Card payments">
        <p>
          Card payments are processed by Stripe (Stripe Payments Europe, Ltd., Ireland) in test mode. You enter your card details in
          Stripe&apos;s card form on the deal page (loaded from Stripe&apos;s servers, js.stripe.com); Keysfirst never sees them. Stripe tells
          us the country where the card was issued (to show the right fee before you pay), whether the payment succeeded, the amount, and
          the deal and account number the payment belongs to. Stripe may use cookies in its form to prevent fraud.
        </p>
        <p>
          Legal basis: Art. 6(1)(b) GDPR (providing the service you asked for). More:{" "}
          <ExternalLink href="https://stripe.com/privacy">Stripe&apos;s privacy policy</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection id="rpc" title="Reading and sending deals">
        <p>
          To show deals and send the payments you approve, your browser talks directly to a Solana access service (an &ldquo;RPC
          provider&rdquo;): Helius Labs, Inc., USA. Helius receives your IP address, your wallet address and the requests your browser makes.
          Legal basis: providing the service you use (Art. 6(1)(b) GDPR). More:{" "}
          <ExternalLink href="https://www.helius.dev/privacy-policy">Helius&apos;s privacy policy</ExternalLink>. If Helius isn&apos;t set up, the
          Solana Foundation&apos;s public devnet endpoint (api.devnet.solana.com) may be used instead and receives the same data.
        </p>
        <p>
          When you log in, open a deal, pay by card or approve the handover by scanning the landlord&apos;s code, your account number is sent to
          our server so it can cover network costs, look up a card payment you left half-way for that deal (at Stripe), prepare your deposit
          or build the handover request.
        </p>
      </LegalSection>

      <LegalSection id="blockchain" title="What is public on Solana">
        <p>
          Each deal is recorded on Solana&apos;s test network (devnet), a public blockchain: the landlord&apos;s and tenant&apos;s wallet
          addresses, the amount, the dates, the room title the landlord typed and every status change. Anyone can read these records, they are
          copied to computers worldwide, and nobody (including us) can change or delete them. Your rights to correction and deletion therefore
          can&apos;t be carried out for data on the blockchain. Wallet addresses don&apos;t show your name, but they become personal data if
          someone can link them to you.
        </p>
        <p>
          That&apos;s why the room title must never contain names, street addresses, phone numbers or other personal details. A title like
          &ldquo;Room in Vallendar, 14 m²&rdquo; is enough. Legal basis: carrying out the deal you start (Art. 6(1)(b) GDPR).
        </p>
      </LegalSection>

      <LegalSection id="links" title="Links to other sites">
        <p>
          Links to Solana Explorer, LinkedIn and other sites open those sites only when you click them. From then on their own privacy
          policies apply. Keysfirst embeds no content from them.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="Your rights">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          {RIGHTS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>
          To use them, email <MailLink email={OPERATOR.email} />. You can also complain to a data protection supervisory authority, for example
          the one in the German state or EU country where you live (Art. 77 GDPR).
        </p>
        <p>You don&apos;t have to give us any data. Without logging in you can read the site, but you can&apos;t create or pay a deal.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>If Keysfirst changes what it processes, this page changes too. The date at the top shows the latest version.</p>
      </LegalSection>
    </LegalPage>
  );
}
