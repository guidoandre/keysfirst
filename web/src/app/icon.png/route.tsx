import { ImageResponse } from "next/og";
import { MarkSvg } from "@/components/brand/mark";

/**
 * The wallet request icon (Solana Pay GET) and the favicon source. PNG on purpose: Phantom draws SVG icons in
 * Solana Pay requests as a black square. `?size=` 16–512 (default 256).
 */
export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  // Whole pixels only: ImageResponse fails on a fractional width (e.g. ?size=100.5).
  const size = Math.min(512, Math.max(16, Math.round(Number(params.get("size")) || 256)));
  return new ImageResponse(<MarkSvg size={size} />, { width: size, height: size });
}
