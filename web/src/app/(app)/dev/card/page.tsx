import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardGallery } from "./CardGallery";

export const metadata: Metadata = { title: "Card form (development)", robots: { index: false } };

/** The card form for a real devnet deal without logging in: /dev/card?deal=…&account=… (tenant's account). */
export default async function CardGalleryPage({ searchParams }: { searchParams: Promise<{ deal?: string; account?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { deal, account } = await searchParams;
  return <CardGallery deal={deal ?? ""} account={account ?? ""} />;
}
