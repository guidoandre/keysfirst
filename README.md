# Keysfirst

**The deposit moves only when the keys do.**

Keysfirst protects rental deposits for students and young professionals who rent a room in Germany before they arrive. The tenant pays the deposit into a lock. The landlord receives it only when the tenant confirms the key handover at the door. If the handover never happens, the deposit goes back to the tenant.

Nobody needs a wallet app or crypto: you log in with your email or Google, pay by card, and withdraw to your bank. Solana is the backbone: every deal is an on-chain escrow that no one, including Keysfirst, can redirect.

**Live prototype:** https://www.keysfirst.io (Solana devnet, Stripe test mode: no real money moves)

## Try it in 5 minutes

1. **Landlord:** log in with Google or email, then **Create a deal** (use the demo values for a quick run) and share the link.
2. **Tenant:** open the link in another browser, log in with a different email and tap **Pay €621.00 by card**. On Stripe's test page use card `4242 4242 4242 4242`, any future date and any CVC. The deposit locks automatically.
3. **At the door:** the landlord taps **Start the handover** and shows a QR code; the tenant scans it with the phone camera and taps **I have the keys**. The landlord is paid in seconds.
4. **Withdraw:** the landlord opens the account menu and taps **Withdraw to bank** (the bank payout is simulated in the prototype).

A step-by-step guide is at [/start](https://www.keysfirst.io/start).

## How a deal works

| Step | Who | What happens on-chain |
|---|---|---|
| Create | Landlord | A deal account and its vault are created: amount, move-in, handover deadline |
| Fund | Tenant | The exact deposit moves into the vault; whoever pays becomes the tenant |
| Confirm handover | Tenant | From 24 h before move-in until the deadline, the tenant's signature releases the vault to the landlord |
| Refund | Landlord any time; anyone after the deadline | The vault goes back to the tenant |
| Cancel | Landlord, before anyone paid | The deal closes, no money moves |

No arbiter, no admin key over the vault: the rules are in the program. Full rules: [product spec §6](docs/superpowers/specs/2026-09-27-keysfirst-design.md).

## What the user sees vs. what runs underneath

| The user | Underneath |
|---|---|
| Logs in with email or Google | [Privy](https://privy.io) creates a Solana wallet for them; actions are signed without pop-ups. Phantom users can log in with their own wallet |
| Never pays network fees | The server tops up each account with a little devnet SOL (`/api/gas`) |
| Pays by card | Stripe Checkout (test mode). After payment the server mints exactly the deposit in Test EUR to the tenant (`/api/checkout/fulfil`, at most once per payment), and the deal page locks it in the vault |
| Withdraws to a bank | The Test EUR are burned on-chain; the bank payout is a labelled demo |

In a live version the Test EUR would be EURC (Circle's euro stablecoin on Solana), with a licensed partner for card and bank payments.

## Business model

The tenant pays a Keysfirst fee on top of the deposit: **3.5% by card, 2% by bank transfer, minimum €12**. Landlords pay nothing. The fee is collected separately, so the deposit itself only ever goes to the tenant or the landlord. The fee is not refunded if the deposit comes back.

## Tech stack

- **Program:** Anchor 1.2 (Rust), Token-2022 "Test EUR" (6 decimals), 42 LiteSVM tests. Program id `BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP` (devnet).
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4, `@solana/web3.js`, `@anchor-lang/core`, Privy, Stripe, vitest. Deployed on Vercel.
- **No database:** deals are read straight from Solana, logins live in Privy, payments in Stripe.

## Run it locally

Program (WSL / Linux, Rust + Solana CLI + Anchor 1.2):

```bash
anchor build && cargo test
```

Web app (`web/`, Node 24):

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
npm test && npm run lint && npm run build
```

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_RPC_URL` | Solana devnet RPC (a dedicated key, e.g. Helius, avoids rate limits) |
| `NEXT_PUBLIC_MINT` | Test EUR mint address (`npm run create-test-eur`) |
| `FAUCET_SECRET_KEY` | Server only. Devnet wallet that is the mint authority and pays SOL top-ups |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id (dashboard.privy.io); add `http://localhost:3000` to its allowed domains |
| `STRIPE_SECRET_KEY` | Server only. Stripe **test** secret key (`sk_test_…`); live keys are refused |

`.env.local` is never committed. On Vercel, set the same variables under Project → Settings → Environment Variables.

## Project layout

```
programs/keysfirst/   Anchor program (instructions: create_deal, fund, confirm_handover, refund, cancel_deal)
web/src/app/(site)/   Marketing pages (no wallet code, fast on phones)
web/src/app/(app)/    App pages: My deals, create a deal, deal page, handover
web/src/app/api/      gas, checkout, checkout/fulfil, handover (Solana Pay for Phantom)
web/src/lib/          Deal rules, pricing, IBAN, program helpers (unit-tested)
docs/                 Specs, plans, brand and design system
```

## Limitations (honest list)

- Devnet and Stripe test mode only; no real money moves and the withdrawal payout is simulated.
- The devnet program can still be upgraded by its deploy key; a live version would freeze it or use a multisig.
- A live version needs a regulatory check (BaFin: payment services, MiCA for e-money tokens) and a licensed partner for card and bank payments.

Design documents: [product](docs/superpowers/specs/2026-09-27-keysfirst-design.md) · [redesign](docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md) · [euro experience](docs/superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md)
