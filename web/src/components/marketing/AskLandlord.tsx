"use client";

import { useState } from "react";
import { Button, ButtonLink, buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { emailUrl, whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { PRODUCTION_URL } from "@/lib/site";

// Cut rule: if /landlords is cut, point the message at "/".
const LANDLORD_PAGE = "/landlords";

/** The pre-filled message a tenant sends to their landlord (spec §6.10). */
export function useLandlordMessage(): string {
  const mounted = useMounted();
  const origin = mounted ? window.location.origin : PRODUCTION_URL;
  return `Hi, could we use Keysfirst for the deposit? You create a deposit link, I pay into it, and you get the money the moment I confirm the key handover at the door: ${origin}${LANDLORD_PAGE}`;
}

/** The same message by email: the tenant's own mail app opens with it filled in (no recipient: they add the landlord). */
export function EmailMessageButton({ message, size, className }: { message: string; size?: ButtonSize; className?: string }) {
  return (
    <a
      href={emailUrl("Could we use Keysfirst for the deposit?", message)}
      className={cx(buttonClass({ variant: "secondary", size }), className)}
    >
      <Icon name="mail" size={18} />
      Ask by email
    </a>
  );
}

/** Copies the message; says "Copied" for 2 s, and tells screen readers. */
export function CopyMessageButton({ message, variant = "quiet", className }: { message: string; variant?: ButtonVariant; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button variant={variant} onClick={copy} className={className}>
        {/* Keyed so the check is a fresh element each time, and draws its tick in (globals.css) */}
        <Icon key={copied ? "check" : "copy"} name={copied ? "check" : "copy"} size={18} className={copied ? "draw-in" : undefined} />
        {copied ? "Copied" : "Copy the message"}
      </Button>
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied to the clipboard" : ""}
      </p>
    </>
  );
}

/** Ask the landlord for a deposit link: WhatsApp, email or copy. */
export function AskLandlord({ tone = "light" }: { tone?: "light" | "dark" }) {
  const message = useLandlordMessage();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <ButtonLink href={whatsappUrl(message)} external variant="secondary">
        Ask your landlord on WhatsApp
      </ButtonLink>
      <EmailMessageButton message={message} />
      <CopyMessageButton message={message} className={cx("justify-center", tone === "dark" && "text-fg-inverse")} />
    </div>
  );
}
