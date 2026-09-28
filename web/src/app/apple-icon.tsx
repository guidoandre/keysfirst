import { ImageResponse } from "next/og";
import { MarkSvg } from "@/components/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: full-bleed Highlighter (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(<MarkSvg size={180} plate="square" />, { ...size });
}
