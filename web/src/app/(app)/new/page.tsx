"use client";

import { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { parseEur, toLocalInputValue } from "@/lib/format";
import { createDealIx, randomDealId } from "@/lib/instructions";
import { getProgram } from "@/lib/program";
import { MAX_HANDOVER_WINDOW } from "@/lib/rules";
import { friendlyError, signAndSend } from "@/lib/send";

const WINDOWS = [
  { label: "1 day after move-in", seconds: 86_400 },
  { label: "3 days after move-in", seconds: 3 * 86_400 },
  { label: "7 days after move-in", seconds: 7 * 86_400 },
  { label: "14 days after move-in", seconds: MAX_HANDOVER_WINDOW },
  { label: "5 minutes (demo only)", seconds: 300 },
];

export default function NewDealPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const program = useMemo(() => getProgram(connection), [connection]);
  const [title, setTitle] = useState("Room in Vallendar");
  const [amount, setAmount] = useState("600");
  const [moveIn, setMoveIn] = useState("");
  const [windowSeconds, setWindowSeconds] = useState(3 * 86_400);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsedAmount = parseEur(amount);
    const cleanTitle = title.trim();
    const titleBytes = new TextEncoder().encode(cleanTitle).length;
    const moveInSeconds = Math.floor(new Date(moveIn).getTime() / 1000);
    if (!wallet.publicKey) return setError("Connect your wallet first.");
    if (!parsedAmount) return setError("Enter the deposit in euros, for example 600 or 600.50.");
    if (titleBytes === 0 || titleBytes > 64) return setError("Describe the room in 1 to 64 characters.");
    if (!Number.isFinite(moveInSeconds)) return setError("Pick the move-in date and time.");
    const deadline = moveInSeconds + windowSeconds;
    if (deadline <= Math.floor(Date.now() / 1000)) {
      return setError("That handover deadline is already in the past. Pick a later move-in or a longer window.");
    }

    setBusy(true);
    try {
      const { ix, address } = await createDealIx(program, wallet.publicKey, {
        dealId: randomDealId(),
        amount: new BN(parsedAmount.toString()),
        moveIn: new BN(moveInSeconds),
        deadline: new BN(deadline),
        title: cleanTitle,
      });
      await signAndSend(connection, wallet, [ix]);
      router.push(`/deal/${address.toBase58()}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Create a deposit link</h1>
        <p className="mt-1 text-sm text-stone-600">
          For landlords. Your tenant pays into a lock; you receive the money when they scan your QR code at the key handover.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Room
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={64}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Deposit (€)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Move-in
        <div className="mt-1 flex gap-2">
          <input type="datetime-local" value={moveIn} onChange={(e) => setMoveIn(e.target.value)}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2" />
          <button type="button" onClick={() => setMoveIn(toLocalInputValue(new Date()))}
            className="rounded-lg border border-stone-300 px-3 py-2">
            Now
          </button>
        </div>
      </label>
      <label className="block text-sm font-medium">
        Latest handover
        <select value={windowSeconds} onChange={(e) => setWindowSeconds(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2">
          {WINDOWS.map((w) => (
            <option key={w.seconds} value={w.seconds}>{w.label}</option>
          ))}
        </select>
        <span className="mt-1 block font-normal text-stone-500">
          If the tenant hasn&apos;t scanned your QR code by then, the deposit goes back to them automatically.
        </span>
      </label>
      {wallet.publicKey ? (
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-emerald-700 px-4 py-4 text-lg font-semibold text-white disabled:opacity-50">
          {busy ? "Waiting for your wallet…" : "Create deposit link"}
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-3 text-sm text-stone-600">Connect your Phantom wallet (set to Solana Devnet) to continue.</p>
          <div className="flex justify-center"><LoginButton /></div>
          <OpenInPhantom />
        </div>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </form>
  );
}
