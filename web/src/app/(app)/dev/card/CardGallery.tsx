"use client";

import { useState } from "react";
import { Callout } from "@/components/ui/Callout";
import { CardPayment } from "@/components/wallet/CardPayment";

export function CardGallery({ deal, account }: { deal: string; account: string }) {
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [...l, line]);
  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-8">
      <h1 className="font-display text-title font-bold">Card form</h1>
      {deal && account ? (
        <CardPayment
          dealId={deal}
          account={account}
          depositCents={60_000}
          onBusy={() => undefined}
          onStarted={(payment) => add(`started ${payment}`)}
          onPaid={(payment) => add(`paid ${payment}`)}
        />
      ) : (
        <Callout tone="neutral">Add ?deal=…&amp;account=… (an open €600 deal and a tenant account).</Callout>
      )}
      <pre className="text-sm" data-testid="log">{log.join("\n")}</pre>
    </div>
  );
}
