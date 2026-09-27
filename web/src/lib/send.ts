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
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Connect your wallet first.");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: wallet.publicKey, blockhash, lastValidBlockHeight }).add(...instructions);
  const signed = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
  return signature;
}

/** Turns wallet and program errors into one plain-English sentence. */
export function friendlyError(error: unknown): string {
  const logs = (error as { logs?: unknown })?.logs;
  const text = [error instanceof Error ? error.message : String(error), ...(Array.isArray(logs) ? logs : [])].join("\n");
  if (text.includes("Connect your wallet first.")) return "Connect your wallet first.";
  // Settling closes the vault, so a second settlement fails on the missing vault before any deal rule runs.
  if (text.includes("AccountNotInitialized")) return "This deal has already been settled. Reload the page to see its status.";
  const programMessage = text.match(/Error Message: ([^"\n\]]+)/);
  if (programMessage) return `${programMessage[1].trim().replace(/\.$/, "")}.`;
  if (/User rejected/i.test(text)) return "You cancelled the request in your wallet.";
  if (/\b429\b|Too many requests|rate limit/i.test(text)) return "Solana devnet is busy right now. Wait a few seconds and try again.";
  if (/no record of a prior credit/i.test(text)) return "Your wallet has no devnet SOL for fees. Use “Get test funds” first.";
  if (/insufficient funds/i.test(text)) return "Not enough Test EUR. Use “Get test funds” first.";
  return "Something went wrong. Check that Phantom is set to Solana Devnet and try again.";
}
