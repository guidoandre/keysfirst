import { getOrigin } from "@/lib/origin";

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solanaPayUrl = `solana:${await getOrigin()}/api/handover/${id}`;
  return (
    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 text-center">
      <h1 className="text-2xl font-semibold">Confirm the key handover</h1>
      <p className="text-sm text-stone-600">
        Only continue if you have checked the room and are holding the keys. Approving pays the landlord immediately.
      </p>
      <a href={solanaPayUrl} className="block rounded-xl bg-violet-600 px-4 py-4 text-lg font-semibold text-white">
        Approve in Phantom
      </a>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Phantom must be on the wallet that paid the deposit. With any other wallet, Phantom only says it could not load
        the request: switch wallets in Phantom and tap the button again.
      </p>
      <p className="text-xs text-stone-500">
        Approve within a minute: the request expires quickly. If it does, tap the button again for a fresh one.
      </p>
    </div>
  );
}
