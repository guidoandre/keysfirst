# Keysfirst Euro Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anyone can use Keysfirst without a wallet app or crypto: log in with email or Google (Privy), the tenant pays deposit + fee by card (Stripe test mode), everyone can withdraw their balance to a bank account (simulated payout). Merged to `main` and live by Thu 1 Oct 2026 evening.

**Architecture:** The on-chain program is untouched. In the `(app)` route group, Privy replaces the Solana wallet adapter; one new `AccountProvider` is the only code that knows Privy and hands the rest of the app the same `SigningWallet` interface `lib/send.ts` already uses. Three small server routes do the money plumbing with the existing faucet key (mint authority): `/api/gas` (SOL top-up), `/api/checkout` (Stripe Checkout Session from the on-chain deal) and `/api/checkout/fulfil` (verify payment, mint once, record it on Stripe). Fee and IBAN rules are pure, unit-tested modules.

**Tech Stack:** Next.js 16.3.6 (App Router, Turbopack, React 19.2), TypeScript 5 strict, Tailwind v4, `@solana/web3.js` 1.x, `@anchor-lang/core` 1.2, `@solana/spl-token` 0.4 (Token-2022), **new:** `@privy-io/react-auth` (+ its Solana peers `@solana/kit`, `@solana-program/memo`, `@solana-program/system`, `@solana-program/token`), `stripe`; vitest 4.

**Spec:** [docs/superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md](../specs/2026-09-28-keysfirst-euro-experience-design.md) · Product rules: [2026-09-27-keysfirst-design.md](../specs/2026-09-27-keysfirst-design.md) §6 · Brand and tokens: `docs/brand-guidelines.md`, `docs/design-system.md`.

## Global Constraints

- No change to the Anchor program, the deal rules (product spec §6), `web/src/lib/rules.ts` `availableActions()`, or `/api/handover/[id]`. The UI never offers an action `availableActions()` doesn't return.
- Devnet only; Stripe **test mode only**: the server refuses any `STRIPE_SECRET_KEY` that doesn't start with `sk_test_`. Never print, paste or commit private keys, seed phrases or API keys (`web/.env.local` and `.keys/` stay untouched by git).
- Pricing (spec D8), exact values: card **3.5%** (350 basis points), bank transfer **2%** (200 bp), minimum **€12.00** (1200 cents), paid by the tenant on top of the deposit, not refunded. Only card is live.
- No pop-ups for Privy wallets: every Privy signature passes `options: { uiOptions: { showWalletUIs: false } }`. Existing `ConfirmDialog`s stay.
- SOL top-up: 0.02 SOL when the account holds less than 0.01 SOL.
- No database, no webhook, no emails. Only one simulated step: the bank payout after the burn.
- `(site)` pages import no Privy, Stripe or wallet code (Lighthouse). Links from marketing pages into `(app)` keep `prefetch={false}`.
- Copy: plain English, amounts like `€600.00`, no blockchain words in the UI ("account", "balance", "lock", "withdraw"; never "wallet", "SOL", "token", "burn", "mint" in user-facing text except where Phantom users need it). No exclamation marks, no emoji. Status labels unchanged.
- Styling: only the semantic colour utilities from `docs/design-system.md` §2; existing components (`Button`, `Callout`, `Sheet`, `TextField`, `EmptyState`).
- React lint (eslint-plugin-react-hooks 7, errors): no synchronous `setState` in an effect body (defer with `setTimeout(fn, 0)`), no reading/writing `ref.current` during render, no `Date.now()` during render, no components declared inside components. Use `useEffectEvent` (React 19.2) when an effect must call the latest callback.
- Next.js 16: `params`/`searchParams` are Promises. Read `web/AGENTS.md`: check `node_modules/next/dist/docs/` before using an API you're unsure of.
- Claude never signs in to Privy, Google or Stripe accounts: steps marked **User:** are done by the user in the browser pane. Claude may type Stripe's published test card (`4242 4242 4242 4242`) on Stripe's test-mode Checkout page.
- Commands (PowerShell, in `web/`): `npm test`, `npm run lint`, `npm run build`. Dev server: `preview_start` name `web`.
- Git: branch `euro` from `main`. Commit `type(scope): summary` and end every message with the trailer: `git commit -m "feat(web): summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`. Push at every milestone; merge to `main` only after the user approves the Preview.
- After each milestone: tell the user what works, what doesn't, what's next; tick this plan's checkboxes.

## File Structure

```
web/src/
├── lib/
│   ├── pricing.ts (+test)        NEW  fee rules: feeCents, priceBreakdown, feePercent
│   ├── iban.ts (+test)           NEW  normalizeIban, isValidIban, maskIban
│   ├── checkout.ts (+test)       NEW  checkoutProblem (who may pay by card, when)
│   ├── account.ts (+test)        NEW  pickSigningWallet, accountLabel
│   ├── balance.ts                NEW  readBalance (Test EUR balance of an account, 0 if none)
│   ├── connection.tsx            NEW  ConnectionProvider + useConnection (replaces wallet-adapter's)
│   ├── format.ts (+test)         MOD  toCents, fromCents; phantomBrowseUrl removed
│   ├── send.ts (+test)           MOD  friendlyError copy, needsTopUp replaces needsTestFunds
│   ├── instructions.ts           MOD  withdrawIx (burnChecked)
│   ├── deal-view.ts (+test)      MOD  fund label "Lock … from your balance"
│   ├── config.ts                 MOD  PRIVY_APP_ID
│   ├── use-deal.ts, use-my-deals.ts  MOD  imports from connection / AccountProvider
│   └── server/
│       ├── faucet.ts             NEW  faucetKeypair, topUpIx, mintIxs (server only)
│       └── stripe.ts             NEW  stripeClient (test keys only)
├── app/
│   ├── api/gas/route.ts          NEW  SOL top-up (replaces api/faucet)
│   ├── api/faucet/route.ts       DEL
│   ├── api/checkout/route.ts     NEW  create Checkout Session
│   ├── api/checkout/fulfil/route.ts NEW verify, mint once, record
│   └── (app)/
│       ├── providers.tsx         MOD  PrivyProvider + ConnectionProvider + AccountProvider
│       ├── deal/[id]/page.tsx    MOD  passes ?paid
│       ├── deal/[id]/DealClient.tsx MOD card payment, resume, top-up
│       ├── deal/[id]/handover/page.tsx MOD "Continue" first, Phantom second
│       ├── new/CreateDealFlow.tsx MOD useAccount, top-up instead of Get test funds
│       ├── deals/MyDeals.tsx     MOD  useAccount, BalanceCard
│       └── start/page.tsx, start/GuideFunds.tsx→GuideLogin.tsx  MOD guide without Phantom
├── components/
│   ├── wallet/AccountProvider.tsx NEW  Privy → Account context, useAccount, gas, balance, ?login=1
│   ├── wallet/CardResume.tsx      NEW  after Stripe: fulfil, wait for balance, hand back to fund
│   ├── wallet/WithdrawSheet.tsx   NEW  amount, name, IBAN, burn, demo confirmation
│   ├── wallet/BalanceCard.tsx     NEW  "Your balance · Withdraw to bank"
│   ├── wallet/LoginButton.tsx, AppHeader.tsx, WalletChip.tsx  MOD
│   ├── wallet/ConnectProvider.tsx, ConnectSheet.tsx, TestFundsButton.tsx  DEL
│   ├── deal/NextStep.tsx, DealView.tsx, HandoverMode.tsx  MOD
│   └── guide/GuideIllustrations.tsx  MOD (Phantom-only drawings removed)
└── content/faq.ts, content/scenarios.ts + marketing/legal copy  MOD
```

## Schedule and milestones

| Day | Tasks | Milestone |
|---|---|---|
| Mon 28 Sep (evening) | Task 0 (user setup) | Keys in `.env.local` |
| Tue 29 Sep | Tasks 1–4 | **M1:** log in with Google/email, create and fund deals as before (with Test EUR from a card later), no pop-ups, no SOL needed |
| Wed 30 Sep | Tasks 5–7 | **M2:** pay by card end to end, balance and withdraw |
| Thu 1 Oct | Tasks 8–10 | **M3:** handover on the phone, copy and legal pages, Preview approved, merged |
| Fri 2 Oct | Buffer; original plan's rehearsal (Task 15) | Demo-ready |

Cut order if late: Task 9 copy beyond FAQ/Get started/Privacy/Terms first; then the BalanceCard on My deals (keep withdraw in the header menu only).

---

### Task 0: Accounts, keys and branch (user + Claude)

**Files:** `web/.env.example` (modify), `web/.env.local` (user edits, never committed)

- [ ] **Step 1 (User): Create the Privy app.** On dashboard.privy.io: create an app "Keysfirst"; Login methods → enable Email, Google and External wallets (Solana); Embedded wallets → Solana on, "Create on login: users without wallets"; Configuration → App settings → Domains: add `http://localhost:3000` and `https://keysfirst.vercel.app`. Copy the **App ID**.
- [ ] **Step 2 (User): Create the Stripe account.** On dashboard.stripe.com: sign up, stay in **Test mode**; Developers → API keys → copy the **Secret key** (`sk_test_…`).
- [ ] **Step 3 (User): Local env.** Add to `web/.env.local`:

```
NEXT_PUBLIC_PRIVY_APP_ID=<App ID>
STRIPE_SECRET_KEY=<sk_test_…>
```

- [ ] **Step 4: Document the variables** — append to `web/.env.example`:

```
# Privy app id (dashboard.privy.io). Public: identifies the app, not a secret.
NEXT_PUBLIC_PRIVY_APP_ID=
# Server-only. Stripe TEST secret key (sk_test_…). The server refuses live keys.
STRIPE_SECRET_KEY=
```

- [ ] **Step 5: Branch and commit**

```bash
git switch -c euro
git add web/.env.example docs/superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md docs/superpowers/plans/2026-09-28-keysfirst-euro-experience.md
git commit -m "docs: euro experience spec and plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Money rules — pricing, IBAN, cents

**Files:**
- Create: `web/src/lib/pricing.ts`, `web/src/lib/pricing.test.ts`, `web/src/lib/iban.ts`, `web/src/lib/iban.test.ts`
- Modify: `web/src/lib/format.ts`, `web/src/lib/format.test.ts`

**Interfaces:**
- Produces: `type PayMethod = "card" | "bank"`; `feeCents(depositCents: number, method: PayMethod): number`; `priceBreakdown(depositCents: number, method: PayMethod): { depositCents: number; feeCents: number; totalCents: number }`; `feePercent(method: PayMethod): string` ("3.5%", "2%"); `MIN_FEE_CENTS = 1200`; `normalizeIban(s): string`; `isValidIban(s): boolean`; `maskIban(s): string` ("DE89 …3000"); in format.ts `toCents(baseUnits: bigint | string): number`, `fromCents(cents: number): bigint`.

- [ ] **Step 1: Write the failing tests**

`web/src/lib/pricing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MIN_FEE_CENTS, feeCents, feePercent, priceBreakdown } from "./pricing";

