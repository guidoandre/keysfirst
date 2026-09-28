"use client";

import { useAccount } from "@/components/wallet/AccountProvider";
import { useConnection } from "@/lib/connection";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DealLoading, DealMessage } from "@/components/deal/DealStates";
import { DealView } from "@/components/deal/DealView";
import type { CardOffer } from "@/components/deal/NextStep";
import { ReleasedScreen } from "@/components/deal/ReleasedScreen";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardResume, pendingKey } from "@/components/wallet/CardResume";
import { toDealData } from "@/lib/deal-data";
import { confirmCopy, showReleasedScreen, statusLabel } from "@/lib/deal-view";
import { formatEur, fromCents, toCents } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cancelDealIx, confirmHandoverIx, fundIx, refundIx } from "@/lib/instructions";
import { feePercent, priceBreakdown } from "@/lib/pricing";
import { getProgram } from "@/lib/program";
import { isExpired, roleOf, statusOf, type Action, type DealStatus, type DealTimes } from "@/lib/rules";
import { friendlyError, needsTopUp, signAndSend } from "@/lib/send";
import { useDeal } from "@/lib/use-deal";

// The QR library loads only when the landlord first opens handover mode (spec §10).
const HandoverMode = dynamic(() => import("@/components/deal/HandoverMode").then((m) => m.HandoverMode), { ssr: false });

type WalletAction = Exclude<Action, "showQr">;

// The status each action needs; checked against the live deal right before the wallet signs.
const REQUIRED_STATUS: Record<WalletAction, DealStatus> = { fund: "open", confirmInApp: "funded", refund: "funded", cancel: "open" };

