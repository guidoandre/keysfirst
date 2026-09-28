import type { Metadata } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { DealClient } from "./DealClient";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

const DESCRIPTION =
  "Protected by Keysfirst: the landlord gets the deposit only when you scan their QR code at the key handover.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const deal = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id));
    if (!deal) return { title: "Deal not found", robots: { index: false } };
    const title = `${formatEur(deal.amount.toString())} deposit · ${deal.title}`;
    // No openGraph here: an explicit images list would override the deal's opengraph-image file.
    return { title, description: DESCRIPTION, robots: { index: false } };
  } catch {
    return { title: "Deal", robots: { index: false } };
  }
}

export default async function DealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  return <DealClient id={id} origin={await getOrigin()} created={created === "1"} />;
}
