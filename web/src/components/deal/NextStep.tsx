"use client";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { actionLabel, loginLabel, type NextStepView } from "@/lib/deal-view";
import { explorerTx } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";

/** One primary action for this viewer right now; secondary actions below; errors and receipts inline. */
export function NextStep({
  view,
  role,
  amount,
  connected,
  settled,
  busy,
  error,
  signature,
  onAction,
}: {
  view: NextStepView;
  role: Role;
  amount: string;
  connected: boolean;
  /** True once the deal is released, returned or cancelled: nobody has anything left to do. */
  settled: boolean;
  busy: Action | null;
  error: string | null;
  signature: string | null;
  onAction: (action: Action) => void;
}) {
  const { primary, secondary } = view;
  return (
    <section aria-labelledby="next-step" className="space-y-4 rounded-lg bg-subtle p-5">
      <h2 id="next-step" className="label text-fg-muted">
        {role === "visitor" ? "What happens next" : "Your next step"}
      </h2>
      <p className="text-body">{view.message}</p>

      {/* Logged out with nothing to tap: the landlord and the tenant only see their buttons once logged in. */}
      {!connected && !primary && !settled && (
        <div className="space-y-3">
          <LoginButton label="Log in to see your options" variant="secondary" fullWidth />
          <OpenInPhantom />
        </div>
      )}

      {primary &&
        (connected ? (
          <Button
            size="lg"
            fullWidth
            loading={busy === primary}
            loadingText="Waiting for your wallet…"
            disabled={busy !== null}
            onClick={() => onAction(primary)}
          >
            {actionLabel(primary, role, amount)}
          </Button>
        ) : (
          <div className="space-y-3">
            <LoginButton label={loginLabel(primary)} variant="primary" size="lg" fullWidth />
            <OpenInPhantom />
          </div>
        ))}

      {primary === "fund" && connected && <TestFundsButton />}

      {secondary.length > 0 && (
        <div className="grid gap-2">
          {secondary.map((action) => (
            <Button
              key={action}
              variant={action === "cancel" ? "danger" : "secondary"}
              fullWidth
              loading={busy === action}
              loadingText="Waiting for your wallet…"
              disabled={busy !== null}
              onClick={() => onAction(action)}
            >
              {actionLabel(action, role, amount)}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      )}
      {signature && (
        <Callout tone="success" role="status">
          Done.{" "}
          <a href={explorerTx(signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            View the receipt on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Callout>
      )}
    </section>
  );
}
