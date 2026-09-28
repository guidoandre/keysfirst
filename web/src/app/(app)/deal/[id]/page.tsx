import type { Metadata } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { withTimeout } from "@/lib/timeout";
import { DealClient } from "./DealClient";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

const DESCRIPTION =
  "Protected by Keysfirst: the landlord gets the deposit only when you confirm the key handover.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    // A hanging RPC would otherwise hold up the page's head (link-preview bots wait for it).
    const deal = await withTimeout(getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id)), 3_000);
    if (!deal) return { title: "Deal not found", robots: { index: false } };
    const title = `${formatEur(deal.amount.toString())} deposit · ${deal.title}`;
    // No openGraph here: an explicit images list would override the deal's opengraph-image file.
    return { title, description: DESCRIPTION, robots: { index: false } };
  } catch {
    // Unreadable address, timeout, or devnet unreachable: a generic title and description.
    return { title: "Deal", description: DESCRIPTION, robots: { index: false } };
  }
}

export default async function DealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  return <DealClient id={id} origin={await getOrigin()} created={created === "1"} />;
}
