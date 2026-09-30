import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
/** API routes and server pages: a private endpoint (e.g. Helius with its key) that never reaches the browser bundle. */
export const SERVER_RPC_URL = process.env.RPC_URL || RPC_URL;

const mint = process.env.NEXT_PUBLIC_MINT;
if (!mint) {
  throw new Error("NEXT_PUBLIC_MINT is not set. Run `npm run create-test-eur` (see web/.env.example).");
}
/** Test EUR (devnet), Token-2022, 6 decimals. */
export const MINT = new PublicKey(mint);
export const TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
if (!privyAppId) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set (see web/.env.example).");
}
export const PRIVY_APP_ID = privyAppId;