describe("feeCents", () => {
  it("charges 3.5% by card and 2% by bank transfer", () => {
    expect(feeCents(60_000, "card")).toBe(2_100);
    expect(feeCents(100_000, "card")).toBe(3_500);
    expect(feeCents(100_000, "bank")).toBe(2_000);
    expect(feeCents(200_000, "bank")).toBe(4_000);
  });
  it("never charges less than €12", () => {
    expect(MIN_FEE_CENTS).toBe(1_200);
    expect(feeCents(30_000, "card")).toBe(1_200);
    expect(feeCents(60_000, "bank")).toBe(1_200);
    expect(feeCents(1, "card")).toBe(1_200);
  });
  it("rounds to the nearest cent", () => {
    expect(feeCents(123_45 * 10, "card")).toBe(4_321); // 123450 × 3.5% = 4320.75
    expect(feeCents(100_010, "card")).toBe(3_500); // 3500.35
  });
});

describe("priceBreakdown", () => {
  it("adds the fee on top of the deposit", () => {
    expect(priceBreakdown(60_000, "card")).toEqual({ depositCents: 60_000, feeCents: 2_100, totalCents: 62_100 });
  });
});

describe("feePercent", () => {
  it("prints the rate for copy", () => {
    expect(feePercent("card")).toBe("3.5%");
    expect(feePercent("bank")).toBe("2%");
  });
});
```

`web/src/lib/iban.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidIban, maskIban, normalizeIban } from "./iban";

