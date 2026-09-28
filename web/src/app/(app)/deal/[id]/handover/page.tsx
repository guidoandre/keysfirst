import { Connection, PublicKey } from "@solana/web3.js";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { RPC_URL } from "@/lib/config";
import { cx } from "@/lib/cx";
import { toDealData } from "@/lib/deal-data";
import type { DealData } from "@/lib/deal-view";
import { formatEur, formatShortDateTime } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { handoverOpensAt } from "@/lib/rules";
import { withTimeout } from "@/lib/timeout";

export const metadata: Metadata = { title: "Confirm the key handover", robots: { index: false } };

// Rendered on the server, where the clock is UTC; the handover happens at a door in Germany.
const GERMAN_TIME = "Europe/Berlin";
const at = (unixSeconds: number) => `${formatShortDateTime(unixSeconds, GERMAN_TIME)} (German time)`;

const CHECKLIST = ["You are inside the room.", "You have the keys, or they are in front of you.", "Phantom is on the wallet that paid the deposit."];

/** The deal's address, or null when the link's id isn't an address at all (checked before any devnet read). */
function parseDealId(id: string): PublicKey | null {
  try {
    return new PublicKey(id);
  } catch {
    return null;
  }
}

/** `data` is undefined when devnet couldn't be reached: the page then works exactly as before (checklist + button). */
async function loadDeal(address: PublicKey): Promise<{ data: DealData | null | undefined; now: number }> {
  const now = Math.floor(Date.now() / 1000);
  try {
    // A hanging RPC would otherwise leave the tenant waiting at the door instead of reaching the checklist fallback below.
    const deal = await withTimeout(getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(address), 3_000);
    return { data: deal ? toDealData(deal) : null, now };
  } catch {
    return { data: undefined, now };
  }
}

/** Why this deal can't be released from here right now; null when the tenant may approve. */
function blocker(d: DealData, now: number): string | null {
  switch (d.status) {
    case "funded":
      if (now < handoverOpensAt(d)) return `The handover opens ${at(handoverOpensAt(d))}. Come back then, standing in the room.`;
      if (now > d.deadline) return "The handover deadline has passed, so the deposit goes back to you.";
      return null;
    case "open":
      return "Nobody has paid this deposit yet, so there is nothing to release.";
    case "released":
      return `This deposit was already released to the landlord on ${at(d.settledAt)}.`;
    case "refunded":
      return `This deposit already came back to you on ${at(d.settledAt)}.`;
    case "cancelled":
      return "The landlord cancelled this deal.";
  }
}

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solanaPayUrl = `solana:${await getOrigin()}/api/handover/${id}`;
  const address = parseDealId(id);
  const { data, now } = address ? await loadDeal(address) : { data: undefined, now: 0 };
  const blocked = !address
    ? "This isn't a valid deal link. Check that you copied the whole link."
    : data === null
      ? "We can't find this deal. Ask the landlord for the deal link."
      : data
        ? blocker(data, now)
        : null;

  return (
    <div className="mx-auto max-w-app px-4 py-8 sm:py-12">
      <p className="label text-fg-muted">Key handover</p>
      <h1 className="mt-2 font-display text-title font-bold">Confirm the key handover</h1>
      {data && (
        <p className="mt-3 text-lead text-fg-muted">
          <span className="font-semibold text-fg tabular-nums">{formatEur(data.amount)}</span> · {data.title}
        </p>
      )}

      {blocked ? (
        <div className="mt-6 space-y-4">
          <Callout tone="neutral" role="status">
            {blocked}
          </Callout>
          {/* An invalid id has no deal page to open (it would only repeat this message). */}
          {address && (
            <Link href={`/deal/${id}`} className={buttonClass({ variant: "secondary", fullWidth: true })}>
              Open the deal page
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-3">
                <Icon name="check" size={20} className="mt-0.5 shrink-0 text-released" />
                <span className="text-body">{item}</span>
              </li>
            ))}
          </ul>
          <a href={solanaPayUrl} className={cx(buttonClass({ size: "lg", fullWidth: true }), "mt-8")}>
            Approve in Phantom
          </a>
          <p className="mt-3 text-center text-sm text-fg-muted">Approving pays the landlord immediately. Only continue with the keys in hand.</p>
          <Callout tone="info" className="mt-6" title="Use the wallet that paid">
            Phantom must be on the wallet that paid the deposit. With any other wallet, Phantom only says it could not load the request: switch
            wallets in Phantom and tap the button again.
          </Callout>
          <p className="mt-4 text-sm text-fg-muted">
            Approve within a minute: the request expires quickly. If it does, tap the button again for a fresh one.
          </p>
          <p className="mt-6">
            <Link href={`/deal/${id}`} className={buttonClass({ variant: "quiet" })}>
              Open the deal page instead
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
