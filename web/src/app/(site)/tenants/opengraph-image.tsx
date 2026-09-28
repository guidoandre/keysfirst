import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst for tenants";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "For tenants", title: "Pay the deposit before you arrive, without trusting a stranger." });
}
