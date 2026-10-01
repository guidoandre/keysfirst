import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { SERVER_RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { confirmHandoverIx } from "@/lib/instructions";
import { fetchDeal, getProgram, type DealAccount } from "@/lib/program";
import { handoverProblem, statusOf } from "@/lib/rules";
import { clientIp, rateLimiter } from "@/lib/server/limits";
import { withTimeout } from "@/lib/timeout";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

// Open to any wallet (Solana Pay), so cap how often one IP can make it read devnet: the RPC quota is shared with checkout.
const perIp = rateLimiter(30, 60_000);

function fail(message: string, status = 400) {
  return Response.json({ message }, { status, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Solana Pay step 1: the wallet shows who is asking. */
export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json({ label: "Keysfirst key handover", icon: `${origin}/icon.png` }, { headers: CORS });
}

/** Solana Pay step 2: the wallet sends its address and gets the release transaction to sign. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!perIp(clientIp(req))) return fail("Too many tries. Wait a minute and scan again.", 429);
  let deal: PublicKey;
  let account: PublicKey;
  try {
    deal = new PublicKey(id);
    account = new PublicKey((await req.json()).account);
  } catch {
    return fail("Invalid request.");
  }

  const connection = new Connection(SERVER_RPC_URL, "confirmed");
  const program = getProgram(connection);
  let data: DealAccount | null;
  try {
    data = await withTimeout(fetchDeal(program, deal), 8_000);
  } catch {
    return fail("Solana devnet is busy right now. Wait a few seconds and scan again.", 503);
  }
  if (!data) return fail("Deal not found.", 404);

  const problem = handoverProblem(
    statusOf(data.status),
    data.tenant.toBase58(),
    account.toBase58(),
    { moveIn: Number(data.moveIn.toString()), deadline: Number(data.deadline.toString()) },
    Math.floor(Date.now() / 1000),
  );
  if (problem) return fail(problem);

  let transaction: string;
  try {
    const ix = await confirmHandoverIx(program, deal, data);
    const { blockhash, lastValidBlockHeight } = await withTimeout(connection.getLatestBlockhash("confirmed"), 8_000);
    const tx = new Transaction({ feePayer: account, blockhash, lastValidBlockHeight }).add(ix);
    transaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
  } catch {
    return fail("Solana devnet is busy right now. Wait a few seconds and scan again.", 503);
  }
  return Response.json(
    {
      transaction,
      message: `Release ${formatEur(data.amount.toString())} to the landlord. Only approve if you are holding the keys.`,
    },
    { headers: CORS },
  );
}
