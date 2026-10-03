import { Connection, PublicKey } from "@solana/web3.js";
import { dealCalendar } from "@/lib/calendar";
import { SERVER_RPC_URL } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import { fetchDeal, getProgram, type DealAccount } from "@/lib/program";
import { clientIp, rateLimiter } from "@/lib/server/limits";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

// Each download reads the deal from devnet: cap it per IP like the other open routes (the RPC quota is shared).
const perIp = rateLimiter(30, 60_000);

/**
 * The deal's handover and deadline as an .ics file ("Add to calendar" on the deal page). Read from Solana, so the
 * dates are the ones the program enforces. `?for=landlord` changes only the wording; the deal is public anyway.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!perIp(clientIp(req))) return new Response("Too many requests. Try again in a minute.", { status: 429 });
  let address: PublicKey;
  try {
    address = new PublicKey(id);
  } catch {
    return new Response("Deal not found.", { status: 404 });
  }

  let account: DealAccount | null;
  try {
    account = await withTimeout(fetchDeal(getProgram(new Connection(SERVER_RPC_URL, "confirmed")), address), 8_000);
  } catch {
    return new Response("Solana devnet is busy right now. Try again in a few seconds.", { status: 503 });
  }
  if (!account) return new Response("Deal not found.", { status: 404 });

  const data = toDealData(account);
  const role = new URL(req.url).searchParams.get("for") === "landlord" ? "landlord" : "tenant";
  const url = `${new URL(req.url).origin}/deal/${address.toBase58()}`;
  const ics = dealCalendar(
    { id: address.toBase58(), title: data.title, amount: data.amount, times: { moveIn: data.moveIn, deadline: data.deadline } },
    role,
    url,
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Inline: Safari on iPhone, iPad and Mac then opens Calendar's "Add" screen instead of saving a download. Browsers
      // that can't show a calendar still download it under this name.
      "Content-Disposition": 'inline; filename="keysfirst-deal.ics"',
      "Cache-Control": "no-store",
    },
  });
}
