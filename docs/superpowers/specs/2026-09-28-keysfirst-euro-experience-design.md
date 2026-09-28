# Keysfirst: euro experience (log in with email, pay by card, withdraw to bank)

Date: 2026-09-28 · Status: approved decisions, awaiting spec review · Network: Solana **devnet only**, Stripe **test mode only**
Builds on: [2026-09-27-keysfirst-design.md](2026-09-27-keysfirst-design.md) (product, program, deal rules §6) and [2026-09-28-keysfirst-redesign-design.md](2026-09-28-keysfirst-redesign-design.md) (brand, pages).

## 1. Goal

Nobody needs a wallet app, SOL or crypto to use Keysfirst. Tenants and landlords log in with email or Google; the tenant pays the deposit by card; anyone with money in their Keysfirst account withdraws it to a bank account. Solana stays the backbone: every deal is still the same on-chain escrow, signed by the user's own wallet, which Privy now creates for them behind the scenes.

It must actually work end to end on devnet with Stripe test mode. Only one step is simulated: the bank payout at the end of a withdrawal.

## 2. What does not change

- The Anchor program, its accounts, instructions and deal rules (product spec §6). No redeploy.
- `web/src/lib/rules.ts` and `availableActions()`: the UI still never offers an action the program would reject.
- The Test EUR mint (Token-2022, 6 decimals) and its mint authority (the faucet key, `FAUCET_SECRET_KEY`).
- Deals are read straight from Solana; there is **no database**. Identity (login to wallet) lives in Privy, payments in Stripe.
- `(site)` marketing pages stay free of wallet code (Lighthouse).
- `/api/handover/[id]` (Solana Pay for Phantom users) stays as it is.

## 3. Decisions (approved in chat on 2026-09-28)

| # | Decision |
|---|---|
| D1 | **One login screen** (Privy modal): email, Google, plus "I already have a wallet" for Phantom. Apple login is left out (it needs Apple developer credentials). The wallet-adapter packages and the custom connect sheet go. |
| D2 | **No confirmation pop-ups** for Privy wallets: the button is the confirmation (Privy `showWalletUIs: false`). Existing `ConfirmDialog`s for irreversible actions stay. Phantom users still approve in Phantom. |
| D3 | **Withdraw to bank for everyone** with a balance (landlord after a handover, tenant after a refund). |
| D4 | **Fees for network costs:** the server tops up every account with 0.02 devnet SOL when it holds less than 0.01 SOL (on login and before paying). No program change. |
| D5 | **Card payment with Stripe Checkout** (hosted page, test mode, card only in the demo). |
| D6 | **No webhook:** the deal page confirms the payment with the server on return; the server checks Stripe, mints, and records the mint on the Stripe payment so it never mints twice. |
| D7 | **Withdrawal burns the Test EUR** from the user's account (signed by the user) and shows a demo payout confirmation. |
| D8 | **Pricing:** the tenant pays a Keysfirst fee on top of the deposit: **3.5% by card, 2% by bank transfer, minimum €12**. Presented as a bank-transfer discount (card surcharges are banned, §270a BGB). Landlords pay nothing. The fee is not refunded when the deposit comes back. Only card is live in the demo; the bank-transfer rate appears in copy as part of the live version. |

## 4. User flows

### 4.1 Log in
"Log in" (header, deal page, `?login=1`) opens Privy's modal. Email (one-time code), Google, or an existing Solana wallet. A new email/Google user gets a Privy Solana wallet on first login (`createOnLogin: "users-without-wallets"`). Right after login the app calls `/api/gas` once per session for that address.

The account's address is the Privy user's primary wallet (`user.wallet.address`): the embedded wallet for email/Google users, the external wallet for wallet logins. Signing uses the connected wallet with that address.

Header chip menu: "My deals", your balance, "Withdraw to bank", "Copy account number" (the address, for support), "Log out". "Get test funds" disappears from the UI.

### 4.2 Landlord creates a deal
Unchanged screens. Signing goes through Privy without a pop-up. If the account lacks SOL, the error message says Keysfirst is topping it up and triggers `/api/gas`; trying again works.

