import { timingSafeEqual } from "node:crypto";
import { Connection } from "@solana/web3.js";
import { SERVER_RPC_URL } from "@/lib/config";
import { getProgram } from "@/lib/program";
import { faucetKeypair } from "@/lib/server/faucet";
import { returnExpiredDeposits } from "@/lib/server/keeper";

export const dynamic = "force-dynamic";
// One account lookup plus up to 20 confirmed transactions; the keeper stops starting new ones after 35 s.
export const maxDuration = 60;

/** True only for Vercel Cron's own call, which carries `Authorization: Bearer <CRON_SECRET>`. */
function fromCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Once a day (web/vercel.json): sends every locked deposit whose handover deadline has passed back to its tenant.
 * The program already lets anyone do this; the keeper makes sure it happens even if nobody taps the button.
 * Only Vercel Cron may call it, so nobody else can make it spend RPC quota.
 */
export async function GET(req: Request) {
  if (!fromCron(req)) return new Response("Unauthorized", { status: 401 });
  const faucet = faucetKeypair();
  if (!faucet) return Response.json({ error: "The faucet is not configured." }, { status: 500 });

  const connection = new Connection(SERVER_RPC_URL, "confirmed");
  try {
    const result = await returnExpiredDeposits(connection, getProgram(connection), faucet);
    console.log(`Keeper: returned ${result.returned.length}, failed ${result.failed.length}${result.lowFunds ? ", faucet low on SOL" : ""}`);
    return Response.json(result, { status: result.lowFunds || result.failed.length > 0 ? 500 : 200 });
  } catch {
    console.error("Keeper: couldn't read the deals from devnet.");
    return Response.json({ error: "Devnet is busy." }, { status: 503 });
  }
}
