"use client";

import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { emailUrl, whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** The heading already says "send this link", so the buttons name only the channel (screen readers hear the full action). */
export function ShareBox({ url, text, subject }: { url: string; text: string; subject: string }) {
  const mounted = useMounted();
  const canShare = mounted && typeof navigator.share === "function";
  return (
    <section aria-labelledby="share-title" className="space-y-4 rounded-lg border-2 border-fg p-5">
      <h2 id="share-title" className="font-display text-card font-bold">
        Send this link to your tenant
      </h2>
      <CopyField label="Deposit link" value={url} />
      <div className={cx("grid gap-2", canShare ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <ButtonLink href={whatsappUrl(`${text} ${url}`)} external variant="secondary" fullWidth>
          <span>
            <span className="sr-only">Share on </span>WhatsApp
          </span>
        </ButtonLink>
        <a href={emailUrl(subject, `${text}\n\n${url}`)} className={buttonClass({ variant: "secondary", fullWidth: true })}>
          <Icon name="mail" size={18} />
          <span>
            <span className="sr-only">Share by </span>Email
          </span>
        </a>
        {canShare && (
          <Button variant="secondary" fullWidth onClick={() => void navigator.share({ text, url }).catch(() => undefined)}>
            <Icon name="share" size={18} />
            <span>
              More<span className="sr-only"> ways to share</span>
            </span>
          </Button>
        )}
      </div>
    </section>
  );
}
