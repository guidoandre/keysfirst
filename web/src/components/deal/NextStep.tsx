"use client";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { LoginButton } from "@/components/wallet/LoginButton";
import { actionLabel, loginLabel, type NextStepView } from "@/lib/deal-view";
import { explorerTx } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";

/** Card payment for the tenant-to-be whose balance doesn't cover the deposit (spec §4.3). */
export interface CardOffer {
  /** The price with a card issued in Europe; other cards pay a little more (the breakdown says how much). */
  total: string;
  breakdown: string;
}

/** One primary action for this viewer right now; secondary actions below; errors and receipts inline. */
export function NextStep({
  view,
  role,
  amount,
  connected,
  settled,
  paid = false,
  busy,
  error,
  signature,
  onAction,
  card = null,
  cardBusy = false,
  onPayByCard,
}: {
  view: NextStepView;
  role: Role;
  amount: string;
  connected: boolean;
  /** True once the deal is released, returned or cancelled: nobody has anything left to do. */
  settled: boolean;
  /** True while the deposit is locked: a visitor then is someone other than the landlord and the tenant. */
  paid?: boolean;
  busy: Action | null;
  error: string | null;
  signature: string | null;
  onAction: (action: Action) => void;
  card?: CardOffer | null;
  cardBusy?: boolean;
  onPayByCard?: () => void;
}) {
  const { primary, secondary } = view;
  return (
    <section aria-labelledby="next-step" className="space-y-4 rounded-lg bg-subtle p-5">
      <h2 id="next-step" className="label text-fg-muted">
        {role === "visitor" ? "What happens next" : "Your next step"}
      </h2>
      <p className="text-body">{view.message}</p>

      {/* The tenant is about to pay: nudge them to compare the deposit with the rent in their contract (deposit caps differ by country). */}
      {primary === "fund" && (
        <Callout tone="neutral" title="Check the amount first">
          By law a deposit is at most 1 to 3 months&apos; rent, depending on the country. Compare it with the rent in your contract before you pay.{" "}
          <a href="/faq#law" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            Deposit rules by country
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Callout>
      )}

      {/* Logged out with nothing to tap: the landlord and the tenant only see their buttons once logged in.
          The button opens the Privy login (email or Google; Phantom stays optional). */}
      {!connected && !primary && !settled && <LoginButton label="Log in to see your options" variant="secondary" fullWidth />}

      {/* Logged in, but not as this deal's landlord or tenant (e.g. email today, Google when paying): say so instead of a dead end. */}
      {connected && role === "visitor" && paid && !primary && (
        <p className="text-sm text-fg-muted">
          This account isn&apos;t part of this deal. If you&apos;re its landlord or tenant, log out from the account menu and log in the
          way you did when you created or paid it.
        </p>
      )}

      {primary &&
        (connected ? (
          primary === "fund" && card && onPayByCard && busy !== "fund" ? (
            <div className="space-y-2">
              <Button size="lg" fullWidth loading={cardBusy} loadingText="Opening the card payment…" disabled={busy !== null || cardBusy} onClick={onPayByCard}>
                Pay from {card.total} by card
              </Button>
              <p className="text-sm text-fg-muted">{card.breakdown}</p>
            </div>
          ) : (
            <Button
              size="lg"
              fullWidth
              loading={busy === primary}
              loadingText={primary === "fund" ? "Locking your deposit…" : "Confirming…"}
              disabled={busy !== null}
              onClick={() => onAction(primary)}
            >
              {actionLabel(primary, role, amount)}
            </Button>
          )
        ) : (
          <LoginButton label={loginLabel(primary)} variant="primary" size="lg" fullWidth />
        ))}

      {secondary.length > 0 && (
        <div className="grid gap-2">
          {secondary.map((action) => (
            <Button
              key={action}
              variant={action === "cancel" ? "danger" : "secondary"}
              fullWidth
              loading={busy === action}
              loadingText="Confirming…"
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
