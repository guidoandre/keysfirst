import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DevnetIllustration, FundsIllustration, InstallIllustration, ScanIllustration } from "@/components/guide/GuideIllustrations";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { GuideFunds } from "./GuideFunds";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Get started",
  description: "Install Phantom, switch it to Solana Devnet, get free test money and try Keysfirst as landlord and tenant.",
};

function GuideStep({ id, number, title, children, art }: { id: string; number: number; title: string; children: ReactNode; art?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-24 gap-6 border-t-2 border-fg py-10 md:grid-cols-[1fr_minmax(0,20rem)] md:items-start">
      <div>
        <p className="font-display text-section font-bold text-fg-subtle tabular-nums">{number}</p>
        <h2 id={`${id}-title`} className="mt-1 font-display text-section font-bold">
          {title}
        </h2>
        <div className="mt-4 space-y-4 text-body text-fg-muted">{children}</div>
      </div>
      {art && <div className="flex justify-center md:justify-end">{art}</div>}
    </section>
  );
}

export default function GetStartedPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <p className="label text-fg-muted">Guide</p>
      <h1 className="mt-3 font-display text-title font-bold">Get started in 5 minutes</h1>
      <p className="mt-4 max-w-2xl text-lead text-fg-muted">
        Keysfirst runs on Solana&apos;s test network, so everything here uses test money. You need a wallet app, the test network switched on and
        some test money.
      </p>

      <div className="mt-10">
        <GuideStep id="install" number={1} title="Install Phantom" art={<InstallIllustration />}>
          <p>
            Phantom is a wallet app: it holds your money and approves payments, and your keys never leave it. On a phone, install it from the App
            Store or Google Play. On a laptop, add the browser extension.
          </p>
          <ButtonLink href="https://phantom.com/download" external variant="secondary">
            Download Phantom
          </ButtonLink>
        </GuideStep>

        <GuideStep id="devnet" number={2} title="Switch Phantom to Solana Devnet" art={<DevnetIllustration />}>
          <p>
            In Phantom open <strong className="text-fg">Settings → Developer Settings</strong>, turn on <strong className="text-fg">Testnet Mode</strong>{" "}
            and choose <strong className="text-fg">Solana Devnet</strong>.
          </p>
          <p>Keysfirst only works there, and nothing on devnet has real value.</p>
        </GuideStep>

        <GuideStep id="funds" number={3} title="Log in and get test money" art={<FundsIllustration />}>
          <p>Get test funds sends 1,000 Test EUR and, if your wallet has none, a little devnet SOL for network fees.</p>
          <GuideFunds />
        </GuideStep>

        <GuideStep id="try" number={4} title="Try both sides" art={<ScanIllustration />}>
          <p>
            <strong className="text-fg">As the landlord</strong> (laptop): create a deposit link with the demo values. The 5-minute window lets you
            see the whole cycle quickly.
          </p>
          <p>
            <strong className="text-fg">As the tenant</strong> (phone): open the link inside Phantom&apos;s browser, pay into the lock, then at the
            &ldquo;door&rdquo; scan the landlord&apos;s code with the phone camera and approve in Phantom.
          </p>
          <Callout tone="neutral">Use a second wallet for the tenant: the landlord can&apos;t pay their own deal.</Callout>
          <ButtonLink href="/new">Create a deposit link</ButtonLink>
        </GuideStep>

        <GuideStep id="tips" number={5} title="Tips for phones">
          <ul className="list-disc space-y-2 pl-5">
            <li>On iPhone, open Keysfirst inside Phantom (Open in Phantom) to log in and pay.</li>
            <li>Scan the handover code with the normal Camera app, then tap Approve in Phantom.</li>
            <li>Approve within a minute. If the request expires, tap the button again for a fresh one.</li>
            <li>Phantom must be on the wallet that paid; with any other wallet it can&apos;t load the request.</li>
            <li>
              Phantom may warn that the site is new. This prototype only uses test money; a review of the domain was requested from Phantom on
              27 September 2026.
            </li>
          </ul>
        </GuideStep>
      </div>
    </div>
  );
}
