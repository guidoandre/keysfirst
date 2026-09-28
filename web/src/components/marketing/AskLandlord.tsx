"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { PRODUCTION_URL } from "@/lib/site";

// Cut rule: if /landlords is cut, point the message at "/".
const LANDLORD_PAGE = "/landlords";

/** A pre-filled message a tenant sends to their landlord (spec §6.10): WhatsApp or copy. */
export function AskLandlord({ tone = "light" }: { tone?: "light" | "dark" }) {
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const origin = mounted ? window.location.origin : PRODUCTION_URL;
  const message = `Hi, Could we use Keysfirst for the deposit? You create a deposit link, I pay into it, and you get the money the moment I scan your code at the key handover: ${origin}${LANDLORD_PAGE}`;

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ButtonLink href={whatsappUrl(message)} external variant="secondary">
        Ask your landlord on WhatsApp
      </ButtonLink>
      <Button variant="quiet" onClick={copy} className={cx("justify-center", tone === "dark" && "text-fg-inverse")}>
        <Icon name={copied ? "check" : "copy"} size={18} />
        {copied ? "Copied" : "Copy the message"}
      </Button>
    </div>
  );
}
