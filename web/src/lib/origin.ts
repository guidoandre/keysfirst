import { headers } from "next/headers";
import { PRODUCTION_URL } from "./site";

/**
 * The origin for links people share (the deal link, the handover QR), server components only. In production always
 * www.keysfirst.io, even when the landlord opened keysfirst.vercel.app; previews and dev use the current address.
 */
export async function getOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
