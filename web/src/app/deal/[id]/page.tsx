import type { Metadata } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { DealClient } from "./DealClient";

type Props = { params: Promise<{ id: string }> };

const DESCRIPTION =
  "Protected by Keysfirst: the landlord gets the deposit only when you scan their QR code at the key handover.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const deal = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id));
    if (!deal) return { title: "Keysfirst deal" };
    const title = `${formatEur(deal.amount.toString())} deposit · ${deal.title}`;
    // Next merges metadata shallowly: setting openGraph here drops the root's image unless we repeat it.
    const images = [{ url: "/opengraph-image", width: 1200, height: 630 }];
    return { title, description: DESCRIPTION, openGraph: { title, description: DESCRIPTION, images } };
  } catch {
    return { title: "Keysfirst deal" };
  }
}

export default async function DealPage({ params }: Props) {
  const { id } = await params;
  return <DealClient id={id} origin={await getOrigin()} />;
}
