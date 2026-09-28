import { shortAddress } from "./format";

/** The fields of a Privy user this app reads (kept structural so tests don't need Privy). */
export interface PrivyUserLike {
  email?: { address: string };
  google?: { email: string };
  apple?: { email: string };
}

/** The connected wallet that signs for the account: the Privy user's primary wallet, once it is connected. */
export function pickSigningWallet<W extends { address: string }>(wallets: W[], primary: string | null | undefined): W | null {
  if (!primary) return null;
  return wallets.find((w) => w.address === primary) ?? null;
}

/** What the header chip shows: the login email, or the short account number for wallet logins. */
export function accountLabel(user: PrivyUserLike | null | undefined, address: string): string {
  return user?.email?.address ?? user?.google?.email ?? user?.apple?.email ?? shortAddress(address);
}
