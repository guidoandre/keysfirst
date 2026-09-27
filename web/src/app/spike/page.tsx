import { getOrigin } from "@/lib/origin";
import { SpikeQr } from "./SpikeQr";

export default async function SpikePage() {
  const origin = await getOrigin();
  // https link: any phone camera opens it; the page then hands off to the wallet.
  const cameraUrl = `${origin}/spike/go`;
  // Raw Solana Pay link: for wallet scanners that understand `solana:` codes.
  const solanaPayUrl = `solana:${origin}/api/spike`;
  return (
    <main className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Solana Pay spike</h1>
      <p className="text-sm">Scan with the phone camera, then tap “Open in Phantom”.</p>
      <SpikeQr value={cameraUrl} />
      <p className="break-all font-mono text-xs text-stone-500">{cameraUrl}</p>
      <details className="text-left text-sm text-stone-400">
        <summary className="cursor-pointer">Scanning from inside a wallet instead?</summary>
        <div className="mt-3 space-y-2 text-center">
          <SpikeQr value={solanaPayUrl} />
          <p className="break-all font-mono text-xs">{solanaPayUrl}</p>
        </div>
      </details>
      <a href={solanaPayUrl} className="inline-block rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white">
        On the phone? Tap to open in your wallet
      </a>
    </main>
  );
}
