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
    </main>
  );
}
