"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Icon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

export function ShareBox({ url, text }: { url: string; text: string }) {
  const mounted = useMounted();
  const canShare = mounted && typeof navigator.share === "function";
  return (
    <section aria-labelledby="share-title" className="space-y-4 rounded-lg border-2 border-fg p-5">
      <h2 id="share-title" className="font-display text-card font-bold">
        Send this link to your tenant
      </h2>
      <CopyField label="Deposit link" value={url} />
      <div className="grid gap-2 sm:grid-cols-2">
        <ButtonLink href={whatsappUrl(`${text} ${url}`)} external variant="secondary" fullWidth>
          Share on WhatsApp
        </ButtonLink>
        {canShare && (
          <Button variant="secondary" fullWidth onClick={() => void navigator.share({ text, url }).catch(() => undefined)}>
            <Icon name="share" size={18} />
            More ways to share
          </Button>
        )}
      </div>
    </section>
  );
}
