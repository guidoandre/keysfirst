"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/config";
import { formatEur, fromCents } from "@/lib/format";
import { feePercent, priceBreakdown } from "@/lib/pricing";

const UNAVAILABLE = "Card payments are not available right now. Try again in a minute.";

// Loaded once, and only when a tenant opens the card form: the deal page stays light for everyone else.
let stripePromise: Promise<StripeJs | null> | null = null;
const getStripe = () => (stripePromise ??= STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : Promise.resolve(null));

/** The exact price for the entered card, from /api/checkout/quote. */
interface Quote {
  token: string;
  method: "card" | "cardIntl";
  depositCents: number;
  feeCents: number;
  totalCents: number;
  brand: string;
  last4: string;
  country: string | null;
}

async function post(url: string, body: object): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!res) return { ok: false, status: 0, body: {} };
  return { ok: res.ok, status: res.status, body: ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
}

const eur = (cents: number) => formatEur(fromCents(cents));
const countryName = (code: string | null) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * Card payment on the deal page (spec §4.3, D8): the tenant enters their card, sees the exact price for it (the fee
 * depends on where the card was issued: 3.5% in the EEA, 4.5% elsewhere) and pays exactly that. Nothing is charged
 * before they tap "Pay €…".
 */
export function CardPayment(props: {
  dealId: string;
  account: string;
  depositCents: number;
  /** The payment exists (before any bank check): remember it so a closed tab can still finish it. */
  onStarted: (payment: string) => void;
  /** Charged: the deal page turns it into the deposit (fulfil) and locks it. */
  onPaid: (payment: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  if (!STRIPE_PUBLISHABLE_KEY) return <Callout tone="danger">{UNAVAILABLE}</Callout>;
  return (
    <Elements
      stripe={getStripe()}
      options={{
        mode: "payment",
        // Only for Stripe's own display; the amount charged is decided on the server from the card.
        amount: priceBreakdown(props.depositCents, "card").totalCents,
        currency: "eur",
        allowedPaymentMethodTypes: ["card"],
        // The rest of the site is in English: keep Stripe's labels in English too, whatever the browser's language.
        locale: "en",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#16181d",
            colorText: "#16181d",
            colorTextSecondary: "#545b66",
            colorDanger: "#c0262d",
            borderRadius: "10px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      }}
    >
      <CardForm {...props} />
    </Elements>
  );
}

function CardForm({ dealId, account, depositCents, onStarted, onPaid, onBusy }: Parameters<typeof CardPayment>[0]) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusyState] = useState<"quote" | "pay" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eea = priceBreakdown(depositCents, "card");
  const intl = priceBreakdown(depositCents, "cardIntl");

  const setBusy = (value: "quote" | "pay" | null) => {
    setBusyState(value);
    onBusy(value !== null);
  };

  async function review(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy("quote");
    setError(null);
    try {
      const submitted = await elements.submit();
      if (submitted.error) {
        setError(submitted.error.message ?? "Check your card details.");
        return;
      }
      const { error: tokenError, confirmationToken } = await stripe.createConfirmationToken({ elements });
      if (tokenError || !confirmationToken) {
        setError(tokenError?.message ?? "Check your card details.");
        return;
      }
      const res = await post("/api/checkout/quote", { deal: dealId, account, token: confirmationToken.id });
      if (!res.ok) {
        setError(typeof res.body.error === "string" ? res.body.error : UNAVAILABLE);
        return;
      }
      setQuote({ ...(res.body as unknown as Omit<Quote, "token">), token: confirmationToken.id });
    } finally {
      setBusy(null);
    }
  }

  async function pay() {
    if (!stripe || !quote || busy) return;
    setBusy("pay");
    setError(null);
    try {
      const res = await post("/api/checkout/pay", { deal: dealId, account, token: quote.token, totalCents: quote.totalCents });
      const payment = typeof res.body.payment === "string" ? res.body.payment : null;
      if (!res.ok || !payment) {
        // A used or declined card entry can't be paid again: enter it again for a fresh price.
        setQuote(null);
        setError(typeof res.body.error === "string" ? res.body.error : UNAVAILABLE);
        return;
      }
      onStarted(payment);
      const clientSecret = typeof res.body.clientSecret === "string" ? res.body.clientSecret : null;
      if (clientSecret) {
        // The bank asks for a check (3-D Secure): Stripe shows it, then the payment is charged or refused.
        const { error: actionError, paymentIntent } = await stripe.handleNextAction({ clientSecret });
        if (actionError || paymentIntent?.status !== "succeeded") {
          setQuote(null);
          setError(actionError?.message ?? "Your bank didn't confirm the payment, so nothing was charged. Try again.");
          return;
        }
      }
      onPaid(payment);
    } finally {
      setBusy(null);
    }
  }

  const where = quote ? countryName(quote.country) : null;
  return (
    <form onSubmit={review} className="space-y-4">
      <p className="text-fg-muted">
        Deposit <span className="font-semibold text-fg tabular-nums">{eur(eea.depositCents)}</span> plus the Keysfirst fee:{" "}
        {feePercent("card")} with a card issued in Europe ({eur(eea.totalCents)} in total), {feePercent("cardIntl")} with other cards (
        {eur(intl.totalCents)}). You see your exact price before paying. The fee isn&apos;t refunded.
      </p>
      <PaymentElement
        options={{ wallets: { applePay: "never", googlePay: "never", link: "never" } }}
        onChange={(event) => {
          setComplete(event.complete);
          // Another card means another price: ask again.
          setQuote(null);
        }}
      />
      {quote ? (
        <div className="space-y-3">
          <div className="rounded-md border-2 border-fg p-4" role="status">
            <p className="text-sm text-fg-muted">
              {quote.brand.charAt(0).toUpperCase() + quote.brand.slice(1)} •••• {quote.last4}
              {where ? ` · issued in ${where}` : ""}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt>Deposit</dt>
                <dd className="tabular-nums">{eur(quote.depositCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  Keysfirst fee ({feePercent(quote.method)}, card issued {quote.method === "card" ? "in Europe" : "outside Europe"})
                </dt>
                <dd className="tabular-nums">{eur(quote.feeCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-rule pt-1.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{eur(quote.totalCents)}</dd>
              </div>
            </dl>
          </div>
          <Button type="button" size="lg" fullWidth loading={busy === "pay"} loadingText="Paying…" disabled={busy !== null} onClick={() => void pay()}>
            Pay {eur(quote.totalCents)}
          </Button>
        </div>
      ) : (
        <Button type="submit" size="lg" fullWidth loading={busy === "quote"} loadingText="Checking your card…" disabled={!stripe || !complete || busy !== null}>
          See my price
        </Button>
      )}
      {error && (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      )}
      <p className="text-sm text-fg-muted">
        Test mode, no real money: use <span className="tabular-nums">4000 0027 6000 0016</span> (a German card) or{" "}
        <span className="tabular-nums">4242 4242 4242 4242</span> (a US card), any future date and any CVC.
      </p>
    </form>
  );
}
