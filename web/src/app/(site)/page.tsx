import Link from "next/link";

const STEPS = [
  ["The landlord creates a deposit link", "…and sends it to you on WhatsApp, WG-Gesucht or wherever you found the room."],
  ["You pay the deposit into a lock", "Nobody controls it: not the landlord, not you, not us. Only the rules below can move it."],
  ["At the door, you scan the landlord's QR code", "Check the room first. Scanning pays the landlord instantly, then you get the keys."],
  ["No handover? The money comes back", "If you never scan, the deposit returns to you automatically after the deadline."],
];

export default function Home() {
  return (
    <div className="space-y-10 pt-4">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight">The deposit moves only when the keys do.</h1>
        <p className="text-lg text-stone-700">
          Renting a room in Germany before you arrive? Keysfirst locks the deposit until the key handover. The landlord
          is paid the moment you scan their QR code at the door. No handover, no money.
        </p>
        <Link href="/new" className="inline-block rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">
          Create a deposit link (landlords)
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="space-y-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-stone-600">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Why this exists</h2>
        <p>
          Fake landlords target students who rent from abroad: they post a room, ask for the deposit before any viewing,
          and disappear. Booking platforms protect only their own listings.
        </p>
        <p>
          German law doesn&apos;t even require the deposit before you move in: under §551(2) BGB the tenant may pay it
          in three monthly instalments, the first due when the tenancy starts. Keysfirst works for any listing, from a
          Facebook group to a friend&apos;s sublet. If a &ldquo;landlord&rdquo; refuses to use it, that&apos;s your red flag.
        </p>
      </section>

      <section className="space-y-3 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Why Solana</h2>
        <p>
          Payment is final in about a second and can&apos;t be reversed, so the landlord can safely hand over the keys
          the moment their screen turns green. The rules live in a public program on Solana: nobody, including
          Keysfirst, can take the money. It only ever goes to the tenant or the landlord.
        </p>
      </section>

      <section className="space-y-3 rounded-lg bg-subtle p-5 text-sm">
        <h2 className="text-lg font-semibold">Try it (test money only)</h2>
        <p>
          <Link href="/deals?login=1" className="underline">Log in</Link> with Phantom set to Solana Devnet, then use Get test funds in the wallet menu.
        </p>
      </section>
    </div>
  );
}
