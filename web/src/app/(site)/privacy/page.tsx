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
  "No accounts, no passwords, no database.",
  "No cookies, no analytics, no tracking, no ads.",
  "Your wallet's keys never reach us.",
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
          Keysfirst sets no cookies. When you log in with a wallet, your browser remembers which wallet you chose (for example
          &ldquo;Phantom&rdquo;) in its local storage, under the name <code>walletName</code>, so you stay logged in on your next visit. This is
          strictly necessary for the service you asked for, so it needs no consent (§ 25(2) no. 2 TDDDG). It stays on your device; clearing
          this site&apos;s data in your browser removes it.
        </p>
      </LegalSection>

      <LegalSection id="wallet" title="Your wallet">
        <p>
          You log in with your own wallet app, such as Phantom. Keysfirst sees only your public wallet address, never your keys or recovery
          phrase. Every payment is approved by you inside the wallet. The wallet app is run by its own provider under its own privacy policy,
          for example <ExternalLink href="https://phantom.com/privacy">Phantom&apos;s privacy policy</ExternalLink>. The &ldquo;Open in
          Phantom&rdquo; button passes the address of the page you are on to Phantom.
        </p>
      </LegalSection>

      <LegalSection id="rpc" title="Reading and sending deals">
        <p>
          To show deals and send the payments you approve, your browser talks directly to a Solana access service (an &ldquo;RPC
          provider&rdquo;): Helius Labs, Inc., USA. Helius receives your IP address, your wallet address and the requests your browser makes.
          Legal basis: providing the service you use (Art. 6(1)(b) GDPR). More:{" "}
          <ExternalLink href="https://www.helius.dev/privacy-policy">Helius&apos;s privacy policy</ExternalLink>.
        </p>
        <p>
          When you tap Get test funds, or approve the handover by scanning the landlord&apos;s code, your wallet address is sent to our server
          on Vercel, which prepares the transaction. We don&apos;t store it beyond the server logs described above.
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
        <p>You don&apos;t have to give us any data. Without a wallet address you can read the site, but you can&apos;t create or pay a deal.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>If Keysfirst changes what it processes, this page changes too. The date at the top shows the latest version.</p>
      </LegalSection>
    </LegalPage>
  );
}
