import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { confirmHandoverIx } from "@/lib/instructions";
import { getProgram } from "@/lib/program";
import { handoverProblem, statusOf } from "@/lib/rules";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

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
  let deal: PublicKey;
  let account: PublicKey;
  try {
    deal = new PublicKey(id);
    account = new PublicKey((await req.json()).account);
  } catch {
    return fail("Invalid request.");
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const program = getProgram(connection);
  const data = await program.account.deal.fetchNullable(deal);
  if (!data) return fail("Deal not found.", 404);

  const problem = handoverProblem(
    statusOf(data.status),
    data.tenant.toBase58(),
    account.toBase58(),
    { moveIn: data.moveIn.toNumber(), deadline: data.deadline.toNumber() },
    Math.floor(Date.now() / 1000),
  );
  if (problem) return fail(problem);

  const ix = await confirmHandoverIx(program, deal, data);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: account, blockhash, lastValidBlockHeight }).add(ix);
  const transaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
  return Response.json(
    {
      transaction,
      message: `Release ${formatEur(data.amount.toString())} to the landlord. Only approve if you are holding the keys.`,
    },
    { headers: CORS },
  );
}