### 4.3 Tenant pays by card
On an open deal, the tenant-to-be (logged in, not the landlord) sees:
- Primary button **"Pay €621.00 by card"** with a breakdown underneath: "Deposit €600.00 + Keysfirst fee €21.00 (3.5%). The fee isn't refunded."
- If their Keysfirst balance already covers the deposit (a refunded tenant, or a payment that was minted but not yet locked): primary becomes **"Lock €600.00 from your balance"** (today's `fund` action) and the card button is not shown.

Card flow:
1. `POST /api/checkout {deal, account}`: the server reads the deal on-chain, checks it can be paid by this account (open, within the funding window, account isn't the landlord), computes the fee, creates a Stripe Checkout Session (two line items: deposit and Keysfirst fee; metadata `deal`, `account`, `amount` in base units; success URL `/deal/<id>?paid={CHECKOUT_SESSION_ID}`, cancel URL `/deal/<id>`), returns its URL. The browser goes there, and the deal id is remembered in `localStorage` under the session id.
2. On Stripe's test page the tenant pays with a test card.
3. Back on `/deal/<id>?paid=cs_…`: the page shows "Payment received. Locking your deposit…", calls `POST /api/checkout/fulfil {session}`. The server retrieves the session, requires `payment_status === "paid"`, returns the recorded signature if the payment intent's metadata already has `minted`, otherwise mints exactly `amount` Test EUR to `account` (creating its token account, topping up SOL if low), stores `minted=<signature>` on the payment intent, and returns the signature.
4. The page waits for the balance to cover the deposit and runs `fund` itself (no pop-up for Privy wallets; Phantom shows its approval). Success shows the normal "Done" receipt. The `?paid` parameter is removed from the URL.
5. If the tab closes after payment, reopening the deal link resumes from step 3 (pending session id in `localStorage`), and the "from your balance" button covers any remaining case.

### 4.4 Withdraw to bank
From the header menu or the balance card on My deals: a sheet with the balance, amount (defaults to everything), account holder name and IBAN (checked with the mod-97 rule). "Withdraw €600.00" signs a `burnChecked` of that amount from the user's Test EUR account. Success: "€600.00 is on its way to DE89 …3000. Demo: no real money moves." Nothing is stored.

### 4.5 Key handover
The QR still encodes `https://<origin>/deal/<id>/handover`. That page now leads with **"Continue"** to `/deal/<id>`, where the tenant (logged in with the same account on their phone) taps "I have the keys" (the existing `confirmInApp` action, with its confirmation dialog). "Approve in Phantom" stays as a secondary link for Phantom users. The landlord's handover steps say "They scan this code and confirm on their phone."

## 5. Architecture

```
Browser ((app) routes only)
  PrivyProvider (login, embedded Solana wallets, Phantom connector)
  ConnectionProvider (our own tiny context around @solana/web3.js Connection)
  useAccount()  → { ready, address, login, logout, signer }   ← the only file that knows Privy
  signAndSend(connection, signer, ixs)                         ← unchanged signature
Server (Next.js route handlers)
  /api/gas               SOL top-up (replaces /api/faucet)
  /api/checkout          create Stripe Checkout Session from the on-chain deal
  /api/checkout/fulfil   verify payment, mint once, record on Stripe
  /api/handover/[id]     unchanged
Pure modules (vitest)
  lib/pricing.ts   fee rules      lib/iban.ts   IBAN check and masking
  lib/checkout.ts  checkoutProblem() and cents conversion
  lib/account.ts   pickSigningWallet()
```

- `useAccount()` returns a `SigningWallet` (the interface `send.ts` already uses): `signTransaction` serializes the web3.js `Transaction`, calls Privy's `signTransaction` with `showWalletUIs: false`, and returns `Transaction.from(signedTransaction)`. Every call site keeps `signAndSend(connection, wallet, …)`.
- Server secrets: `FAUCET_SECRET_KEY` (existing), `STRIPE_SECRET_KEY` (must start with `sk_test_`; the server refuses anything else). Public: `NEXT_PUBLIC_PRIVY_APP_ID`.
- New dependencies (approved): `@privy-io/react-auth`, its Solana peer dependencies as its installation guide requires (`@solana/kit` and the `@solana-program/*` packages it names), `stripe`. Removed: `@solana/wallet-adapter-base`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`.

## 6. Errors

- Stripe unreachable or not configured: "Card payments are not available right now. Try again in a minute." (no redirect).
- Payment not completed (`payment_status` not `paid`): "We haven't received your card payment yet." with "Try again".
- Mint fails (devnet busy, faucet empty): "Your payment arrived, but we couldn't prepare the deposit yet. Try again in a minute." Retrying `fulfil` is safe.
- Deal no longer payable when checkout starts: the live status message the deal page already uses.
- Two tabs fulfilling at the same moment could mint twice (no database, no webhook). On devnet this only creates extra Test EUR; documented as a known limitation, a webhook fixes it in production.

## 7. Copy

Plain English, amounts in €, no blockchain words in the UI ("account", "balance", "lock", "withdraw"). The devnet disclaimer stays in the footer. Update: landing, How it works, For tenants, For landlords, Get started (no Phantom setup; "Log in with email or Google"), FAQ (cost: the fee rules from D8; card test mode; withdrawal is a demo), Privacy (Privy and Stripe as processors; no more `walletName` in local storage; what Privy stores), Terms (no test faucet; test-mode card payments; fee not refunded).

## 8. Testing

- vitest: pricing (minimum, rounding, card vs bank), IBAN (valid, invalid, masking), `checkoutProblem`, cents conversion, `pickSigningWallet`, updated `friendlyError`.
- Manual end to end on `localhost` then production: Google login as landlord (browser A), email login as tenant (browser B), create deal, pay by card with Stripe's test card, deposit locks without a pop-up, handover on the phone, landlord withdraws; refund path; Phantom login still works. Logins are done by the user (Claude does not sign in to third-party services).
- `npm test`, `npm run lint`, `npm run build` green; Lighthouse on the landing page unchanged (no Privy code in `(site)`).

## 9. Setup the user does

1. Privy: create an app, enable email and Google (Apple left off: it needs Apple developer credentials), set Solana embedded wallets, add allowed domains `http://localhost:3000` and `https://keysfirst.vercel.app`; copy the App ID.
2. Stripe: create an account, stay in test mode, copy the test secret key.
3. Vercel: add `NEXT_PUBLIC_PRIVY_APP_ID` and `STRIPE_SECRET_KEY` (secret) to Production and Preview; locally in `web/.env.local`.

## 10. Out of scope

Real card payouts or bank transfers, a Stripe webhook, a database, emails, bank-transfer pay-in, the landlord covering the fee, holding the first month's rent, KYC.
