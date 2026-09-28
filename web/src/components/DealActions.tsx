"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { explorerTx, formatEur } from "@/lib/format";
import { cancelDealIx, confirmHandoverIx, fundIx, refundIx } from "@/lib/instructions";
import { getProgram, type DealAccount } from "@/lib/program";
import { STATUS_LABEL, statusOf, type Action, type DealStatus, type Role } from "@/lib/rules";
import { friendlyError, signAndSend } from "@/lib/send";
import { LoginButton } from "./wallet/LoginButton";
import { OpenInPhantom } from "./wallet/OpenInPhantom";
import { TestFundsButton } from "./wallet/TestFundsButton";

type ButtonAction = Exclude<Action, "showQr">;

const REQUIRED_STATUS: Record<ButtonAction, DealStatus> = {
  fund: "open",
  confirmInApp: "funded",
  refund: "funded",
  cancel: "open",
};

export function DealActions({
  address, deal, status, role, actions, onDone,
}: {
  address: PublicKey;
  deal: DealAccount;
  status: DealStatus;
  role: Role;
  actions: Action[];
  onDone: () => Promise<void>;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useMemo(() => getProgram(connection), [connection]);
  const [busy, setBusy] = useState<ButtonAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const amount = formatEur(deal.amount.toString());
  const buttons = actions.filter((a): a is ButtonAction => a !== "showQr");

  const labels: Record<ButtonAction, string> = {
    fund: `Pay ${amount} into the lock`,
    confirmInApp: "I have the keys: release the deposit",
    refund: role === "landlord" ? "Give the deposit back to the tenant" : "Return the deposit to the tenant",
    cancel: "Cancel this deal",
  };

  if (!wallet.publicKey) {
    if (status !== "open" && status !== "funded") return null;
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-5 text-center">
        <p className="mb-3 text-sm text-stone-700">Connect your Phantom wallet (set to Solana Devnet) to continue.</p>
        <div className="flex justify-center"><LoginButton /></div>
        <OpenInPhantom />
      </section>
    );
  }
  const me = wallet.publicKey;

  async function run(action: ButtonAction) {
    if (action === "confirmInApp" && !window.confirm(
      `Only continue if you are holding the keys. ${amount} goes to the landlord immediately and cannot be reversed.`,
    )) return;
    if (action === "cancel" && !window.confirm("Cancel this deal? The link will stop working.")) return;

    const build: Record<ButtonAction, () => Promise<TransactionInstruction>> = {
      fund: () => fundIx(program, address, me, deal),
      confirmInApp: () => confirmHandoverIx(program, address, deal),
      refund: () => refundIx(program, address, deal, me),
      cancel: () => cancelDealIx(program, address, deal),
    };
    setBusy(action);
    setError(null);
    setSignature(null);
    try {
      // A page that sat in the background (e.g. while the tenant scanned the QR) can show a button
      // the deal no longer allows; check the live status before asking the wallet to sign.
      const live = statusOf((await program.account.deal.fetch(address)).status);
      if (live !== REQUIRED_STATUS[action]) {
        await onDone();
        setError(`This deal is already “${STATUS_LABEL[live]}”. The page has been updated.`);
        return;
      }
      setSignature(await signAndSend(connection, wallet, [await build[action]()]));
      await onDone();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  if (buttons.length === 0 && !error && !signature) return null;
  return (
    <section className="space-y-3">
      {buttons.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => run(action)}
          disabled={busy !== null}
          className={`w-full rounded-xl px-4 py-4 text-lg font-semibold disabled:opacity-50 ${
            action === "cancel" ? "border border-stone-300 bg-white text-stone-700" : "bg-emerald-700 text-white"
          }`}
        >
          {busy === action ? "Waiting for your wallet…" : labels[action]}
        </button>
      ))}
      {buttons.includes("fund") && <TestFundsButton />}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {signature && (
        <a className="block text-center text-sm text-emerald-800 underline" href={explorerTx(signature)} target="_blank" rel="noreferrer">
          Done. View the transaction on Solana Explorer
        </a>
      )}
    </section>
  );
}
