import { getOrigin } from "@/lib/origin";

/**
 * The QR on /spike points here with a plain https URL, because the iPhone Camera
 * cannot open `solana:` codes. This page hands the request to the wallet with one tap.
 */
export default async function SpikeGoPage() {
  const solanaPayUrl = `solana:${await getOrigin()}/api/spike`;
  return (
    <main className="mx-auto max-w-md space-y-5 p-6 text-center">
      <h1 className="text-2xl font-semibold">Approve in your wallet</h1>
      <p className="text-sm text-stone-400">
        Tap the button, check the request in Phantom and approve it within a minute.
      </p>
      <a
        href={solanaPayUrl}
        className="block rounded-xl bg-violet-600 px-4 py-4 text-lg font-semibold text-white"
      >
        Open in Phantom
      </a>
      <p className="text-xs text-stone-500">
        Nothing happens? Make sure Phantom is installed and set to Solana Devnet (Settings → Developer Settings).
      </p>
    </main>
  );
}
