import type { Metadata } from "next";
import { MyDeals } from "./MyDeals";

export const metadata: Metadata = {
  title: "My deals",
  description: "Your deposit links as landlord and as tenant, read straight from Solana.",
  robots: { index: false },
};

export default function MyDealsPage() {
  return <MyDeals />;
}
