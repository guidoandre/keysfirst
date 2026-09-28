"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DealLoading, DealMessage } from "@/components/deal/DealStates";
import { DealView } from "@/components/deal/DealView";
import { ReleasedScreen } from "@/components/deal/ReleasedScreen";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toDealData } from "@/lib/deal-data";
import { confirmCopy, showReleasedScreen } from "@/lib/deal-view";
import { formatEur } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cancelDealIx, confirmHandoverIx, fundIx, refundIx } from "@/lib/instructions";
import { getProgram } from "@/lib/program";
import { isExpired, roleOf, STATUS_LABEL, statusOf, type Action, type DealStatus, type DealTimes } from "@/lib/rules";
import { friendlyError, signAndSend } from "@/lib/send";
import { useDeal } from "@/lib/use-deal";

// The QR library loads only when the landlord first opens handover mode (spec §10).
const HandoverMode = dynamic(() => import("@/components/deal/HandoverMode").then((m) => m.HandoverMode), { ssr: false });

type WalletAction = Exclude<Action, "showQr">;

// The status each action needs; checked against the live deal right before the wallet signs.
const REQUIRED_STATUS: Record<WalletAction, DealStatus> = { fund: "open", confirmInApp: "funded", refund: "funded", cancel: "open" };

export function DealClient({ id, origin, created }: { id: string; origin: string; created: boolean }) {
  const { connection } = useConnection();
  const wallet = useWallet();
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

  if (!address) {
    return <DealMessage title="This isn't a valid deal link">Check that you copied the whole link.</DealMessage>;
  }
  if (deal === undefined || now === 0) return <DealLoading loadError={loadError} />;
  if (deal === null) {
    return (
      <DealMessage
        title="We can't find this deal"
        action={
          <Button variant="secondary" onClick={() => void refresh()}>
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
        setError(`This deal is already “${STATUS_LABEL[liveStatus]}”. The page has been updated.`);
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
      setError(friendlyError(e));
    } finally {
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
        busy={busy}
        error={error}
        signature={signature}
        onAction={onAction}
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