describe("IBAN", () => {
  it("normalizes spaces and case", () => {
    expect(normalizeIban(" de89 3704 0044 0532 0130 00 ")).toBe("DE89370400440532013000");
  });
  it("accepts valid IBANs (mod 97)", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 00")).toBe(true);
    expect(isValidIban("GB82WEST12345698765432")).toBe(true);
    expect(isValidIban("NL91ABNA0417164300")).toBe(true);
  });
  it("rejects typos and junk", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 01")).toBe(false);
    expect(isValidIban("DE89")).toBe(false);
    expect(isValidIban("hello world")).toBe(false);
    expect(isValidIban("")).toBe(false);
  });
  it("masks all but the country, check digits and last four", () => {
    expect(maskIban("DE89 3704 0044 0532 0130 00")).toBe("DE89 …3000");
  });
});
```

Append to `web/src/lib/format.test.ts` (inside the file, after the existing `describe` blocks; add `toCents, fromCents` to the import from `./format`):

```ts
describe("cents", () => {
  it("converts base units (6 decimals) to cents and back", () => {
    expect(toCents(600_000_000n)).toBe(60_000);
    expect(toCents("600500000")).toBe(60_050);
    expect(fromCents(60_050)).toBe(600_500_000n);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- pricing iban format`
Expected: FAIL — `Cannot find module './pricing'`, `'./iban'`, and `toCents is not a function`.

- [ ] **Step 3: Implement**

`web/src/lib/pricing.ts`:

```ts
export type PayMethod = "card" | "bank";

// Spec D8. Basis points keep the maths in whole numbers.
const RATE_BP: Record<PayMethod, number> = { card: 350, bank: 200 };
export const MIN_FEE_CENTS = 1_200;

/** Keysfirst fee for a deposit, in cents: the method's rate, rounded to the cent, at least €12. Paid by the tenant. */
export function feeCents(depositCents: number, method: PayMethod): number {
  return Math.max(MIN_FEE_CENTS, Math.round((depositCents * RATE_BP[method]) / 10_000));
}

export function priceBreakdown(depositCents: number, method: PayMethod) {
  const fee = feeCents(depositCents, method);
  return { depositCents, feeCents: fee, totalCents: depositCents + fee };
}

/** "3.5%" / "2%" for copy. */
export function feePercent(method: PayMethod): string {
  return `${RATE_BP[method] / 100}%`;
}
```

`web/src/lib/iban.ts`:

```ts
export function normalizeIban(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

/** ISO 13616: two letters, two check digits, 11–30 letters or digits, and the mod-97 remainder is 1. */
export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  let remainder = 0;
  for (const ch of iban.slice(4) + iban.slice(0, 4)) {
    const value = ch >= "A" ? ch.charCodeAt(0) - 55 : Number(ch);
    remainder = Number(`${remainder}${value}`) % 97;
  }
  return remainder === 1;
}

/** "DE89 3704 0044 0532 0130 00" -> "DE89 …3000" */
export function maskIban(input: string): string {
  const iban = normalizeIban(input);
  return `${iban.slice(0, 4)} …${iban.slice(-4)}`;
}
```

In `web/src/lib/format.ts`, after `parseEur`, add:

```ts
/** 600500000 (base units) -> 60050 (cents). Deals are created from parseEur, so amounts are whole cents. */
export function toCents(baseUnits: bigint | string): number {
  return Number(BigInt(baseUnits) / UNITS_PER_CENT);
}

export function fromCents(cents: number): bigint {
  return BigInt(cents) * UNITS_PER_CENT;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- pricing iban format`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/pricing.ts web/src/lib/pricing.test.ts web/src/lib/iban.ts web/src/lib/iban.test.ts web/src/lib/format.ts web/src/lib/format.test.ts
git commit -m "feat(web): fee, IBAN and cents rules" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Who may pay by card, and which wallet signs

**Files:**
- Create: `web/src/lib/checkout.ts`, `web/src/lib/checkout.test.ts`, `web/src/lib/account.ts`, `web/src/lib/account.test.ts`

**Interfaces:**
- Consumes: `canFund`, `DealStatus`, `DealTimes` from `lib/rules.ts`; `shortAddress` from `lib/format.ts`.
- Produces: `checkoutProblem(o: { status: DealStatus; landlord: string; account: string; times: DealTimes; now: number }): string | null`; `pickSigningWallet<W extends { address: string }>(wallets: W[], primary: string | null | undefined): W | null`; `accountLabel(user: PrivyUserLike | null | undefined, address: string): string` with `interface PrivyUserLike { email?: { address: string }; google?: { email: string }; apple?: { email: string } }`.

- [ ] **Step 1: Write the failing tests**

`web/src/lib/checkout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkoutProblem } from "./checkout";

const now = 1_800_000_000;
const times = { moveIn: now + 3 * 86_400, deadline: now + 4 * 86_400 };
const base = { status: "open" as const, landlord: "LANDLORD", account: "TENANT", times, now };

describe("checkoutProblem", () => {
  it("lets a tenant-to-be pay an open deal in its payment window", () => {
    expect(checkoutProblem(base)).toBeNull();
  });
  it("refuses a deal that is no longer open", () => {
    expect(checkoutProblem({ ...base, status: "funded" })).toMatch(/can't be paid any more/);
  });
  it("refuses the landlord", () => {
    expect(checkoutProblem({ ...base, account: "LANDLORD" })).toMatch(/You created this deal/);
  });
  it("refuses outside the payment window (program rule canFund)", () => {
    expect(checkoutProblem({ ...base, now: times.deadline + 1 })).toMatch(/can't be paid right now/);
    expect(checkoutProblem({ ...base, times: { moveIn: now + 200 * 86_400, deadline: now + 201 * 86_400 } })).toMatch(/can't be paid right now/);
  });
});
```

`web/src/lib/account.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { accountLabel, pickSigningWallet } from "./account";

describe("pickSigningWallet", () => {
  const wallets = [{ address: "PHANTOM" }, { address: "EMBEDDED" }];
  it("signs with the connected wallet that is the account's primary wallet", () => {
    expect(pickSigningWallet(wallets, "EMBEDDED")).toEqual({ address: "EMBEDDED" });
  });
  it("returns null when logged out or when that wallet isn't connected yet", () => {
    expect(pickSigningWallet(wallets, null)).toBeNull();
    expect(pickSigningWallet(wallets, "OTHER")).toBeNull();
  });
});

describe("accountLabel", () => {
  const address = "7xKpQ2abcdefghij3mQe";
  it("prefers the email the user logged in with", () => {
    expect(accountLabel({ email: { address: "ana@example.com" } }, address)).toBe("ana@example.com");
    expect(accountLabel({ google: { email: "ana@gmail.com" } }, address)).toBe("ana@gmail.com");
    expect(accountLabel({ apple: { email: "x@privaterelay.appleid.com" } }, address)).toBe("x@privaterelay.appleid.com");
  });
  it("falls back to the short account number (wallet logins)", () => {
    expect(accountLabel({}, address)).toBe("7xKp…3mQe");
    expect(accountLabel(null, address)).toBe("7xKp…3mQe");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- checkout account`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`web/src/lib/checkout.ts`:

```ts
import { canFund, type DealStatus, type DealTimes } from "./rules";

/** Why `account` can't start a card payment for this deal right now; null if it can. Mirrors the program's fund checks. */
export function checkoutProblem(o: { status: DealStatus; landlord: string; account: string; times: DealTimes; now: number }): string | null {
  if (o.status !== "open") return "This deposit can't be paid any more. Reload the page to see the deal's status.";
  if (o.account === o.landlord) return "You created this deal, so you can't pay it. Log in with the tenant's account.";
  if (!canFund(o.times, o.now)) return "This deal can't be paid right now: its handover deadline has passed or is more than 180 days away.";
  return null;
}
```

`web/src/lib/account.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- checkout account`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/checkout.ts web/src/lib/checkout.test.ts web/src/lib/account.ts web/src/lib/account.test.ts
git commit -m "feat(web): card payment eligibility and account helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Privy login replaces the wallet adapter

One atomic swap: after this task the app builds and every page works with a Privy login. Test EUR still comes from the old faucet button (removed in Task 4).

**Files:**
- Create: `web/src/lib/connection.tsx`, `web/src/components/wallet/AccountProvider.tsx`
- Modify: `web/package.json` (deps), `web/src/lib/config.ts`, `web/src/app/(app)/providers.tsx`, `web/src/components/wallet/LoginButton.tsx`, `AppHeader.tsx`, `WalletChip.tsx`, `TestFundsButton.tsx`, `web/src/app/(app)/deal/[id]/DealClient.tsx`, `web/src/app/(app)/new/CreateDealFlow.tsx`, `web/src/app/(app)/deals/MyDeals.tsx`, `web/src/app/(app)/start/GuideFunds.tsx`, `web/src/lib/use-deal.ts`, `web/src/lib/use-my-deals.ts`, `web/src/lib/format.ts` + test (drop `phantomBrowseUrl`)
- Delete: `web/src/components/wallet/ConnectProvider.tsx`, `web/src/components/wallet/ConnectSheet.tsx`

**Interfaces:**
- Consumes: `pickSigningWallet`, `accountLabel` (Task 2); `SigningWallet` from `lib/send.ts`.
- Produces: `useConnection(): { connection: Connection }` from `@/lib/connection`; `useAccount(): Account` from `@/components/wallet/AccountProvider` with

```ts
interface Account {
  ready: boolean;              // Privy restored the session and the wallet list
  address: PublicKey | null;   // null when logged out or the signing wallet isn't connected yet
  label: string | null;        // email or short account number
  wallet: SigningWallet;       // signs without Privy pop-ups
  login: () => void;
  logout: () => Promise<void>;
  balance: bigint | null;      // added in Task 4 (null until then)
  refreshBalance: () => Promise<void>; // Task 4
  topUp: () => Promise<void>;  // Task 4
}
```

- [ ] **Step 1: Swap dependencies**

```bash
cd web
npm install @privy-io/react-auth @solana/kit @solana-program/memo @solana-program/system @solana-program/token
npm uninstall @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

- [ ] **Step 2: Check the installed Privy API before writing code**

Run: `Select-String -Path node_modules/@privy-io/react-auth/dist/dts/*.d.ts -Pattern "walletChainType|createOnLogin|showWalletUIs|toSolanaWalletConnectors|useSignTransaction|landingHeader|loginMessage|walletList" | Select-Object -First 30`
Expected: every name used in Steps 4–5 appears. Note the file that exports `toSolanaWalletConnectors`, `useWallets` and `useSignTransaction` (expected: the `solana` entry, imported as `@privy-io/react-auth/solana`). If a config key used below doesn't exist in this version, drop that key (it's cosmetic) — never invent a replacement.

- [ ] **Step 3: Config and connection context**

In `web/src/lib/config.ts`, append:

```ts
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
if (!privyAppId) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set (see web/.env.example).");
}
export const PRIVY_APP_ID = privyAppId;
```

Create `web/src/lib/connection.tsx`:

```tsx
"use client";

import { Connection } from "@solana/web3.js";
import { createContext, useContext, useMemo, type ReactNode } from "react";

const ConnectionContext = createContext<Connection | null>(null);

// No automatic retries on "429 Too Many Requests": each refusal was retried up to 5 times, which kept
// the whole Wi-Fi network over devnet's rate limit. The deal page's 2-second poll is the retry.
export function ConnectionProvider({ endpoint, children }: { endpoint: string; children: ReactNode }) {
  const connection = useMemo(() => new Connection(endpoint, { commitment: "confirmed", disableRetryOnRateLimit: true }), [endpoint]);
  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>;
}

/** Same shape as wallet-adapter's hook, so call sites only change their import. */
export function useConnection(): { connection: Connection } {
  const connection = useContext(ConnectionContext);
  if (!connection) throw new Error("useConnection must be used inside ConnectionProvider (the (app) route group).");
  return { connection };
}
```

- [ ] **Step 4: AccountProvider**

Create `web/src/components/wallet/AccountProvider.tsx`:

```tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { accountLabel, pickSigningWallet } from "@/lib/account";
import type { SigningWallet } from "@/lib/send";

export interface Account {
  /** False until Privy has restored the session: show skeletons, not "Log in". */
  ready: boolean;
  address: PublicKey | null;
  label: string | null;
  /** Signs with the account's wallet. Privy wallets sign without a pop-up (spec D2); Phantom shows its own approval. */
  wallet: SigningWallet;
  login: () => void;
  logout: () => Promise<void>;
  balance: bigint | null;
  refreshBalance: () => Promise<void>;
  topUp: () => Promise<void>;
}

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { ready: privyReady, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { signTransaction } = useSignTransaction();

  const primary = authenticated ? (user?.wallet?.address ?? null) : null;
  const signer = pickSigningWallet(wallets, primary);
  const connected = signer !== null;
  const address = useMemo(() => (primary && connected ? new PublicKey(primary) : null), [primary, connected]);
  const ready = privyReady && (!authenticated || walletsReady);

  const wallet = useMemo<SigningWallet>(
    () => ({
      publicKey: address,
      signTransaction: signer
        ? async (tx: Transaction) => {
            const { signedTransaction } = await signTransaction({
              transaction: new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false })),
              wallet: signer,
              options: { uiOptions: { showWalletUIs: false } },
            });
            return Transaction.from(signedTransaction);
          }
        : undefined,
    }),
    [address, signer, signTransaction],
  );

  // The marketing pages' "Log in" link lands on /deals?login=1: open Privy's modal once it is ready.
  useEffect(() => {
    if (!privyReady || !new URLSearchParams(window.location.search).has("login")) return;
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState(window.history.state, "", url);
      if (!authenticated) login();
    }, 0);
    return () => clearTimeout(timer);
  }, [privyReady, authenticated, login]);

  const noop = useCallback(async () => {}, []);
  const value = useMemo<Account>(
    () => ({
      ready,
      address,
      label: address ? accountLabel(user, address.toBase58()) : null,
      wallet,
      login: () => login(),
      logout,
      balance: null,
      refreshBalance: noop,
      topUp: noop,
    }),
    [ready, address, user, wallet, login, logout, noop],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be used inside AccountProvider (the (app) route group).");
  return account;
}
```

If TypeScript rejects `accountLabel(user, …)` because Privy's `User` type differs structurally, pass `user as PrivyUserLike | null` (import the type from `@/lib/account`) after checking in the `.d.ts` that `email.address`, `google.email` and `apple.email` exist.

- [ ] **Step 5: Providers**

Replace `web/src/app/(app)/providers.tsx`:

```tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type { ReactNode } from "react";
import { AccountProvider } from "@/components/wallet/AccountProvider";
import { PRIVY_APP_ID, RPC_URL } from "@/lib/config";
import { ConnectionProvider } from "@/lib/connection";

// Phantom and other installed Solana wallets, for "I already have a wallet" (spec D1).
const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: true });

/** One login for the whole app: email, Google or an existing Solana wallet (spec D1). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#16181d",
          logo: "/icon.png",
          landingHeader: "Log in to Keysfirst",
          loginMessage: "Use your email or Google. No wallet app needed.",
          walletChainType: "solana-only",
          walletList: ["phantom", "detected_solana_wallets"],
        },
        embeddedWallets: { solana: { createOnLogin: "users-without-wallets" }, ethereum: { createOnLogin: "off" } },
        externalWallets: { solana: { connectors: solanaConnectors } },
      }}
    >
      <ConnectionProvider endpoint={RPC_URL}>
        <AccountProvider>{children}</AccountProvider>
      </ConnectionProvider>
    </PrivyProvider>
  );
}
```

- [ ] **Step 6: Header, login button, chip**

`web/src/components/wallet/LoginButton.tsx` — replace the two hooks and the button:

```tsx
"use client";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { useAccount } from "./AccountProvider";

export function LoginButton({
  label = "Log in",
  variant = "secondary",
  size,
  fullWidth,
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  const { ready, login } = useAccount();
  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} disabled={!ready} onClick={login}>
      {label}
    </Button>
  );
}
```

`web/src/components/wallet/AppHeader.tsx` — replace `import { useWallet } …` and `import { useMounted } …` with `import { useAccount } from "./AccountProvider";`, and the three lines at the top of `AppHeader()` with:

```tsx
  const { ready, address } = useAccount();
  const loggedIn = ready && address !== null;
```

`web/src/components/wallet/WalletChip.tsx` — replace `useWallet` with the account; the chip shows the label; the sheet is titled "Your account":

```tsx
"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { useAccount } from "./AccountProvider";
import { TestFundsButton } from "./TestFundsButton";

/** The logged-in state: email (or short account number) + a menu. */
export function WalletChip() {
  const { address, label, logout } = useAccount();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!address || !label) return null;
  const accountNumber = address.toBase58();

  async function copy() {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 max-w-[14rem] items-center gap-2 rounded-full border-[1.5px] border-field px-3.5 text-sm font-semibold hover:bg-subtle"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-released" />
        <span className="sr-only">Your account: </span>
        <span className="truncate">{label}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your account">
        <p className="text-fg-muted">{label}</p>
        <div className="mt-4 grid gap-2">
          <ButtonLink href="/deals" variant="secondary" fullWidth onClick={() => setOpen(false)}>
            My deals
          </ButtonLink>
          <Button variant="secondary" fullWidth onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied" : "Copy account number"}
          </Button>
          <p aria-live="polite" className="sr-only">
            {copied ? "Copied to the clipboard" : ""}
          </p>
          <TestFundsButton />
          <Button
            variant="quiet"
            className="mt-2 justify-center"
            onClick={() => {
              void logout();
              setOpen(false);
            }}
          >
            <Icon name="logout" size={18} />
            Log out
          </Button>
        </div>
      </Sheet>
    </>
  );
}
```

`web/src/components/wallet/TestFundsButton.tsx` — replace `import { useWallet } …` with `import { useAccount } from "./AccountProvider";` and `const { publicKey } = useWallet();` with `const { address: publicKey } = useAccount();` (temporary; deleted in Task 4).

- [ ] **Step 7: Call sites**

- `web/src/lib/use-deal.ts`: `import { useConnection } from "@solana/wallet-adapter-react";` → `import { useConnection } from "./connection";`
- `web/src/lib/use-my-deals.ts`: replace the wallet-adapter import with `import { useAccount } from "@/components/wallet/AccountProvider";` and `import { useConnection } from "./connection";`; replace `const { publicKey } = useWallet();` with `const { address: publicKey } = useAccount();`
- `web/src/app/(app)/deal/[id]/DealClient.tsx`: replace the wallet-adapter import with `import { useAccount } from "@/components/wallet/AccountProvider";` and `import { useConnection } from "@/lib/connection";`; replace `const wallet = useWallet();` with `const { wallet } = useAccount();`
- `web/src/app/(app)/new/CreateDealFlow.tsx`: same two imports; `const wallet = useWallet();` → `const { wallet } = useAccount();`
- `web/src/app/(app)/deals/MyDeals.tsx`: replace `import { useWallet } …` with `import { useAccount } from "@/components/wallet/AccountProvider";`; in `MyDeals()` replace the `useWallet` line and the `waitingForWallet` line with:

```tsx
  const { ready } = useAccount();
  const { state, refresh, wallet } = useMyDeals();
  // A returning visitor's session is restored automatically: show the skeleton, not "Log in", while that happens.
  const waitingForWallet = !mounted || now === 0 || !ready;
```

- `web/src/app/(app)/start/GuideFunds.tsx`: replace `useWallet` with `const { address: publicKey } = useAccount();` (import from `@/components/wallet/AccountProvider`). Rewritten in Task 9.
- `web/src/lib/format.ts`: delete `phantomBrowseUrl` and its test in `format.test.ts` (its only caller, ConnectSheet, is deleted).

Delete: `git rm web/src/components/wallet/ConnectProvider.tsx web/src/components/wallet/ConnectSheet.tsx`

- [ ] **Step 8: Nothing left of the adapter**

Run (from `web/`): `Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "wallet-adapter|useConnect\b|ConnectSheet|phantomBrowseUrl"`
Expected: no matches.

- [ ] **Step 9: Tests, lint, build**

Run: `npm test; npm run lint; npm run build`
Expected: all green. If the build fails on a Privy Solana peer import, check the Privy installation guide (Turbopack needs no externals) and that all four peer packages installed.

- [ ] **Step 10: Browser check (User logs in)**

`preview_start` name `web`, open `/deals`. Claude: no console errors; "Log in" opens Privy's modal with Email, Google and Phantom; `(site)` landing page network requests contain no `privy` URL (`read_network_requests` with `urlPattern: "privy"` on `/`).
**User:** log in with Google. Claude: the header chip shows the email; My deals loads; "Copy account number" copies; "Log out" logs out.
**User:** log in with Phantom (desktop extension). Claude: the chip shows the short account number.

- [ ] **Step 11: Commit**

```bash
git add -A web
git commit -m "feat(web): log in with email, Google or Phantom through Privy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Network costs covered, balance in the account

**Files:**
- Create: `web/src/lib/server/faucet.ts`, `web/src/app/api/gas/route.ts`, `web/src/lib/balance.ts`
- Modify: `web/src/components/wallet/AccountProvider.tsx`, `web/src/lib/send.ts`, `web/src/lib/send.test.ts`, `web/src/app/(app)/new/CreateDealFlow.tsx`, `web/src/app/(app)/deal/[id]/DealClient.tsx`, `web/src/components/deal/NextStep.tsx`, `web/src/components/wallet/WalletChip.tsx`, `web/src/app/(app)/start/GuideFunds.tsx`
- Delete: `web/src/app/api/faucet/route.ts`, `web/src/components/wallet/TestFundsButton.tsx`

**Interfaces:**
- Consumes: `MINT`, `RPC_URL`, `TOKEN_PROGRAM_ID` (config), `tokenAccount` (program), `DECIMALS` (format).
- Produces: server `faucetKeypair(): Keypair | null`, `topUpIx(connection, faucet: PublicKey, owner: PublicKey): Promise<TransactionInstruction | null>`, `mintIxs(faucet: PublicKey, owner: PublicKey, amount: bigint): TransactionInstruction[]`; client `readBalance(connection, owner: PublicKey): Promise<bigint>`; `needsTopUp(message: string | null): boolean`; `useAccount().balance / refreshBalance / topUp` now real.

- [ ] **Step 1: Update the failing tests for the new messages**

In `web/src/lib/send.test.ts`: change the import to `import { friendlyError, needsTopUp } from "./send";` and replace the affected expectations:

```ts
    expect(friendlyError(new Error("Attempt to debit an account but found no record of a prior credit."))).toMatch(/being topped up/);
    expect(friendlyError(new Error("Program log: Error: insufficient funds"))).toMatch(/balance doesn't cover/);
```

and in the "can't pay for a new deal's accounts" test:

```ts
    expect(friendlyError(e)).toMatch(/being topped up/);
    expect(needsTopUp(friendlyError(e))).toBe(true);
    expect(needsTopUp(friendlyError(new Error("Program log: Error: insufficient funds")))).toBe(false);
    expect(needsTopUp(friendlyError(new Error("User rejected the request.")))).toBe(false);
    expect(needsTopUp(null)).toBe(false);
```

and the fallback test:

```ts
    expect(friendlyError("boom")).toBe("Something went wrong. Try again. If you use Phantom, check that it is set to Solana Devnet.");
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- send`
Expected: FAIL (`needsTopUp` not exported, old messages).

- [ ] **Step 3: Implement the messages**

In `web/src/lib/send.ts`, replace the two constants, `needsTestFunds` and the last line of `friendlyError`:

```ts
const NEEDS_SOL = "Your account is being topped up for network costs. Try again in a few seconds.";
const NEEDS_TEST_EUR = "Your balance doesn't cover this deposit yet. Pay by card instead.";

/** True when the fix for this friendlyError() message is a network-cost top-up (/api/gas). */
export function needsTopUp(message: string | null): boolean {
  return message === NEEDS_SOL;
}
```

```ts
  return "Something went wrong. Try again. If you use Phantom, check that it is set to Solana Devnet.";
```

Run: `npm test -- send` → PASS.

- [ ] **Step 4: Server faucet helpers and /api/gas**

Create `web/src/lib/server/faucet.ts`:

```ts
import { createAssociatedTokenAccountIdempotentInstruction, createMintToCheckedInstruction } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, type Connection, type PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { MINT, TOKEN_PROGRAM_ID } from "@/lib/config";
import { DECIMALS } from "@/lib/format";
import { tokenAccount } from "@/lib/program";

// Small on purpose: /api/gas is open, so every top-up is SOL anyone could drain with fresh accounts.
const SOL_TOP_UP = 0.02 * LAMPORTS_PER_SOL;
const SOL_MINIMUM = 0.01 * LAMPORTS_PER_SOL;

/** The devnet faucet wallet: mint authority of Test EUR and payer of top-ups. Null when not configured. */
export function faucetKeypair(): Keypair | null {
  const secret = process.env.FAUCET_SECRET_KEY;
  return secret ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))) : null;
}

/** 0.02 SOL for network costs when the account holds less than 0.01 SOL (spec D4); null when it has enough. */
export async function topUpIx(connection: Connection, faucet: PublicKey, owner: PublicKey): Promise<TransactionInstruction | null> {
  if ((await connection.getBalance(owner)) >= SOL_MINIMUM) return null;
  return SystemProgram.transfer({ fromPubkey: faucet, toPubkey: owner, lamports: SOL_TOP_UP });
}

/** Creates the owner's Test EUR account if needed and mints `amount` (base units) into it. */
export function mintIxs(faucet: PublicKey, owner: PublicKey, amount: bigint): TransactionInstruction[] {
  const account = tokenAccount(owner);
  return [
    createAssociatedTokenAccountIdempotentInstruction(faucet, account, owner, MINT, TOKEN_PROGRAM_ID),
    createMintToCheckedInstruction(MINT, account, faucet, amount, DECIMALS, [], TOKEN_PROGRAM_ID),
  ];
}
```

Create `web/src/app/api/gas/route.ts`:

```ts
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { faucetKeypair, topUpIx } from "@/lib/server/faucet";

export const dynamic = "force-dynamic";

/** Devnet only: covers an account's network costs so users never need SOL (spec D4). */
export async function POST(req: Request) {
  const faucet = faucetKeypair();
  if (!faucet) return Response.json({ error: "Top-ups are not configured." }, { status: 500 });
  let owner: PublicKey;
  try {
    owner = new PublicKey((await req.json()).account);
    if (!PublicKey.isOnCurve(owner.toBytes())) throw new Error("not an account");
  } catch {
    return Response.json({ error: "Send a valid account number." }, { status: 400 });
  }
  const connection = new Connection(RPC_URL, "confirmed");
  try {
    const ix = await topUpIx(connection, faucet.publicKey, owner);
    if (!ix) return Response.json({ toppedUp: false });
    const signature = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet], { commitment: "confirmed" });
    return Response.json({ toppedUp: true, signature });
  } catch {
    return Response.json({ error: "Devnet is busy. Try again in a minute." }, { status: 503 });
  }
}
```

Delete `web/src/app/api/faucet/route.ts` and `web/src/components/wallet/TestFundsButton.tsx` (`git rm`).

- [ ] **Step 5: Balance reader**

Create `web/src/lib/balance.ts`:

```ts
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
```

- [ ] **Step 6: AccountProvider gets balance and top-up**

In `AccountProvider.tsx`: add imports `useState` (from react), `useConnection` from `@/lib/connection`, `readBalance` from `@/lib/balance`. Inside the component, after `wallet`:

```tsx
  const { connection } = useConnection();
  const [balance, setBalance] = useState<{ owner: string; amount: bigint } | null>(null);
  const owner = address?.toBase58() ?? null;

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      setBalance({ owner: address.toBase58(), amount: await readBalance(connection, address) });
    } catch {
      // Devnet busy: keep the last known balance; the next refresh tries again.
    }
  }, [address, connection]);

  const topUp = useCallback(async () => {
    if (!owner) return;
    await fetch("/api/gas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account: owner }) }).catch(
      () => undefined,
    );
  }, [owner]);

  // Once per browser session and account: cover network costs before the first action (spec D4), read the balance.
  useEffect(() => {
    if (!owner) return;
    const timer = setTimeout(() => {
      void refreshBalance();
      const key = `keysfirst:gas:${owner}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        // Storage blocked: top up anyway (the server skips accounts that have enough).
      }
      void topUp();
    }, 0);
    const onVisible = () => {
      if (!document.hidden) void refreshBalance();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [owner, refreshBalance, topUp]);
```

In the `value` memo replace `balance: null, refreshBalance: noop, topUp: noop,` with:

```tsx
      balance: balance && balance.owner === owner ? balance.amount : null,
      refreshBalance,
      topUp,
```

and update the memo deps to `[ready, address, owner, user, wallet, login, logout, balance, refreshBalance, topUp]`; delete `noop`.

- [ ] **Step 7: Call sites use the top-up instead of "Get test funds"**

`CreateDealFlow.tsx`: import `needsTopUp` instead of `needsTestFunds`, drop the `TestFundsButton` import, take `topUp` from the account (`const { wallet, topUp } = useAccount();`), and in the `catch` of the submit:

```tsx
    } catch (e) {
      const message = friendlyError(e);
      if (needsTopUp(message)) void topUp();
      setError(message);
      setBusy(false);
    }
```

Delete the line `{needsTestFunds(error) && <TestFundsButton />}`.

`DealClient.tsx`: `const { wallet, topUp, refreshBalance } = useAccount();`; import `needsTopUp`; in `execute` replace `setError(friendlyError(e));` with:

```tsx
      const message = friendlyError(e);
      if (needsTopUp(message)) void topUp();
      setError(message);
```

and in its `finally` add `void refreshBalance();` before `setBusy(null);`.

`NextStep.tsx`: delete the `TestFundsButton` and `needsTestFunds` imports and both lines that render `<TestFundsButton />`.

`WalletChip.tsx`: delete the `TestFundsButton` import and `<TestFundsButton />`.

`GuideFunds.tsx`: delete the `TestFundsButton` import and `<TestFundsButton variant="primary" />` (the component is rewritten in Task 9).

- [ ] **Step 8: Tests, lint, build**

Run: `npm test; npm run lint; npm run build`
Expected: green. `Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String "TestFundsButton|needsTestFunds|api/faucet"` → no matches.

- [ ] **Step 9: Browser check — M1**

**User:** log in with a brand-new email (browser pane). Claude: `/api/gas` returns `toppedUp: true` (`read_network_requests` `urlPattern: "api/gas"`); the account's SOL balance on Solana Explorer is 0.02.
**User:** create a deal with demo values. Claude: no Privy pop-up appeared, the deal page loads with "Your deposit link is ready".
Claude: open the deal link in a second browser tab as a visitor: "Log in to pay" is shown.

- [ ] **Step 10: Commit and push (M1)**

```bash
git add -A web
git commit -m "feat(web): Keysfirst covers network costs; balance on the account" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin euro
```

Tell the user: M1 status (what works, what doesn't, next).

---

### Task 5: Withdraw to bank

**Files:**
- Create: `web/src/components/wallet/WithdrawSheet.tsx`, `web/src/components/wallet/BalanceCard.tsx`
- Modify: `web/src/lib/instructions.ts`, `web/src/components/wallet/WalletChip.tsx`, `web/src/app/(app)/deals/MyDeals.tsx`

**Interfaces:**
- Consumes: `useAccount()` (`address`, `wallet`, `balance`, `refreshBalance`, `topUp`), `useConnection()`, `signAndSend`, `friendlyError`, `needsTopUp`, `isValidIban`, `maskIban`, `parseEur`, `formatEur`.
- Produces: `withdrawIx(owner: PublicKey, amount: bigint): TransactionInstruction`; `<WithdrawSheet open onClose />`; `<BalanceCard />`.

- [ ] **Step 1: The instruction**

In `web/src/lib/instructions.ts` add `createBurnCheckedInstruction` to the `@solana/spl-token` import, `import { DECIMALS } from "./format";`, and:

```ts
/** Withdraw to bank (spec D7): the Test EUR leave circulation; the bank payout itself is simulated. */
export function withdrawIx(owner: PublicKey, amount: bigint): TransactionInstruction {
  return createBurnCheckedInstruction(tokenAccount(owner), MINT, owner, amount, DECIMALS, [], TOKEN_PROGRAM_ID);
}
```

- [ ] **Step 2: The sheet**

Create `web/src/components/wallet/WithdrawSheet.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { TextField } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useConnection } from "@/lib/connection";
import { formatEur, parseEur } from "@/lib/format";
import { isValidIban, maskIban } from "@/lib/iban";
import { withdrawIx } from "@/lib/instructions";
import { friendlyError, needsTopUp, signAndSend } from "@/lib/send";
import { useAccount } from "./AccountProvider";

/** Amount, name and IBAN; signing removes the money from the account; the payout is a demo (spec §4.4). */
export function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connection } = useConnection();
  const { address, wallet, balance, refreshBalance, topUp } = useAccount();
  const [amountText, setAmountText] = useState("");
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: string; iban: string } | null>(null);

  const available = balance ?? 0n;
  // Empty amount means "everything".
  const amount = amountText.trim() === "" ? available : parseEur(amountText);
  const errors = {
    amount: amount === null || amount <= 0n ? "Enter an amount, like 600." : amount > available ? `You have ${formatEur(available)}.` : undefined,
    name: name.trim() === "" ? "Enter the account holder's name." : undefined,
    iban: isValidIban(iban) ? undefined : "Check the IBAN: it should look like DE89 3704 0044 0532 0130 00.",
  };
  const valid = !errors.amount && !errors.name && !errors.iban;

  function close() {
    setDone(null);
    setError(null);
    setChecked(false);
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    if (!valid || !address || amount === null) return;
    setBusy(true);
    setError(null);
    try {
      await signAndSend(connection, wallet, [withdrawIx(address, amount)]);
      setDone({ amount: formatEur(amount), iban: maskIban(iban) });
      setAmountText("");
      await refreshBalance();
    } catch (e) {
      const message = friendlyError(e);
      if (needsTopUp(message)) void topUp();
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Withdraw to bank">
      {done ? (
        <div className="space-y-4">
          <Callout tone="success" role="status" title={`${done.amount} is on its way`}>
            To {done.iban}. It usually arrives in 1–2 business days. Demo: no real money moves.
          </Callout>
          <Button fullWidth onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-fg-muted">
            Your balance: <span className="font-semibold text-fg tabular-nums">{formatEur(available)}</span>
          </p>
          <TextField
            id="withdraw-amount"
            label="Amount in €"
            inputMode="decimal"
            placeholder={formatEur(available).replace("€", "")}
            hint="Leave empty to withdraw everything."
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            error={checked ? errors.amount : undefined}
          />
          <TextField
            id="withdraw-name"
            label="Account holder"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={checked ? errors.name : undefined}
          />
          <TextField
            id="withdraw-iban"
            label="IBAN"
            autoComplete="off"
            spellCheck={false}
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            error={checked ? errors.iban : undefined}
          />
          {error && (
            <Callout tone="danger" role="alert">
              {error}
            </Callout>
          )}
          <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Sending…" disabled={available === 0n}>
            {amount && amount > 0n && amount <= available ? `Withdraw ${formatEur(amount)}` : "Withdraw"}
          </Button>
          <p className="text-sm text-fg-muted">Demo: the money leaves your Keysfirst balance, but no real bank transfer happens.</p>
        </form>
      )}
    </Sheet>
  );
}
```

(Check `TextField`'s `hint` prop renders under the label as in `CreateDealFlow`; `Button` accepts `type="submit"` — confirm in `components/ui/Button.tsx`, and if it doesn't forward `type`, wrap with `onClick={submit}` instead of a form submit.)

- [ ] **Step 3: Balance card and chip entry**

Create `web/src/components/wallet/BalanceCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEur } from "@/lib/format";
import { useAccount } from "./AccountProvider";
import { WithdrawSheet } from "./WithdrawSheet";

/** "Your balance · Withdraw to bank", shown only when there is money to withdraw (spec D3). */
export function BalanceCard() {
  const { balance } = useAccount();
  const [open, setOpen] = useState(false);
  if (!balance) return null;
  return (
    <section aria-labelledby="balance" className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-subtle p-5">
      <div>
        <h2 id="balance" className="label text-fg-muted">
          Your balance
        </h2>
        <p className="mt-1 font-display text-section font-bold tabular-nums">{formatEur(balance)}</p>
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Withdraw to bank
      </Button>
      <WithdrawSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
```

In `MyDeals.tsx`: import `BalanceCard` and, in the component's returned JSX, render `{wallet && <div className="mb-6"><BalanceCard /></div>}` directly above `{content}` (the card hides itself while the balance is 0 or unknown).

In `WalletChip.tsx`: import `formatEur` and `WithdrawSheet`; take `balance` from `useAccount()`; add `const [withdrawing, setWithdrawing] = useState(false);`; under the label paragraph add

```tsx
        <p className="mt-1 text-sm text-fg-muted">
          Balance: <span className="font-semibold text-fg tabular-nums">{balance === null ? "…" : formatEur(balance)}</span>
        </p>
```

and before "My deals" add

```tsx
          {balance ? (
            <Button
              fullWidth
              onClick={() => {
                setOpen(false);
                setWithdrawing(true);
              }}
            >
              Withdraw to bank
            </Button>
          ) : null}
```

and after the account `<Sheet>` add `<WithdrawSheet open={withdrawing} onClose={() => setWithdrawing(false)} />`.

- [ ] **Step 4: Lint, build**

Run: `npm run lint; npm run build` → green.

- [ ] **Step 5: Browser check**

With a zero balance (no money path exists until Task 7): **User** logs in; Claude checks the chip shows "Balance: €0.00", no "Withdraw to bank" button, no BalanceCard on My deals, no console errors, 375 px without horizontal scroll. The real withdrawal (amount, IBAN errors, "€… is on its way To DE89 …3000", balance drops) is checked in Task 7 Step 8 after a card payment and a refund.

- [ ] **Step 6: Commit**

```bash
git add -A web
git commit -m "feat(web): withdraw your balance to a bank account (demo payout)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Stripe checkout and fulfilment routes

**Files:**
- Create: `web/src/lib/server/stripe.ts`, `web/src/app/api/checkout/route.ts`, `web/src/app/api/checkout/fulfil/route.ts`
- Modify: `web/package.json` (`stripe`)

**Interfaces:**
- Consumes: `checkoutProblem` (Task 2), `priceBreakdown`, `feePercent` (Task 1), `toCents` (Task 1), `toDealData`, `getProgram`, `faucetKeypair`, `mintIxs`, `topUpIx` (Task 4).
- Produces: `POST /api/checkout` body `{ deal: string; account: string }` → `200 { url: string; session: string }` | `4xx/5xx { error: string }`; `POST /api/checkout/fulfil` body `{ session: string }` → `200 { signature: string; deal: string }` | `402 { error }` (not paid) | `503 { error }`.

- [ ] **Step 1: Install and client**

Run: `npm install stripe`

Create `web/src/lib/server/stripe.ts`:

```ts
import Stripe from "stripe";

/** Test mode only (spec §1): a live key would take real money, so anything but sk_test_ is refused. */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) return null;
  return new Stripe(key);
}

export const CARD_UNAVAILABLE = "Card payments are not available right now. Try again in a minute.";
```

- [ ] **Step 2: Checkout route**

Create `web/src/app/api/checkout/route.ts`:

```ts
import { Connection, PublicKey } from "@solana/web3.js";
import { checkoutProblem } from "@/lib/checkout";
import { RPC_URL } from "@/lib/config";
import { toDealData } from "@/lib/deal-data";
import { toCents } from "@/lib/format";
import { feePercent, priceBreakdown } from "@/lib/pricing";
import { getProgram } from "@/lib/program";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

/** Starts a card payment for an open deal: deposit + Keysfirst fee on Stripe's test Checkout (spec §4.3). */
export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

  let deal: PublicKey;
  let account: PublicKey;
  try {
    const body = await req.json();
    deal = new PublicKey(body.deal);
    account = new PublicKey(body.account);
    if (!PublicKey.isOnCurve(account.toBytes())) throw new Error("not an account");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(deal);
  if (!raw) return Response.json({ error: "We can't find this deal." }, { status: 404 });
  const d = toDealData(raw);
  const problem = checkoutProblem({
    status: d.status,
    landlord: d.landlord,
    account: account.toBase58(),
    times: { moveIn: d.moveIn, deadline: d.deadline },
    now: Math.floor(Date.now() / 1000),
  });
  if (problem) return Response.json({ error: problem }, { status: 409 });

  const price = priceBreakdown(toCents(d.amount), "card");
  const origin = new URL(req.url).origin;
  // Everything fulfil needs is decided here, on the server, from the on-chain deal.
  const metadata = { deal: deal.toBase58(), account: account.toBase58(), amount: d.amount };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: price.depositCents,
            product_data: { name: `Deposit: ${d.title}`, description: "Held in the lock until you confirm the key handover." },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: price.feeCents,
            product_data: { name: `Keysfirst fee (${feePercent("card")})`, description: "Not refunded if the deposit comes back to you." },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/deal/${deal.toBase58()}?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/deal/${deal.toBase58()}`,
    });
    if (!session.url) throw new Error("no url");
    return Response.json({ url: session.url, session: session.id });
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
}
```

- [ ] **Step 3: Fulfil route**

Create `web/src/app/api/checkout/fulfil/route.ts`:

```ts
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import type Stripe from "stripe";
import { RPC_URL } from "@/lib/config";
import { faucetKeypair, mintIxs, topUpIx } from "@/lib/server/faucet";
import { CARD_UNAVAILABLE, stripeClient } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

const NOT_PAID = "We haven't received your card payment yet.";
const MINT_FAILED = "Your payment arrived, but we couldn't prepare the deposit yet. Try again in a minute.";

/**
 * After Stripe's page: checks the payment, mints exactly the deposit to the payer's account once, and records
 * the mint on the payment intent so a retry never mints twice (spec D6). Safe to call again.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  const faucet = faucetKeypair();
  if (!stripe || !faucet) return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });

  let id: string;
  try {
    id = (await req.json()).session;
    if (typeof id !== "string" || !id.startsWith("cs_")) throw new Error("bad id");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(id, { expand: ["payment_intent"] });
  } catch {
    return Response.json({ error: CARD_UNAVAILABLE }, { status: 503 });
  }
  const intent = session.payment_intent as Stripe.PaymentIntent | null;
  const meta = session.metadata ?? {};
  if (session.payment_status !== "paid" || !intent || !meta.deal || !meta.account || !meta.amount) {
    return Response.json({ error: NOT_PAID }, { status: 402 });
  }
  if (intent.metadata.minted) return Response.json({ signature: intent.metadata.minted, deal: meta.deal });

  const connection = new Connection(RPC_URL, "confirmed");
  const owner = new PublicKey(meta.account);
  let signature: string;
  try {
    const tx = new Transaction().add(...mintIxs(faucet.publicKey, owner, BigInt(meta.amount)));
    const gas = await topUpIx(connection, faucet.publicKey, owner);
    if (gas) tx.add(gas);
    signature = await sendAndConfirmTransaction(connection, tx, [faucet], { commitment: "confirmed" });
  } catch {
    return Response.json({ error: MINT_FAILED }, { status: 503 });
  }
  // Known limit (spec §6): two simultaneous calls could both mint; a webhook fixes this in production.
  await stripe.paymentIntents.update(intent.id, { metadata: { minted: signature } }).catch(() => undefined);
  return Response.json({ signature, deal: meta.deal });
}
```

- [ ] **Step 4: Build**

Run: `npm run lint; npm run build` → green.

- [ ] **Step 5: Route checks with curl (dev server running)**

Use an open deal created in Task 4 (`<DEAL>`) and a tenant account number that isn't the landlord (`<TENANT>`, e.g. the user's second login or the phone Phantom `ApG9HqKnRT2jsZ3JHmDNnn8w5KyudLMMf837WkL14MhF`).

```bash
curl -s -X POST http://localhost:3000/api/checkout -H "Content-Type: application/json" -d "{\"deal\":\"<DEAL>\",\"account\":\"<TENANT>\"}"
```

Expected: `{"url":"https://checkout.stripe.com/c/pay/cs_test_…","session":"cs_test_…"}`. With the landlord's account: 409 "You created this deal…". With `"deal":"x"`: 400.

```bash
curl -s -X POST http://localhost:3000/api/checkout/fulfil -H "Content-Type: application/json" -d "{\"session\":\"<cs_test_… from above>\"}"
```

Expected before paying: 402 "We haven't received your card payment yet."
Claude opens the `url` in the browser pane and pays with `4242 4242 4242 4242`, any future expiry, any CVC, any name (Stripe test mode). Then the same fulfil call → 200 with a signature; calling it again → the **same** signature (no second mint). Solana Explorer: the tenant's Test EUR balance increased by exactly the deposit. Stripe dashboard (test): payment of deposit + fee, with metadata `minted`.

- [ ] **Step 6: Commit**

```bash
git add -A web
git commit -m "feat(web): card payment through Stripe test Checkout, minted once per payment" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Pay by card on the deal page

**Files:**
- Create: `web/src/components/wallet/CardResume.tsx`
- Modify: `web/src/lib/deal-view.ts`, `web/src/lib/deal-view.test.ts`, `web/src/components/deal/NextStep.tsx`, `web/src/components/deal/DealView.tsx`, `web/src/app/(app)/deal/[id]/page.tsx`, `web/src/app/(app)/deal/[id]/DealClient.tsx`

**Interfaces:**
- Consumes: `/api/checkout`, `/api/checkout/fulfil` (Task 6); `priceBreakdown`, `feePercent` (Task 1); `fromCents`, `toCents`, `formatEur`; `readBalance` (Task 4); `useAccount()`.
- Produces: `interface CardOffer { total: string; breakdown: string }` exported from `components/deal/NextStep.tsx`; `DealViewProps` gains optional `card?: CardOffer | null; cardBusy?: boolean; onPayByCard?: () => void`; `<CardResume session dealId account amount onReady onError />`; `pendingKey(dealId: string): string` exported from `CardResume.tsx`.

- [ ] **Step 1: Failing label test**

In `web/src/lib/deal-view.test.ts` change

```ts
    expect(actionLabel("fund", "visitor", amount)).toBe("Pay €600.00 into the lock");
```

to

```ts
    expect(actionLabel("fund", "visitor", amount)).toBe("Lock €600.00 from your balance");
```

Run: `npm test -- deal-view` → FAIL.

- [ ] **Step 2: Label**

In `web/src/lib/deal-view.ts`, `actionLabel`: `case "fund": return \`Lock ${amount} from your balance\`;`
Run: `npm test -- deal-view` → PASS.

- [ ] **Step 3: NextStep shows the card button**

In `web/src/components/deal/NextStep.tsx` add, above the component:

```tsx
/** Card payment for the tenant-to-be whose balance doesn't cover the deposit (spec §4.3). */
export interface CardOffer {
  total: string;
  breakdown: string;
}
```

Add props `card?: CardOffer | null; cardBusy?: boolean; onPayByCard?: () => void;` (destructure with `card = null, cardBusy = false, onPayByCard`). Replace the `primary && (connected ? <Button…> : <LoginButton…/>)` block's connected branch with:

```tsx
        (connected ? (
          primary === "fund" && card && onPayByCard ? (
            <div className="space-y-2">
              <Button size="lg" fullWidth loading={cardBusy} loadingText="Opening the card payment…" disabled={busy !== null || cardBusy} onClick={onPayByCard}>
                Pay {card.total} by card
              </Button>
              <p className="text-sm text-fg-muted">{card.breakdown}</p>
            </div>
          ) : (
            <Button
              size="lg"
              fullWidth
              loading={busy === primary}
              loadingText={primary === "fund" ? "Locking your deposit…" : "Waiting for your wallet…"}
              disabled={busy !== null}
              onClick={() => onAction(primary)}
            >
              {actionLabel(primary, role, amount)}
            </Button>
          )
        ) : (
```

In `web/src/components/deal/DealView.tsx`: import `type CardOffer` from `./NextStep`; add to `DealViewProps`: `card?: CardOffer | null; cardBusy?: boolean; onPayByCard?: () => void;`; pass `card={p.card} cardBusy={p.cardBusy} onPayByCard={p.onPayByCard}` to `<NextStep>`. (The dev gallery keeps working: the props are optional.)

- [ ] **Step 4: The page passes `?paid`**

In `web/src/app/(app)/deal/[id]/page.tsx`: `searchParams: Promise<{ created?: string; paid?: string }>`; in `DealPage`: `const { created, paid } = await searchParams;` and `<DealClient id={id} origin={await getOrigin()} created={created === "1"} paid={paid?.startsWith("cs_") ? paid : null} />`.

- [ ] **Step 5: CardResume**

Create `web/src/components/wallet/CardResume.tsx`:

```tsx
"use client";

import type { PublicKey } from "@solana/web3.js";
import { useEffect, useEffectEvent } from "react";
import { Callout } from "@/components/ui/Callout";
import { readBalance } from "@/lib/balance";
import { useConnection } from "@/lib/connection";
import { useAccount } from "./AccountProvider";

/** localStorage key of a card payment that hasn't been locked yet (survives a closed tab). */
export const pendingKey = (dealId: string) => `keysfirst:card:${dealId}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Back from Stripe: ask the server to confirm the payment and mint the deposit, wait until the balance shows it,
 * then hand back to the deal page, which locks it with the normal fund action (spec §4.3 steps 3–4).
 */
export function CardResume({
  session,
  dealId,
  account,
  amount,
  onReady,
  onError,
}: {
  session: string;
  dealId: string;
  account: PublicKey;
  amount: bigint;
  onReady: () => void;
  onError: (message: string) => void;
}) {
  const { connection } = useConnection();
  const { refreshBalance } = useAccount();
  const ready = useEffectEvent(onReady);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fetch("/api/checkout/fulfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res || !res.ok) {
        const body = res ? await res.json().catch(() => ({})) : {};
        fail(body.error ?? "We couldn't confirm your card payment. Check your connection and reload the page.");
        return;
      }
      // The mint is confirmed; RPC nodes can lag a moment behind.
      for (let i = 0; i < 20 && !cancelled; i++) {
        const balance = await readBalance(connection, account).catch(() => 0n);
        if (balance >= amount) break;
        await sleep(1_000);
      }
      if (cancelled) return;
      await refreshBalance();
      try {
        localStorage.removeItem(pendingKey(dealId));
      } catch {
        // Storage blocked: nothing to clean up.
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      window.history.replaceState(window.history.state, "", url);
      ready();
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [session, dealId, account, amount, connection, refreshBalance]);

  return (
    <Callout tone="info" role="status" title="Payment received">
      Preparing your deposit. It locks automatically in a few seconds.
    </Callout>
  );
}
```

(`useEffectEvent` is stable in React 19.2; if the lint plugin or types reject it in this project's React build, check `node_modules/react/index.d.ts` for `useEffectEvent`; if absent, keep `onReady`/`onError` in refs updated inside a `useEffect` without deps and call `ref.current()` from `run`.)

- [ ] **Step 6: DealClient wires it together**

In `web/src/app/(app)/deal/[id]/DealClient.tsx`:

Imports: `import { useEffect, useMemo, useState } from "react";`, `import { CardResume, pendingKey } from "@/components/wallet/CardResume";`, `import type { CardOffer } from "@/components/deal/NextStep";`, `import { fromCents, formatEur, toCents } from "@/lib/format";` (merge with the existing `formatEur` import), `import { feePercent, priceBreakdown } from "@/lib/pricing";`.

Signature: `export function DealClient({ id, origin, created, paid }: { id: string; origin: string; created: boolean; paid: string | null })`.

Hooks (before the first early return), after the existing `useState`s:

```tsx
  const { wallet, topUp, refreshBalance, balance } = useAccount();
  const [cardBusy, setCardBusy] = useState(false);
  // The Stripe session to finish: from ?paid=, or remembered from before a closed tab (read after mount).
  const [pending, setPending] = useState<string | null>(paid);
  const dealStatus = deal ? statusOf(deal.status) : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (dealStatus && dealStatus !== "open") {
          localStorage.removeItem(pendingKey(id)); // paid and locked (or no longer payable): nothing to resume
          setPending(null);
        } else if (!paid) {
          setPending(localStorage.getItem(pendingKey(id)));
        }
      } catch {
        // Storage blocked: only ?paid= can resume.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id, paid, dealStatus]);
```

(Replace the existing `const wallet = useWallet()`-derived line from Task 3 with this destructuring; `topUp`/`refreshBalance` were already taken in Task 4 — keep one destructuring.)

After `const expired = isExpired(times, now);` add:

```tsx
  const depositUnits = BigInt(data.amount);
  const price = priceBreakdown(toCents(data.amount), "card");
  // The tenant-to-be pays by card unless their balance already covers the deposit (spec §4.3).
  const card: CardOffer | null =
    data.status === "open" && role !== "landlord" && (balance === null || balance < depositUnits)
      ? {
          total: formatEur(fromCents(price.totalCents)),
          breakdown: `Deposit ${amount} + Keysfirst fee ${formatEur(fromCents(price.feeCents))} (${feePercent("card")}). The fee isn't refunded.`,
        }
      : null;

  async function payByCard() {
    if (!me) return;
    setCardBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal: id, account: me.toBase58() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      try {
        localStorage.setItem(pendingKey(id), body.session);
      } catch {
        // Storage blocked: ?paid= on the way back still resumes.
      }
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Card payments are not available right now. Try again in a minute.");
      setCardBusy(false);
    }
  }
```

In the returned JSX, before `<DealView`:

```tsx
      {pending && me && data.status === "open" && (
        <div className="mx-auto max-w-app px-4 pt-6">
          <CardResume
            session={pending}
            dealId={id}
            account={me}
            amount={depositUnits}
            onReady={() => {
              setPending(null);
              void execute("fund");
            }}
            onError={(message) => {
              setPending(null);
              setError(message);
            }}
          />
        </div>
      )}
```

and pass to `<DealView>`: `card={card} cardBusy={cardBusy} onPayByCard={() => void payByCard()}`.

Note: `onError` clears `pending` for this page view only; the `localStorage` entry stays, so reloading retries (fulfil is safe to repeat).

- [ ] **Step 7: Tests, lint, build**

Run: `npm test; npm run lint; npm run build` → green.

- [ ] **Step 8: End-to-end in the browser (M2)**

Landlord: **User** logged in with Google in the browser pane (tab A) creates a demo deal. Tenant: **User** logs in with a different email in a private window of their own browser or a second browser profile, opens the deal link.
Claude checks on the tenant page: "Pay €621.00 by card" (for a €600 demo deposit) with "Deposit €600.00 + Keysfirst fee €21.00 (3.5%). The fee isn't refunded."; for a €300 deposit the fee line shows €12.00.
Tenant taps it → Stripe test Checkout shows two lines (Deposit, Keysfirst fee) → Claude (or user) pays with `4242 4242 4242 4242` → back on the deal: "Payment received" callout → within ~10 s the status flips to "Deposit locked" with no Privy pop-up, the URL has no `?paid`, the receipt link works. Landlord tab: the deal shows the tenant's deposit.
Resume check: repeat with a new deal, and close the tab on Stripe's success redirect before the lock happens (or block `/api/checkout/fulfil` once via devtools offline); reopen the deal link → it locks.
Cancel check: on Stripe's page press back → the deal page, still "Pay … by card", no error.
Refund path and withdrawal (Task 5): landlord "Give the deposit back" → the tenant's chip shows "Balance: €600.00" and My deals shows the BalanceCard → "Withdraw to bank": an IBAN with a typo (`DE89 3704 0044 0532 0130 01`) shows the IBAN error; €650 shows "You have €600.00."; withdraw €200 to `DE89 3704 0044 0532 0130 00` → "€200.00 is on its way" "To DE89 …3000" → balance €400.00 → withdraw with the amount empty → balance €0.00 and the card disappears. Same for the landlord after a released deal.

- [ ] **Step 9: Commit and push (M2)**

```bash
git add -A web
git commit -m "feat(web): pay the deposit by card; it locks automatically after payment" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Tell the user: M2 status.

---

### Task 8: Key handover on the phone without Phantom

**Files:**
- Modify: `web/src/app/(app)/deal/[id]/handover/page.tsx`, `web/src/components/deal/HandoverMode.tsx`, `web/src/components/guide/GuideIllustrations.tsx` (ScanIllustration text only)

- [ ] **Step 1: Handover page leads with "Continue"**

In `handover/page.tsx`:
- `const CHECKLIST = ["You are inside the room.", "You have the keys, or they are in front of you.", "You are logged in with the account that paid the deposit."];`
- Replace the block from `<a href={solanaPayUrl} …>Approve in Phantom</a>` through the final "Open the deal page instead" paragraph with:

```tsx
          <Link href={`/deal/${id}`} className={cx(buttonClass({ size: "lg", fullWidth: true }), "mt-8")}>
            Continue
          </Link>
          <p className="mt-3 text-center text-sm text-fg-muted">
            On the next page, tap &ldquo;I have the keys&rdquo;. That pays the landlord immediately: only continue with the keys in hand.
          </p>
          <details className="mt-8 rounded-md border border-rule p-4">
            <summary className="cursor-pointer font-semibold">Using Phantom?</summary>
            <p className="mt-3 text-sm text-fg-muted">
              Phantom must be on the wallet that paid the deposit. Approve within a minute; if the request expires, tap the button again.
            </p>
            <a href={solanaPayUrl} className={cx(buttonClass({ variant: "secondary", fullWidth: true }), "mt-3")}>
              Approve in Phantom
            </a>
          </details>
```

- [ ] **Step 2: Landlord's steps**

In `HandoverMode.tsx`: `STEPS[1]` → `"They scan this code with their phone camera and confirm on their phone."`; update the doc comment's last sentence to: "that page sends the tenant to the deal page (or to Phantom)."

In `GuideIllustrations.tsx`, `ScanIllustration`: the button text `Approve in Phantom` → `I have the keys` (keep the SVG geometry).

- [ ] **Step 3: Phone check**

Build + `preview_start`; with a funded demo deal in its handover window (demo values: 5-minute window): landlord opens "Start the handover"; **User** scans the QR with the iPhone Camera, lands on `/deal/<id>/handover` in Safari, taps Continue, logs in with the tenant's email if asked, taps "I have the keys: release the deposit", confirms → landlord's screen turns green. (On localhost the phone can't reach the laptop: do this check on the Vercel Preview in Task 10.)

- [ ] **Step 4: Commit**

```bash
git add -A web
git commit -m "feat(web): the handover QR leads to the deal page; Phantom stays optional" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Copy — guide, FAQ, marketing, legal

**Files:**
- Modify: `web/src/app/(app)/start/page.tsx`, `web/src/app/(app)/start/GuideFunds.tsx` → rename `GuideLogin.tsx`, `web/src/components/guide/GuideIllustrations.tsx`, `web/src/content/faq.ts`, `web/src/content/scenarios.ts`, `web/src/app/(site)/tenants/page.tsx`, `web/src/app/(site)/landlords/page.tsx`, `web/src/app/(site)/how-it-works/page.tsx`, `web/src/components/marketing/AudienceSplit.tsx`, `web/src/components/marketing/CtaBand.tsx`, `web/src/components/site/ErrorView.tsx`, `web/src/app/global-error.tsx`, `web/src/app/(site)/privacy/page.tsx`, `web/src/app/(site)/terms/page.tsx`, `web/src/app/(app)/dev/ui/UiGallery.tsx`

- [ ] **Step 1: Get started guide**

`git mv web/src/app/(app)/start/GuideFunds.tsx web/src/app/(app)/start/GuideLogin.tsx` and replace its content:

```tsx
"use client";

import { ButtonLink } from "@/components/ui/Button";
import { LoginButton } from "@/components/wallet/LoginButton";
import { useAccount } from "@/components/wallet/AccountProvider";

/** Step 1 of the guide, live: log in, then continue. */
export function GuideLogin() {
  const { ready, label } = useAccount();
  if (!ready || !label) {
    return (
      <div className="max-w-sm">
        <LoginButton variant="primary" fullWidth />
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-fg-muted">
        Logged in as <span className="font-semibold text-fg">{label}</span>
      </p>
      <ButtonLink href="/new">Create a deposit link</ButtonLink>
    </div>
  );
}
```

In `start/page.tsx`: import `GuideLogin` instead of `GuideFunds`; import only `ScanIllustration` from the illustrations; metadata description: `"Log in with your email or Google, create a deposit link, pay it with a test card and try the key handover."`; intro paragraph: `Keysfirst runs on test money, so you can try everything safely. You need an email address (or a Google or Apple account) and, for the handover, a phone.`; title stays "Get started in 5 minutes". Replace the five `GuideStep`s with:

```tsx
        <GuideStep id="login" number={1} title="Log in">
          <p>Use your email or Google. Keysfirst sets up your account for you: no app to install, nothing to pay for network costs.</p>
          <GuideLogin />
        </GuideStep>

        <GuideStep id="landlord" number={2} title="As the landlord: create a deposit link">
          <p>
            Enter the room, the deposit and the move-in date. Use the demo values to see the whole cycle in a few minutes. Send the link to your
            tenant.
          </p>
          <ButtonLink href="/new">Create a deposit link</ButtonLink>
        </GuideStep>

        <GuideStep id="pay" number={3} title="As the tenant: pay by card">
          <p>
            Open the link and log in with a different email. Pay the deposit plus the Keysfirst fee (3.5% by card, at least €12). This prototype
            uses Stripe&apos;s test mode: pay with the card number <strong className="text-fg tabular-nums">4242 4242 4242 4242</strong>, any
            future date and any three digits. No real money moves.
          </p>
          <p>After the payment the deposit locks automatically. The landlord can&apos;t take it.</p>
          <Callout tone="neutral">The landlord can&apos;t pay their own deal: use a second account for the tenant.</Callout>
        </GuideStep>

        <GuideStep id="door" number={4} title="At the door: confirm the handover" art={<ScanIllustration />}>
          <p>
            The landlord taps &ldquo;Start the handover&rdquo; and shows a code. The tenant checks the room, scans the code with the phone camera,
            taps Continue and then &ldquo;I have the keys&rdquo;. The landlord is paid in seconds.
          </p>
        </GuideStep>

        <GuideStep id="withdraw" number={5} title="Withdraw to your bank">
          <p>
            Money you receive, as the landlord or as a tenant whose deposit came back, shows as your balance. Tap your account in the top corner,
            then &ldquo;Withdraw to bank&rdquo;. In this prototype the bank transfer is a demo.
          </p>
        </GuideStep>
```

In `GuideIllustrations.tsx` delete `InstallIllustration`, `DevnetIllustration` and `FundsIllustration` (now unused; verify with a search that nothing else imports them).

- [ ] **Step 2: FAQ**

In `web/src/content/faq.ts`:
- `landlord-paid` answer: `"At the handover the landlord shows a code on their phone or laptop. The tenant checks the room, scans the code with their phone camera and taps “I have the keys”. The deposit reaches the landlord's Keysfirst balance in seconds and the landlord's screen turns green. From there the landlord withdraws it to their bank."`
- `cost` answer (two paragraphs):

```ts
          "The tenant pays a Keysfirst fee on top of the deposit: 3.5% when paying by card, or 2% by bank transfer, and at least €12. For a €600 deposit that is €21 by card. Landlords pay nothing.",
          "The fee is paid separately, so the deposit itself only ever goes to the tenant or the landlord. It isn't refunded if the deposit comes back. In this prototype every payment uses Stripe's test mode and test money, and only card payment is switched on.",
```

- `data` answer: `"Keysfirst has no database and no tracking. Logging in is handled by Privy, card payments by Stripe; neither shares your card details or password with us. Deals are public on the blockchain and can't be deleted by anyone, so the room title must never contain names, street addresses or phone numbers."`
- Replace the whole `wallets` group with:

```ts
  {
    id: "accounts",
    title: "Your account and test money",
    entries: [
      {
        id: "login",
        question: "Do I need a wallet app or crypto?",
        answer: [
          "No. Log in with your email or Google and Keysfirst sets up your account, including the Solana wallet behind it, for you. Keysfirst also covers the network costs. If you already use Phantom, you can log in with it instead.",
        ],
        link: { href: "/start", label: "Get started in 5 minutes" },
      },
      {
        id: "test-card",
        question: "How do I pay in this prototype?",
        answer: [
          "By card on Stripe's test page. Use the card number 4242 4242 4242 4242, any future expiry date and any three digits. No real money moves.",
        ],
      },
      {
        id: "withdraw",
        question: "How do I get money out?",
        answer: [
          "Tap your account in the top corner, then “Withdraw to bank”, and enter your IBAN. In this prototype the money leaves your Keysfirst balance, but the bank transfer itself is a demo.",
        ],
      },
      {
        id: "devnet",
        question: "What are devnet and test money?",
        answer: [
          "Devnet is Solana's test network. Money there has no value, so you can try everything safely. This prototype uses its own Test EUR on devnet; a live version would use EURC, a regulated euro stablecoin, and a licensed partner for card and bank payments.",
        ],
      },
      {
        id: "qr",
        question: "The code doesn't open anything.",
        answer: [
          "Use the phone's normal camera app and tap the link it shows. On the page that opens, tap Continue, log in with the account that paid, then tap “I have the keys”.",
        ],
      },
    ],
  },
```

Search `faq.ts` for `#funds`, `Get test funds`, `Phantom` afterwards: only the `login` answer mentions Phantom.

- [ ] **Step 3: Marketing and error copy (exact replacements)**

| File | Old | New |
|---|---|---|
| `app/(site)/how-it-works/page.tsx:32` | `clear wallet messages` | `clear messages` |
| `app/(site)/how-it-works/page.tsx:72` | `and approves in Phantom.` | `and taps “I have the keys”.` (write as `&ldquo;I have the keys&rdquo;`) |
| `app/(site)/tenants/page.tsx:22` | `"From your phone, inside Phantom. The money waits; the landlord can't take it."` | `"By card, from your phone. The money waits; the landlord can't take it."` |
| `app/(site)/tenants/page.tsx:28-30` | the three `/start#install`, `#devnet`, `#funds` items | `{ href: "/start#login", title: "An email address", text: "Or a Google account. No wallet app." }`, `{ href: "/start#pay", title: "A card", text: "Here: Stripe's test card, so no real money." }`, `{ href: "/start#door", title: "Your phone", text: "To scan the landlord's code at the door." }` |
| `app/(site)/landlords/page.tsx:19` | `reaches your wallet in seconds` | `reaches your Keysfirst balance in seconds` |
| `components/marketing/AudienceSplit.tsx:6` | `"The deposit leaves your wallet app (like Phantom) but doesn't reach the landlord yet: it waits in the lock."` | `"You pay by card, but the deposit doesn't reach the landlord yet: it waits in the lock."` |
| `components/marketing/CtaBand.tsx:28` | `New to wallets? Get started in 5 minutes` | `New here? Get started in 5 minutes` |
| `components/site/ErrorView.tsx:18` and `app/global-error.tsx:15` | `Nothing moves without your approval in Phantom.` | `Nothing moves without your approval.` |
| `content/scenarios.ts:56-57` | question `What if I scan with the wrong wallet?`, answer `Nothing moves. Phantom can't load the request; switch to the wallet that paid and scan again.` | question `What if I scan while logged in with the wrong account?`, answer `Nothing moves. Only the account that paid can confirm; log in with that account and scan again.` |
| `app/(app)/dev/ui/UiGallery.tsx:203-204` | sheet title `Log in with your wallet`, text about Phantom | title `Your account`, text `Log in with your email or Google.` |

- [ ] **Step 4: Privacy policy**

First check what Privy stores: **User** logs in; Claude runs in the page: `({ cookies: document.cookie.split("; ").map(c => c.split("=")[0]), local: Object.keys(localStorage) })` and notes the Privy key names.
In `app/(site)/privacy/page.tsx`:
- Summary list item `"Your wallet's keys never reach us."` → `"Your password, card details and account keys never reach us."`
- Local-storage paragraph (lines ~63–64, `walletName`): replace with a sentence naming what was found, e.g. `Keysfirst itself sets no cookies. Our login provider Privy keeps your login session in your browser (local storage entries starting with "privy:"<, and the cookies it lists, if any>) so you stay logged in. Keysfirst remembers an unfinished card payment for a deal ("keysfirst:card:…") and that your account's network costs were covered this session ("keysfirst:gas:…").` — use the real names observed.
- Replace the `wallet` section ("Your wallet") with a section `id="account"` title `"Logging in"`: `You log in with your email address or Google, or with your own Solana wallet such as Phantom. Login is provided by Privy (Privy, Inc., USA), which receives your email address or the account you log in with, creates your Solana wallet and keeps its keys protected so that neither Privy nor Keysfirst can move your money without you. Keysfirst receives your email address from Privy only to show it in the header, and your public account number. See <ExternalLink href="https://www.privy.io/privacy-policy">Privy's privacy policy</ExternalLink>.`
- Add a section `id="payments"` title `"Card payments"`: `Card payments are processed by Stripe (Stripe Payments Europe, Ltd., Ireland) in test mode. You enter your card details on Stripe's own page; Keysfirst never sees them. Stripe tells us whether the payment succeeded, the amount, and the deal and account number the payment belongs to. See <ExternalLink href="https://stripe.com/privacy">Stripe's privacy policy</ExternalLink>.`
- Line ~87 (`When you tap Get test funds, or approve the handover…`): → `When you log in, pay by card or approve the handover by scanning the landlord's code, your account number is sent to our server so it can cover network costs, prepare your deposit or build the handover request.`
- Line ~124: `Without a wallet address you can read the site…` → `Without logging in you can read the site, but you can't create or pay a deal.`

- [ ] **Step 5: Terms**

In `app/(site)/terms/page.tsx`:
- Line 18: `the test faucet or the program` → `the test card payments or the program`.
- Line 44 sentence: `Keysfirst cannot reverse, stop or redirect a transaction you approve in your wallet.` → `Keysfirst cannot reverse, stop or redirect a step you confirm.`
- Line 53: `You are responsible for your own wallet, its keys and its recovery phrase, and for every transaction you approve.` → `You are responsible for access to your login (your email or Google account, or your own wallet) and for every step you confirm.`
- Add a paragraph in the section describing the service: `Fees: the tenant pays a Keysfirst fee on top of the deposit, 3.5% by card or 2% by bank transfer, at least €12, shown before paying. The fee is not refunded if the deposit goes back to the tenant. In this prototype all payments use Stripe's test mode and test money; withdrawals to a bank account are simulated.`

- [ ] **Step 6: Checks**

Run: `Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "Get test funds|Test EUR from|install Phantom|Download Phantom|#install|#devnet|#funds"` → no matches.
Run: `npm test; npm run lint; npm run build` → green.
Browser: `/start`, `/faq`, `/tenants`, `/landlords`, `/how-it-works`, `/privacy`, `/terms` at 375 and 1280 px: no console errors, no horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add -A web
git commit -m "docs(web): guide, FAQ, marketing and legal copy for email login and card payments" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Preview, production keys, merge (M3)

**Files:** `CLAUDE.md`, `README.md` (modify), this plan (tick boxes)

- [ ] **Step 1 (User): Vercel environment.** In Vercel → keysfirst → Settings → Environment Variables: add `NEXT_PUBLIC_PRIVY_APP_ID` (Production + Preview) and `STRIPE_SECRET_KEY` (Production + Preview, type Secret). In Privy's dashboard add the branch Preview domain (e.g. `https://keysfirst-git-euro-<team>.vercel.app`) to allowed domains.
- [ ] **Step 2: Push and open the Preview.** `git push`; get the Preview URL from Vercel (`list_deployments`), confirm it built.
- [ ] **Step 3: Full rehearsal on the Preview** (User on two devices: laptop = landlord with Google, phone = tenant with email):
  1. Landlord creates a demo deal (no pop-up).
  2. Tenant opens the link in Safari, logs in, pays by card with `4242…`, deposit locks automatically.
  3. At handover time: landlord starts the handover, tenant scans with the Camera, Continue, "I have the keys", confirm → landlord green.
  4. Landlord withdraws to bank (demo confirmation, balance drops).
  5. Second deal: landlord gives the deposit back → tenant withdraws.
  6. Phantom regression on the laptop: log in with Phantom, create a deal, Phantom approval appears.
  Claude watches runtime errors (`get_runtime_errors`) and the network panel; every failure gets a fix commit before merging.
- [ ] **Step 4: Lighthouse sanity.** Landing page on the Preview: no Privy requests (`read_network_requests urlPattern "privy"` → none); mobile Lighthouse performance within 5 points of the last recorded run in `docs/audits/2026-09-28-accessibility.md`.
- [ ] **Step 5: Notes.** In `CLAUDE.md` add under the redesign notes:

```
- Euro experience (Sep–Oct 2026): spec docs/superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md, plan docs/superpowers/plans/2026-09-28-keysfirst-euro-experience.md. Login = Privy (email/Google/Phantom); useAccount() in components/wallet/AccountProvider.tsx is the only Privy-aware code. Card pay-in = Stripe test Checkout (/api/checkout, /api/checkout/fulfil mints once, recorded on the payment intent); /api/gas covers SOL; withdraw burns Test EUR (payout simulated). Fee 3.5% card / 2% bank / min €12, tenant pays (lib/pricing.ts). Stripe live keys are refused.
```

In `README.md` update the "Try it" / setup section: env vars `NEXT_PUBLIC_PRIVY_APP_ID`, `STRIPE_SECRET_KEY`; test card `4242 4242 4242 4242`; no Phantom needed.

- [ ] **Step 6: Merge after the user approves the Preview**

```bash
git switch main
git merge --no-ff euro -m "Merge branch 'euro': email login, card payments, withdraw to bank" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Then check `https://keysfirst.vercel.app`: log in, a card payment, `/api/gas` works in production. Tick this plan's boxes, tell the user: what works, what doesn't, what's next (original plan Task 15 rehearsal, video, deck with the pricing slide).

## Not in this plan (by decision)

Real bank payouts and bank-transfer pay-in, a Stripe webhook, a database, emails or notifications, KYC, the landlord covering the fee, escrowing the first month's rent, removing the Solana Pay handover route.
