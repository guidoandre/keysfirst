import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst: the deposit moves only when the keys do";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return ogCard({ title: "The deposit moves only when the keys do.", subtitle: "A deposit link for renting a room in Europe from abroad." });
}