export function DealClient({ id, origin, created, paid }: { id: string; origin: string; created: boolean; paid: string | null }) {
  const { connection } = useConnection();
  const { wallet, topUp, refreshBalance, balance } = useAccount();
  const program = useMemo(() => getProgram(connection), [connection]);
  const { address, deal, signatures, loadError, statusChanged, justReleased, refresh } = useDeal(id);
  const now = useNow();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<WalletAction | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverUsed, setHandoverUsed] = useState(false);
  // Set only by the landlord dismissing the Released screen ("Back to the deal" or Esc): Sheet calls onClose for those alone.
  const [releasedClosed, setReleasedClosed] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  // The Stripe session to finish: from ?paid=, or remembered from before a closed tab (read after mount).
  const [pending, setPending] = useState<string | null>(paid);
  // A resume that failed keeps its session (the card button stays hidden); "Try again" remounts CardResume.
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeKey, setResumeKey] = useState(0);
  const [cardDone, setCardDone] = useState<string | null>(null);

  useEffect(() => {
    if (paid) return;
    const timer = setTimeout(() => {
      try {
        setPending(localStorage.getItem(pendingKey(id)));
      } catch {
        // Storage blocked: only ?paid= can resume.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id, paid]);

  // Back from Stripe through the back/forward cache: the page comes back as it was left (card button spinning,
  // no pending session). Stop the spinner and pick up the session saved before leaving.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setCardBusy(false);
      try {
        const saved = localStorage.getItem(pendingKey(id));
        if (saved) setPending(saved);
      } catch {
        // Storage blocked: nothing to pick up.
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [id]);

  // The deal moved on (released, refunded, locked…), possibly by the other side: the balance may have changed too.
  const dealStatus = deal ? statusOf(deal.status) : null;
  useEffect(() => {
    if (!dealStatus) return;
    const timer = setTimeout(() => void refreshBalance(), 0);
    return () => clearTimeout(timer);
  }, [dealStatus, refreshBalance]);

  if (!address) {
    return <DealMessage title="This isn't a valid deal link">Check that you copied the whole link.</DealMessage>;
  }
  if (deal === undefined || now === 0) return <DealLoading loadError={loadError} />;
  if (deal === null) {
    return (
      <DealMessage
        title="We can't find this deal"
        action={
          <Button variant="secondary" onClick={() => refresh().catch(() => undefined)}>
            Try again
          </Button>
        }
      >
        If it was just created, wait a few seconds and try again.
      </DealMessage>
    );
  }

  const data = toDealData(deal);
  const me = wallet.publicKey;
  const role = roleOf(data.landlord, data.tenant, me?.toBase58());
  const amount = formatEur(data.amount);
  const times: DealTimes = { moveIn: data.moveIn, deadline: data.deadline };
  const expired = isExpired(times, now);
  const depositUnits = BigInt(data.amount);
  const price = priceBreakdown(toCents(data.amount), "card");
  // The tenant-to-be pays by card unless their balance already covers the deposit (spec §4.3).
  const card: CardOffer | null =
    data.status === "open" && role !== "landlord" && !pending && !resumeError && (balance === null || balance < depositUnits)
      ? {
          total: formatEur(fromCents(price.totalCents)),
          breakdown: `Deposit ${amount} + Keysfirst fee ${formatEur(fromCents(price.feeCents))} (${feePercent("card")}). The fee isn't refunded.`,
        }
      : null;

  async function payByCard() {
    if (!me) return;
    setCardBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal: id, account: me.toBase58() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error);
      try {
        // Never replace a session that is still waiting to be resolved.
        if (!localStorage.getItem(pendingKey(id))) localStorage.setItem(pendingKey(id), body.session);
      } catch {
        // Storage blocked: ?paid= on the way back still resumes.
      }
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Card payments are not available right now. Try again in a minute.");
      setCardBusy(false);
    }
  }

  async function execute(action: WalletAction) {
    if (!me || !address) return;
    setBusy(action);
    setError(null);
    setSignature(null);
    try {
      // A page that sat in the background (e.g. while the tenant scanned the QR) can show a button
      // the deal no longer allows; check the live status before asking the wallet to sign.
      const live = await program.account.deal.fetch(address);
      const liveStatus = statusOf(live.status);
      if (liveStatus !== REQUIRED_STATUS[action]) {
        await refresh();
        setError(`This deal is already “${statusLabel(liveStatus, role)}”. The page has been updated.`);
        return;
      }
      const build = {
        fund: () => fundIx(program, address, me, live),
        confirmInApp: () => confirmHandoverIx(program, address, live),
        refund: () => refundIx(program, address, live, me),
        cancel: () => cancelDealIx(program, address, live),
      };
      setSignature(await signAndSend(connection, wallet, [await build[action]()]));
      await refresh();
    } catch (e) {
      const message = friendlyError(e);
      if (needsTopUp(message)) void topUp();
      setError(message);
    } finally {
      void refreshBalance();
      setBusy(null);
    }
  }

  function onAction(action: Action) {
    if (action === "showQr") {
      setHandoverUsed(true); // mounts HandoverMode (and loads its chunk) the first time; it stays mounted so closing restores focus
      setHandoverOpen(true);
      return;
    }
    if (confirmCopy(action, role, amount, expired)) {
      setConfirming(action);
      return;
    }
    void execute(action);
  }

  const copy = confirming ? confirmCopy(confirming, role, amount, expired) : null;
  // The landlord sees the Released screen when the tenant approves during handover mode, or while this page is open.
  const showReleased = showReleasedScreen({ role, status: data.status, handoverOpen, justReleased, dismissed: releasedClosed });

  return (
    <>
      {pending && me && (
        <div className="mx-auto max-w-app space-y-3 px-4 pt-6">
          {resumeError ? (
            <>
              <Callout tone="danger" role="alert">
                {resumeError}
              </Callout>
              <Button
                variant="secondary"
                onClick={() => {
                  setResumeError(null);
                  setResumeKey((k) => k + 1);
                }}
              >
                Try again
              </Button>
            </>
          ) : (
            <CardResume
              key={resumeKey}
              session={pending}
              dealId={id}
              account={me}
              amount={depositUnits}
              lock={data.status === "open"}
              alreadyYours={data.status !== "open" && data.tenant === me.toBase58()}
              onReady={() => {
                setPending(null);
                void execute("fund");
              }}
              onDone={(message) => {
                setPending(null);
                setCardDone(message);
              }}
              onCancelled={() => setPending(null)}
              onError={setResumeError}
            />
          )}
        </div>
      )}
      {cardDone && (
        <div className="mx-auto max-w-app px-4 pt-6">
          <Callout tone="success" role="status">
            {cardDone}
          </Callout>
        </div>
      )}
      <DealView
        id={id}
        origin={origin}
        data={data}
        role={role}
        now={now}
        connected={me !== null}
        created={created}
        signatures={signatures}
        statusChanged={statusChanged}
        // While a card payment is being resumed, show "Locking your deposit…" instead of a live lock button.
        busy={pending && me && !resumeError ? "fund" : busy}
        error={error}
        signature={signature}
        onAction={onAction}
        card={card}
        cardBusy={cardBusy}
        onPayByCard={() => void payByCard()}
      />
      {handoverUsed && (
        <HandoverMode
          // Only while the code can still release the deposit: locked and before the deadline (live clock).
          open={handoverOpen && data.status === "funded" && !expired}
          onClose={() => setHandoverOpen(false)}
          dealId={id}
          origin={origin}
          title={data.title}
          amount={amount}
          deadline={data.deadline}
          now={now}
        />
      )}
      <ReleasedScreen
        open={showReleased}
        onClose={() => {
          setHandoverOpen(false);
          setReleasedClosed(true);
        }}
        title={data.title}
        amount={amount}
        settledAt={data.settledAt}
        receipt={signatures[2]}
      />
      <ConfirmDialog
        open={copy !== null}
        title={copy?.title ?? ""}
        body={copy?.body ?? ""}
        confirmLabel={copy?.confirm ?? ""}
        danger={copy?.danger}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const action = confirming;
          setConfirming(null);
          if (action) void execute(action);
        }}
      />
    </>
  );
}
