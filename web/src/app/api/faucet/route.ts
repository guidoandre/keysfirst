import {
  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction, createMintToCheckedInstruction, getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { MINT, RPC_URL, TOKEN_PROGRAM_ID } from "@/lib/config";
import { DECIMALS } from "@/lib/format";

const TEST_EUR = 1_000n * 10n ** BigInt(DECIMALS);
// Small on purpose: the endpoint is open, so every top-up is SOL anyone could drain with fresh wallets.
const SOL_TOP_UP = 0.02 * LAMPORTS_PER_SOL;
const SOL_MINIMUM = 0.02 * LAMPORTS_PER_SOL;

export const dynamic = "force-dynamic";

/** Devnet only: gives a wallet 1,000 Test EUR and, if needed, a little SOL for fees. */
export async function POST(req: Request) {
  const secret = process.env.FAUCET_SECRET_KEY;
  if (!secret) return Response.json({ error: "The test faucet is not configured." }, { status: 500 });

  let owner: PublicKey;
  try {
    owner = new PublicKey((await req.json()).account);
    if (!PublicKey.isOnCurve(owner.toBytes())) throw new Error("not a wallet");
  } catch {
    return Response.json({ error: "Send a valid wallet address." }, { status: 400 });
  }

  const faucet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
  const connection = new Connection(RPC_URL, "confirmed");
  const account = getAssociatedTokenAddressSync(MINT, owner, false, TOKEN_PROGRAM_ID);
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(faucet.publicKey, account, owner, MINT, TOKEN_PROGRAM_ID),
    createMintToCheckedInstruction(MINT, account, faucet.publicKey, TEST_EUR, DECIMALS, [], TOKEN_PROGRAM_ID),
  );
  if ((await connection.getBalance(owner)) < SOL_MINIMUM) {
    tx.add(SystemProgram.transfer({ fromPubkey: faucet.publicKey, toPubkey: owner, lamports: SOL_TOP_UP }));
  }
  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [faucet], { commitment: "confirmed" });
    return Response.json({ signature });
  } catch {
    return Response.json({ error: "The faucet is empty or devnet is busy. Try again in a minute." }, { status: 503 });
  }
}
