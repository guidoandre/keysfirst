import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst questions and answers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "FAQ", title: "Questions and answers.", subtitle: "The deposit, the handover, wallets and test money, in plain words." });
}
