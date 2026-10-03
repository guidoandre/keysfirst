# Keysfirst

**The deposit moves only when the keys do.**

Keysfirst protects rental deposits for students and young professionals who rent a room in Europe before they arrive. The tenant pays the deposit into a lock. The landlord receives it only when the tenant confirms the key handover at the door. If the handover never happens, the deposit goes back to the tenant.

Nobody needs a wallet app or crypto: you log in with your email or Google, pay by card, and withdraw to your bank. Solana is the backbone: a public program holds each deposit and pays it out only by its published rules, and Keysfirst has no button to take or redirect it (the one caveat: on devnet the developer still holds the program's upgrade key).

**Live prototype:** https://www.keysfirst.io (Solana devnet and Stripe test mode: no real money moves)

**For judges, where to look:**

- **The rules on Solana:** [`programs/keysfirst/src/instructions/`](programs/keysfirst/src/instructions) (one file per instruction, plus the shared payout in `payout.rs`) and the property tests in [`tests/invariants.rs`](programs/keysfirst/tests/invariants.rs).
- **The deployed program:** [`BeRg2HQ…FLcbP` on Solana Explorer (devnet)](https://explorer.solana.com/address/BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP?cluster=devnet); mint, IDL and upgrade history in [docs/deployments.md](docs/deployments.md).
- **How the web app talks to it:** [`web/src/lib/program.ts`](web/src/lib/program.ts) (reading deals), [`web/src/lib/instructions.ts`](web/src/lib/instructions.ts) (building transactions), [`web/src/lib/rules.ts`](web/src/lib/rules.ts) (the same rules, mirrored for the UI). More in [web/README.md](web/README.md).

## Try it in 5 minutes

You need two logins (two different emails or Google accounts), for example a normal browser window for the landlord and a private window for the tenant.

1. **Landlord:** log in, tap your email at the top right and turn on **Demo mode** (it adds test shortcuts; normal users never see them). Tap **Create a deposit link**, then **Use demo values**: a €600 deposit in Germany, move-in now, and a **5-minute** handover window, so the whole flow fits in one sitting. Share the link (or copy it into the tenant's window).
2. **Tenant:** open the link, log in with the other account and tap **Pay from €621.00 by card**. Stripe's card form opens on the page. Enter a test card, any future date and any three digits, and tap **See my price**: the fee depends on where the card was issued.
   - `4000 0027 6000 0016` (a German card): **€621.00** (deposit €600 + 3.5% fee)
   - `4242 4242 4242 4242` (a US card): **€627.00** (deposit €600 + 4.5% fee)

   Tap **Pay €…**. The deposit locks by itself and the page shows what the card was charged.
3. **At the door:** the landlord taps **Start the handover** and shows a QR code. The tenant scans it with their phone camera (logged in as the tenant), taps **Continue**, then **I have the keys: release the deposit** and **Yes, release it**. On a single computer, the tenant can tap **I have the keys: release the deposit** on their deal page instead. The landlord's screen turns green: paid in seconds.
4. **Withdraw:** the landlord opens **My deals** and taps **Withdraw to bank** (the bank payout is simulated in the prototype).
5. **Test the deadline (refund path):** with Demo mode still on, create a second deal with **Use demo values**, let the tenant pay, and skip the handover. The deal page counts down the 5-minute window. When it hits zero, the deposit can no longer go to the landlord, only back to the tenant:
   - **Right away:** the tenant taps **Take the deposit back**. After the deadline anyone can return it to the tenant; the money can't go anywhere else.
   - **If nobody does:** Keysfirst's daily job returns it the next morning (between 08:00 and 09:00 German time). Leave a paid deal alone past its deadline, and when you come back the next day its page shows the deposit back with the tenant.

   Before the deadline, the landlord can also tap **Give the deposit back to your tenant** at any time. Without Demo mode the shortest handover window is one day, so the deadline can only be tested this quickly with Demo mode on.

A step-by-step guide is at [/start](https://www.keysfirst.io/start).

## How a deal works

| Step | Who | What happens on-chain |
|---|---|---|
| Create | Landlord | A deal account and its vault are created: amount, move-in, handover deadline |
| Fund | Tenant | The exact deposit moves into the vault; whoever pays becomes the tenant |
| Confirm handover | Tenant | From 24 h before move-in until the deadline, the tenant's signature releases the vault to the landlord |
| Refund | Landlord any time; anyone after the deadline | The vault goes back to the tenant. If nobody does it, a daily job (Vercel Cron, signed by the server as "anyone") returns the expired deposits |
| Cancel | Landlord, before anyone paid | The deal closes, no money moves |

No arbiter, no admin key over the vault: the rules are in the program. Full rules: [product spec §6](docs/superpowers/specs/2026-09-27-keysfirst-design.md).

When creating a deal, the landlord picks the country of the room (Germany, the Netherlands, Ireland, Spain, France or Italy) and the app refuses a deposit above that country's legal maximum. Sources: [country rules](docs/research/2026-09-29-country-rules.md).

## What the user sees vs. what runs underneath

| The user | Underneath |
|---|---|
| Logs in with email or Google | [Privy](https://privy.io) creates a Solana wallet for them; actions are signed without pop-ups. Phantom users can log in with their own wallet |
| Never pays network fees | The server tops up each account with a little devnet SOL (`/api/gas`, rate-limited) |
| Pays by card and sees the exact price first | Stripe's card form (Payment Element) on the deal page. The server reads where the card was issued and quotes the price (`/api/checkout/quote`), then charges exactly that amount (`/api/checkout/pay`). It then mints exactly the deposit in Test EUR to the tenant (`/api/checkout/fulfil`, at most once per payment, enforced on-chain), and the deal page locks it in the vault |
| Withdraws to a bank | The Test EUR are burned on-chain; the bank payout is a labelled demo |
| Gets reminded of the handover and the deadline | "Add both dates to your calendar" offers an .ics file built from the deal's on-chain times (`/api/calendar/[id]`; Apple devices open it straight in Calendar) or one Google Calendar link per date |

In a live version the Test EUR would be EURC (Circle's euro stablecoin on Solana), with a licensed partner for card and bank payments.

## Business model

The tenant pays a Keysfirst fee on top of the deposit: **3.5% with a card issued in the EEA, 4.5% with other cards, 2% by bank transfer, minimum €12**. Landlords pay nothing.

- Cards from outside the EEA cost more than twice as much to accept, and Germany's card-surcharge ban covers only EEA consumer cards, so they pay one point more. The tenant sees the exact price for their card before paying.
- The fee is collected separately, so the deposit itself only ever goes to the tenant or the landlord. The fee is not refunded if the deposit comes back.
- Only card payment is switched on in the prototype; the bank-transfer rate is part of the live version.

## Tech stack

- **Program:** Anchor 1.2 (Rust), Token-2022 "Test EUR" (6 decimals), 45 LiteSVM tests. Program id `BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP` (devnet).
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4, `@solana/web3.js`, `@anchor-lang/core`, Privy, Stripe (Payment Element), 172 vitest unit tests. Deployed on Vercel.
- **No database:** deals are read straight from Solana, logins live in Privy, payments in Stripe.

## Run it locally

Program (WSL / Linux, Rust + Solana CLI + Anchor 1.2):

```bash
anchor build && cargo test
```

Web app (`web/`, Node 20.9 or newer; built with Node 24):

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
| `RPC_URL` | Optional, server only. A private RPC for the API routes; falls back to `NEXT_PUBLIC_RPC_URL` |
| `NEXT_PUBLIC_MINT` | Test EUR mint address. `npm run create-test-eur -- https://<your-app-url>` creates it and writes this and `FAUCET_SECRET_KEY` to `.env.local` (the faucet wallet needs 1 devnet SOL first; the script tells you its address) |
| `FAUCET_SECRET_KEY` | Server only. Devnet wallet that is the Test EUR mint authority, pays SOL top-ups and signs the daily return of expired deposits |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id (dashboard.privy.io); add `http://localhost:3000` to its allowed domains |
| `STRIPE_SECRET_KEY` | Server only. Stripe **test** secret key (`sk_test_…`); live keys are refused |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe **test** publishable key (`pk_test_…`) for the card form; live keys are refused |
| `CRON_SECRET` | Server only. Any long random string; Vercel Cron sends it to `/api/cron/return-deposits` (the daily return of expired deposits), which refuses every other caller |

`.env.local` is never committed. On Vercel, set the same variables under Project → Settings → Environment Variables.

## Project layout

```
programs/keysfirst/   Anchor program (instructions: create_deal, fund, confirm_handover, refund, cancel_deal)
web/src/app/(site)/   Marketing pages (no wallet code, fast on phones)
web/src/app/(app)/    App pages: My deals, create a deal, deal page, handover, /start guide
web/src/app/api/      gas, checkout/quote + pay + fulfil + pending, handover (Solana Pay for Phantom), calendar, cron/return-deposits
web/src/lib/          Deal rules, pricing, IBAN, program helpers (unit-tested)
web/src/lib/server/   Server only: faucet, daily keeper, once-only mint proof, rate limits
web/src/content/      Copy and data: fees, FAQ, countries and their deposit caps
docs/                 Specs, plans, research, brand and design system (see docs/README.md)
```

## Limitations (honest list)

- Devnet and Stripe test mode only; no real money moves and the withdrawal payout is simulated.
- The devnet program can still be changed with its upgrade key; a live version would freeze it or put it behind a multisig.
- The country's deposit cap is checked by the app when the deal is created, not by the program.
- Two known program limits, accepted for the prototype and listed in the [product spec](docs/superpowers/specs/2026-09-27-keysfirst-design.md) (§6, invariants):
  - tokens sent to a deal after it has settled can't be moved;
  - the program puts no upper bound on how far ahead a deal's move-in and deadline can be (the deadline is at most 14 days after move-in, and a deal whose deadline is more than 180 days away can't be paid into).
- A live version needs a regulatory check (BaFin: payment services, MiCA for e-money tokens) and a licensed partner for card and bank payments.

Design documents: [product](docs/superpowers/specs/2026-09-27-keysfirst-design.md) · [redesign](docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md) · [euro experience](docs/superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md)

## Licence

Copyright © 2026 Guido Andreini. All rights reserved.

This repository is public so the project can be reviewed; it is **not open source**. You may view the code and run it privately to evaluate the project. Copying, reusing or building on it, or using the Keysfirst name or logo, needs written permission. Full terms: [LICENSE](LICENSE). Requests: info@keysfirst.io
