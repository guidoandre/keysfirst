import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json({ label: "Keysfirst spike", icon: `${origin}/icon.svg` }, { headers: CORS });
}

export async function POST(req: Request) {
  let payer: PublicKey;
  try {
    payer = new PublicKey((await req.json()).account);
  } catch {
    return Response.json({ message: "Invalid account" }, { status: 400, headers: CORS });
  }
  const connection = new Connection(RPC_URL, "confirmed");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: payer, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      data: Buffer.from("Keysfirst spike: handover test", "utf8"),
    }),
  );
  const transaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
  return Response.json({ transaction, message: "Spike test: approve to write a memo on devnet" }, { headers: CORS });
}
