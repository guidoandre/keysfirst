import { Transaction, type Connection, type PublicKey, type TransactionError, type TransactionInstruction } from "@solana/web3.js";

export interface SigningWallet {
  publicKey: PublicKey | null;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
}

/**
 * Signs with the wallet and sends through our own devnet connection.
 * (Using signTransaction instead of the wallet's send avoids the wallet picking mainnet.)
 */
export async function signAndSend(
  connection: Connection,
  wallet: SigningWallet,
  instructions: TransactionInstruction[],
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Log in first.");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: wallet.publicKey, blockhash, lastValidBlockHeight }).add(...instructions);
  const signed = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  let err: TransactionError | null;
  try {
    err = (await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")).value.err;
  } catch (waitError) {
    // The wait failed (a rate limit, a timeout), not necessarily the transaction. Ask the network before reporting
    // an error: a retry of a transaction that did land would create a second deal or withdraw twice.
    const outcome = await outcomeOf(connection, signature, lastValidBlockHeight);
    if (outcome === undefined) throw waitError;
    err = outcome;
  }
  if (err) throw new Error(`Transaction failed: ${JSON.stringify(err)}`);
  return signature;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The transaction's error (null for success) once it is confirmed, or undefined once it can no longer land
 * (its blockhash expired) or the network stays unreachable for about half a minute.
 */
async function outcomeOf(connection: Connection, signature: string, lastValidBlockHeight: number) {
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const status = (await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })).value[0];
      if (status && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) return status.err;
      if ((await connection.getBlockHeight("confirmed")) > lastValidBlockHeight) return undefined;
    } catch {
      // Still busy: ask again.
    }
    await sleep(2_000);
  }
  return undefined;
}

const NEEDS_SOL = "Your account is being topped up for network costs. Try again in a few seconds.";
const NEEDS_TEST_EUR = "Your balance doesn't cover this deposit yet. Pay by card instead.";
const BALANCE_TOO_LOW = "Your balance is lower than this amount. Reload the page and try again.";

/** True when the fix for this friendlyError() message is a network-cost top-up (/api/gas). */
export function needsTopUp(message: string | null): boolean {
  return message === NEEDS_SOL;
}

/** Turns wallet and program errors into one plain-English sentence. `context` "withdraw" words balance errors for a withdrawal. */
export function friendlyError(error: unknown, context: "deal" | "withdraw" = "deal"): string {
  const logs = (error as { logs?: unknown })?.logs;
  const text = [error instanceof Error ? error.message : String(error), ...(Array.isArray(logs) ? logs : [])].join("\n");
  if (text.includes("Log in first.")) return "Log in first.";
  if (text.includes("AccountNotInitialized")) {
    // Settling closes the vault, so a second settlement fails on the missing vault before any deal rule runs.
    if (/caused by account: vault/.test(text) || !/caused by account/.test(text)) {
      return "This deal has already been settled. Reload the page to see its status.";
    }
    // Any other missing account is the payer's own Test EUR account: they hold no balance yet.
    return context === "withdraw" ? BALANCE_TOO_LOW : NEEDS_TEST_EUR;
  }
  const programMessage = text.match(/Error Message: ([^"\n\]]+)/);
  if (programMessage) return `${programMessage[1].trim().replace(/\.$/, "")}.`;
  if (/User rejected/i.test(text)) return "You cancelled the request.";
  if (/\b429\b|Too many requests|rate limit/i.test(text)) return "Solana devnet is busy right now. Wait a few seconds and try again.";
  // A new deal's accounts and every fee are paid in devnet SOL; the runtime reports "insufficient funds for rent/fee"
  // and the system program logs "insufficient lamports" when it runs out.
  if (/no record of a prior credit|insufficient lamports|insufficient funds for (rent|fee)/i.test(text)) return NEEDS_SOL;
  if (/insufficient funds/i.test(text)) return context === "withdraw" ? BALANCE_TOO_LOW : NEEDS_TEST_EUR;
  return "Something went wrong. Try again. If you use Phantom, check that it is set to Solana Devnet.";
}
