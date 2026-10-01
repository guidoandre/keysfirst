import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { SERVER_RPC_URL } from "@/lib/config";
import { faucetKeypair, topUpIx } from "@/lib/server/faucet";
import { clientIp, isJson, rateLimiter } from "@/lib/server/limits";

export const dynamic = "force-dynamic";

// Anyone can call this route, so it is fenced in: one request per account at a time (parallel requests would all
// read the low balance before the first transfer lands), one top-up per account every 2 minutes, 20 per IP an hour.
const inFlight = new Set<string>();
const perAccount = rateLimiter(1, 2 * 60_000);
const perIp = rateLimiter(20, 60 * 60_000);
const TOO_SOON = "Your account was just topped up. Try again in a couple of minutes.";
const BUSY = "Devnet is busy. Try again in a minute.";

/** Devnet only: covers an account's network costs so users never need SOL (spec D4). */
export async function POST(req: Request) {
  if (!isJson(req)) return Response.json({ error: "Send JSON." }, { status: 415 });
  const faucet = faucetKeypair();
  if (!faucet) return Response.json({ error: "Top-ups are not configured." }, { status: 500 });
  let owner: PublicKey;
  try {
    owner = new PublicKey((await req.json()).account);
    if (!PublicKey.isOnCurve(owner.toBytes())) throw new Error("not an account");
  } catch {
    return Response.json({ error: "Send a valid account number." }, { status: 400 });
  }
  const key = owner.toBase58();
  if (inFlight.has(key)) return Response.json({ error: TOO_SOON }, { status: 429 });
  inFlight.add(key);
  const connection = new Connection(SERVER_RPC_URL, "confirmed");
  try {
    const ix = await topUpIx(connection, faucet.publicKey, owner);
    if (!ix) return Response.json({ toppedUp: false });
    // Only real top-ups count towards the limits: a check that finds enough SOL costs nothing. The IP is checked
    // first, so a busy network never uses up (and locks for 2 minutes) an account that got nothing.
    if (!perIp(clientIp(req)) || !perAccount(key)) return Response.json({ error: TOO_SOON }, { status: 429 });
    const signature = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet], { commitment: "confirmed" });
    return Response.json({ toppedUp: true, signature });
  } catch {
    return Response.json({ error: BUSY }, { status: 503 });
  } finally {
    inFlight.delete(key);
  }
}
