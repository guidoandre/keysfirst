import { Transaction, type Connection, type PublicKey, type TransactionInstruction } from "@solana/web3.js";

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
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
  return signature;
}

const NEEDS_SOL = "Your account is being topped up for network costs. Try again in a few seconds.";
const NEEDS_TEST_EUR = "Your balance doesn't cover this deposit yet. Pay by card instead.";

/** True when the fix for this friendlyError() message is a network-cost top-up (/api/gas). */
export function needsTopUp(message: string | null): boolean {
  return message === NEEDS_SOL;
}

/** Turns wallet and program errors into one plain-English sentence. */
export function friendlyError(error: unknown): string {
  const logs = (error as { logs?: unknown })?.logs;
  const text = [error instanceof Error ? error.message : String(error), ...(Array.isArray(logs) ? logs : [])].join("\n");
  if (text.includes("Log in first.")) return "Log in first.";
  // Settling closes the vault, so a second settlement fails on the missing vault before any deal rule runs.
  if (text.includes("AccountNotInitialized")) return "This deal has already been settled. Reload the page to see its status.";
  const programMessage = text.match(/Error Message: ([^"\n\]]+)/);
  if (programMessage) return `${programMessage[1].trim().replace(/\.$/, "")}.`;
  if (/User rejected/i.test(text)) return "You cancelled the request in your wallet.";
  if (/\b429\b|Too many requests|rate limit/i.test(text)) return "Solana devnet is busy right now. Wait a few seconds and try again.";
  // A new deal's accounts and every fee are paid in devnet SOL; the system program logs "insufficient lamports" when it runs out.
  if (/no record of a prior credit|insufficient lamports/i.test(text)) return NEEDS_SOL;
  if (/insufficient funds/i.test(text)) return NEEDS_TEST_EUR;
  return "Something went wrong. Try again. If you use Phantom, check that it is set to Solana Devnet.";
}
