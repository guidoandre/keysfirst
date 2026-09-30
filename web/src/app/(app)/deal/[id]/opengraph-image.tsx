import { Connection, PublicKey } from "@solana/web3.js";
import { SERVER_RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";
import { fetchDeal, getProgram } from "@/lib/program";
import { STATUS_LABEL, statusOf } from "@/lib/rules";
import { withTimeout } from "@/lib/timeout";

export const alt = "A Keysfirst deposit link";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const SUBTITLE = "Protected by Keysfirst: the landlord is paid only when the tenant confirms the key handover.";

/** WhatsApp and Telegram previews of a deal link: amount, room and status. */
export default async function DealImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // A hanging RPC would otherwise hang the link preview instead of falling back to the generic card below.
    const deal = await withTimeout(fetchDeal(getProgram(new Connection(SERVER_RPC_URL, "confirmed")), new PublicKey(id)), 3_000);
    if (deal) {
      return ogCard({
        kicker: STATUS_LABEL[statusOf(deal.status)],
        title: `${formatEur(deal.amount.toString())} deposit · ${deal.title}`,
        subtitle: SUBTITLE,
      });
    }
  } catch {
    // Unreadable address, timeout, or devnet unreachable: fall back to the generic card below.
  }
  return ogCard({ title: "A Keysfirst deposit link", subtitle: SUBTITLE });
}
