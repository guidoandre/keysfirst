import { unpackAccount } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "./config";
import { tokenAccount } from "./program";

/** The account's Test EUR in base units; 0 when it has never held any. One RPC call. */
export async function readBalance(connection: Connection, owner: PublicKey): Promise<bigint> {
  const address = tokenAccount(owner);
  const info = await connection.getAccountInfo(address, "confirmed");
  return info ? unpackAccount(address, info, TOKEN_PROGRAM_ID).amount : 0n;
}
