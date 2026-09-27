"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DealActions } from "@/components/DealActions";
import { HandoverQR } from "@/components/HandoverQR";
import { ShareLink } from "@/components/ShareLink";
import { Timeline } from "@/components/Timeline";
import { explorerAddress, formatDateTime, formatEur } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { dealSignatures, getProgram, type DealAccount } from "@/lib/program";
import {
  availableActions,
  handoverOpensAt,
  roleOf,
  STATUS_LABEL,
  statusOf,
  type DealStatus,
  type DealTimes,
  type Role,
} from "@/lib/rules";

const PILL: Record<DealStatus, string> = {
  open: "bg-stone-100 text-stone-700",
  funded: "bg-amber-100 text-amber-900",
  released: "bg-emerald-100 text-emerald-900",
  refunded: "bg-sky-100 text-sky-900",
  cancelled: "bg-stone-200 text-stone-600",
};

export function DealClient({ id, origin }: { id: string; origin: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useMemo(() => getProgram(connection), [connection]);
  const address = useMemo(() => {
    try {
      return new PublicKey(id);
    } catch {
      return null;
    }
  }, [id]);
  const [deal, setDeal] = useState<DealAccount | null | undefined>(undefined);
  const [signatures, setSignatures] = useState<string[]>([]);
  const now = useNow();

  const refresh = useCallback(async () => {
    if (!address) return;
    const [data, sigs] = await Promise.all([
      program.account.deal.fetchNullable(address),
      dealSignatures(connection, address),
    ]);
    setDeal(data);
    setSignatures(sigs);
  }, [address, connection, program]);

  // Poll so the landlord's screen flips to "Released" seconds after the tenant signs.
  useEffect(() => {
    const load = () => {
      refresh().catch(() => undefined);
    };
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 2_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  if (!address) return <Notice>This is not a valid deal link.</Notice>;
  if (deal === undefined || now === 0) return <Notice>Loading the deal…</Notice>;
  if (deal === null) return <Notice>Deal not found. If it was just created, wait a few seconds.</Notice>;

  const status = statusOf(deal.status);
  const times: DealTimes = { moveIn: deal.moveIn.toNumber(), deadline: deal.deadline.toNumber() };
  const role = roleOf(deal.landlord.toBase58(), deal.tenant.toBase58(), publicKey?.toBase58());
  const amount = formatEur(deal.amount.toString());
  const actions = availableActions(status, role, times, now);

  return (
    <div className="space-y-5">
      {status === "released" && role === "landlord" && (
        <div className="rounded-2xl bg-emerald-600 p-6 text-center text-white">
          <p className="text-3xl font-bold">Released ✓</p>
          <p className="mt-1">{amount} is in your wallet. Hand over the keys.</p>
        </div>
      )}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-stone-500">{deal.title}</p>
        <p className="mt-1 text-4xl font-semibold">{amount}</p>
        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Move-in</dt>
            <dd>{formatDateTime(times.moveIn)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Handover deadline</dt>
            <dd>{formatDateTime(times.deadline)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{explain(status, role, times, now, amount)}</p>
      </section>
      {actions.includes("showQr") && <HandoverQR dealId={id} origin={origin} />}
      <DealActions address={address} deal={deal} status={status} role={role} actions={actions} onDone={refresh} />
      {status === "open" && role === "landlord" && (
        <ShareLink url={`${origin}/deal/${id}`} text={`Pay the ${amount} deposit for "${deal.title}" safely with Keysfirst:`} />
      )}
      <Timeline status={status} deal={deal} signatures={signatures} />
      <a className="block text-center text-sm text-stone-500 underline" href={explorerAddress(id)} target="_blank" rel="noreferrer">
        View this deal on Solana Explorer
      </a>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-600">{children}</p>;
}

function explain(status: DealStatus, role: Role, d: DealTimes, now: number, amount: string): string {
  const deadline = formatDateTime(d.deadline);
  const opens = formatDateTime(handoverOpensAt(d));
  switch (status) {
    case "open":
      return role === "landlord"
        ? "Send the link below to your tenant. Once they pay, the deposit stays locked until the key handover."
        : `Pay ${amount} into a lock that nobody controls, not even Keysfirst. The landlord gets it only when you scan their QR code at the key handover. If you don't scan by ${deadline}, it comes back to you.`;
    case "funded":
      if (now > d.deadline) return "The deadline passed without a handover. Anyone can now return the deposit to the tenant.";
      if (role === "landlord") {
        return now < handoverOpensAt(d)
          ? `The deposit is locked. Your handover QR code appears here from ${opens}.`
          : "The deposit is locked. At the handover, show the QR code below. Hand over the keys only when this page says “Released”.";
      }
      if (role === "tenant") {
        return `Your deposit is locked. At the handover (from ${opens}) check the room, then scan the landlord's QR code with Phantom, only once you are holding the keys. No scan by ${deadline}? You get it back.`;
      }
      return `The deposit is locked until the key handover or ${deadline}.`;
    case "released":
      return "The tenant confirmed the key handover and the deposit went to the landlord.";
    case "refunded":
      return "The deposit went back to the tenant.";
    case "cancelled":
      return "The landlord cancelled this deal before any money was paid.";
  }
}
