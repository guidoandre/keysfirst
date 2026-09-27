import { getOrigin } from "@/lib/origin";
import { SpikeQr } from "./SpikeQr";

export default async function SpikePage() {
  const url = `solana:${await getOrigin()}/api/spike`;
  return (
    <main className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Solana Pay spike</h1>
      <p className="text-sm">Phantom mobile → Testnet Mode on (Solana Devnet) → scan this code.</p>
      <SpikeQr value={url} />
      <p className="break-all font-mono text-xs text-stone-500">{url}</p>
      <a href={url} className="inline-block rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white">
        On the phone? Tap to open in your wallet
      </a>
    </main>
  );
}
