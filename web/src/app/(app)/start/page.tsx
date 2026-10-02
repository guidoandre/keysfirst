import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ScanIllustration } from "@/components/guide/GuideIllustrations";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { CARD_FEES, eurText, EXAMPLE_INTL_PRICE, EXAMPLE_PRICE, MIN_FEE } from "@/content/fees";
import { GuideLogin } from "./GuideLogin";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Get started",
  description: "Log in with your email or Google, create a deposit link, pay it with a test card and try the key handover.",
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
    <div className="enter-stack mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <p className="label text-fg-muted">Guide</p>
      <h1 className="mt-3 font-display text-title font-bold">Get started in 5 minutes</h1>
      <p className="mt-4 max-w-2xl text-lead text-fg-muted">
        Keysfirst runs on test money, so you can try everything safely. You need an email address (or a Google account) and, for the
        handover, a phone.
      </p>

      <div className="mt-10">
        <GuideStep id="login" number={1} title="Log in">
          <p>Use your email or Google. Keysfirst sets up your account for you: no app to install, nothing to pay for network costs.</p>
          <GuideLogin />
        </GuideStep>

        <GuideStep id="landlord" number={2} title="As the landlord: create a deposit link">
          <p>
            Enter the room, the deposit and the move-in date. Use the demo values to see the whole cycle in a few minutes. Send the link to your
            tenant.
          </p>
          <ButtonLink href="/new">Create a deposit link</ButtonLink>
        </GuideStep>

        <GuideStep id="pay" number={3} title="As the tenant: pay by card">
          <p>
            Open the link and log in with a different email. Pay the deposit plus the Keysfirst fee ({CARD_FEES}, at least {MIN_FEE}, not
            refunded). This prototype uses Stripe&apos;s test mode: pay with the German test card{" "}
            <strong className="text-fg tabular-nums">4000 0027 6000 0016</strong> (charged {eurText(EXAMPLE_PRICE.totalCents)} on a{" "}
            {eurText(EXAMPLE_PRICE.depositCents)} deposit) or the US test card{" "}
            <strong className="text-fg tabular-nums">4242 4242 4242 4242</strong> (charged {eurText(EXAMPLE_INTL_PRICE.totalCents)}), any future
            date and any three digits. No real money moves.
          </p>
          <p>After the payment the deposit locks automatically. The landlord can&apos;t take it.</p>
          <Callout tone="neutral">The landlord can&apos;t pay their own deal: use a second account for the tenant.</Callout>
        </GuideStep>

        <GuideStep id="door" number={4} title="At the door: confirm the handover" art={<ScanIllustration />}>
          <p>
            The landlord taps &ldquo;Start the handover&rdquo; and shows a code. The tenant checks the room, scans the code with the phone camera,
            taps Continue and then &ldquo;I have the keys&rdquo;. The landlord is paid in seconds.
          </p>
        </GuideStep>

        <GuideStep id="withdraw" number={5} title="Withdraw to your bank">
          <p>
            Money you receive, as the landlord or as a tenant whose deposit came back, shows as your balance. Open your account menu (your account in the
            top corner), then tap &ldquo;Withdraw to bank&rdquo;. In this prototype the test money leaves your balance, but no real bank transfer
            happens.
          </p>
        </GuideStep>
      </div>
    </div>
  );
}
