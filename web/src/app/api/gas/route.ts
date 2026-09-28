import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { faucetKeypair, topUpIx } from "@/lib/server/faucet";

export const dynamic = "force-dynamic";

/** Devnet only: covers an account's network costs so users never need SOL (spec D4). */
export async function POST(req: Request) {
  const faucet = faucetKeypair();
  if (!faucet) return Response.json({ error: "Top-ups are not configured." }, { status: 500 });
  let owner: PublicKey;
  try {
    owner = new PublicKey((await req.json()).account);
    if (!PublicKey.isOnCurve(owner.toBytes())) throw new Error("not an account");
  } catch {
    return Response.json({ error: "Send a valid account number." }, { status: 400 });
  }
  const connection = new Connection(RPC_URL, "confirmed");
  try {
    const ix = await topUpIx(connection, faucet.publicKey, owner);
    if (!ix) return Response.json({ toppedUp: false });
    const signature = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet], { commitment: "confirmed" });
    return Response.json({ toppedUp: true, signature });
  } catch {
    return Response.json({ error: "Devnet is busy. Try again in a minute." }, { status: 503 });
  }
}
