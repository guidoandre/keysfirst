import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "How Keysfirst works: two rules and a clock";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "How it works", title: "Two rules and a clock.", subtitle: "Only the tenant's approval pays the landlord. Otherwise the deposit goes back to the tenant." });
}
