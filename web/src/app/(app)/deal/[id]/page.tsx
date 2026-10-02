import type { Metadata } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { SERVER_RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { fetchDeal, getProgram } from "@/lib/program";
import { withTimeout } from "@/lib/timeout";
import { DealClient } from "./DealClient";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string | string[];
    paid?: string | string[];
    handover?: string | string[];
    /** Added by Stripe when a bank check (3-D Secure) sends the tenant back. */
    payment_intent?: string | string[];
  }>;
};

const DESCRIPTION =
  "Protected by Keysfirst: the landlord gets the deposit only when you confirm the key handover.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    // A hanging RPC would otherwise hold up the page's head (link-preview bots wait for it).
    const deal = await withTimeout(fetchDeal(getProgram(new Connection(SERVER_RPC_URL, "confirmed")), new PublicKey(id)), 3_000);
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
  const { created, paid, handover, payment_intent } = await searchParams;
  // ?paid=cs_… from the old Stripe Checkout page, ?payment_intent=pi_… after a bank check on the card form.
  const payment = [paid, payment_intent].find((p): p is string => typeof p === "string" && /^(cs|pi)_[A-Za-z0-9_]+$/.test(p)) ?? null;
  return (
    <DealClient
      id={id}
      origin={await getOrigin()}
      created={created === "1"}
      atDoor={handover === "1"}
      paid={payment}
    />
  );
}
