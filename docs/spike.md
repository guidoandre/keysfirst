# Solana Pay spike (Task 1)

> Historical record from day 1. The `/spike` pages and `/api/spike` were removed once the real handover (`/deal/[id]/handover`, `/api/handover/[id]`) shipped.

- Date: 2026-09-27
- Wallet: Phantom mobile on iPhone, Testnet Mode → Solana Devnet
- Result: **PASS** — Phantom fetched the transaction from `https://keysfirst.vercel.app/api/spike`, the user signed it, and it landed on devnet.
- Devnet transaction: https://explorer.solana.com/tx/4AEGTF2oZv7kELgAZjDz471jm5qPJA6CCXTj289RXCrQmrxWEQtrXDEBZiAiJdanH8PwcMGWKPosSreiZQrLnzBZ?cluster=devnet (memo "Keysfirst spike: handover test", fee 5,000 lamports)

## Findings that affect the real handover (Task 13) and the demo

1. **Tapping a `solana:` link on the iPhone works**: iOS opens Phantom with "Richiesta di pagamento Solana".
2. **The iPhone Camera app cannot scan the QR** ("Nessun dato utilizzabile"): it does not route `solana:` codes to Phantom.
3. **Phantom's scanner inside "Send" rejects it** ("codice non valido"): that scanner only accepts addresses. Phantom's general scanner (home screen) is still untested.
4. **Phantom shows strong warnings for an unknown site**: "Conferma (non sicuro)" and a checkbox "capisco che continuando potrei perdere tutti i miei fondi". Bad for the demo video; needs a mitigation (e.g. request a Phantom domain review) and must be re-checked with the real program instruction.
5. **Speed matters**: the first attempt did not land because the transaction's recent blockhash expired while the user read the warnings (~60–90 s validity). The handover screen must tell the tenant to approve promptly, and a retry simply re-fetches a fresh transaction.

## Follow-up fix (same day): camera-friendly QR — PASS

The QR on `/spike` now encodes `https://keysfirst.vercel.app/spike/go`. The iPhone Camera opens it in Safari, and the
"Open in Phantom" button hands the `solana:` request to Phantom. Tested on the iPhone: works. Task 13 in the plan now uses
this design (option B below) for the real handover.

## Options for the handover QR on iPhone (decided: B)

- A. Phantom's home-screen scanner, if it accepts `solana:` codes (to test).
- B. QR encodes an `https://keysfirst.vercel.app/...` page (the iPhone Camera opens it in Safari) with a big "Approve in Phantom" button that opens the `solana:` link — one extra tap, works with any camera.
- C. In-app "I have the keys" button (already planned as the fallback).

## Real handover endpoint, scripted check (Task 13 Step 2) — PASS

2026-09-27, local dev server against devnet, with throwaway landlord and tenant wallets (funded by the faucet wallet).
The script created and funded a €600 deal, then called `/api/handover/<deal>` exactly as a Solana Pay wallet does:

- `GET` → `{"label":"Keysfirst key handover", ...}`
- `POST` as the landlord → 400 "Only the tenant who paid the deposit can confirm the handover. Switch Phantom to that wallet."
- `POST` with an invalid address → 400 "Invalid request."
- `POST` as the tenant → 200, a transaction plus the message "Release €600.00 to the landlord. Only approve if you are holding the keys."
- The tenant signed that transaction unchanged → deal `released`, landlord holds 600 tEUR, vault closed.
- `POST` again → 400 "There is no locked deposit to release for this deal."

Deal: https://explorer.solana.com/address/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy?cluster=devnet
Release transaction: https://explorer.solana.com/tx/2htuMct8EphQG9qRW6sVCLriczPM78kBFKDxV2KRv3NMcpsq7E5Cd6aJfULA5L93wZkqJkcVxjb9BYAjKFmFMgeg?cluster=devnet

Still to do: the phone test with Phantom mobile and the iPhone Camera (Task 13 Step 7).

## Real handover on the phone (Task 13 Step 7), first run — PASS

2026-09-27, on https://keysfirst.vercel.app. Landlord created the deal with the Phantom extension on the laptop; the tenant
(Phantom on iPhone) paid inside Phantom's browser, scanned the landlord's QR with the iPhone Camera and approved in Phantom.

- Deal: https://explorer.solana.com/address/BpPSuTQ1DZGaxDrKg3RtyMhgdCAwWuooZ18MBwQy2uZ8?cluster=devnet
- Deposit locked: https://explorer.solana.com/tx/2qcqzVLHnZ1AxmEW2LVwtGEjsmJqdafUaqLJM7HywbDmCcpSD8b4eaMzpcpdhC5bMSUPFkDAr8hza5PLa3ZUCQQt?cluster=devnet
- Released via Solana Pay QR: https://explorer.solana.com/tx/61vM95BVu83Fq6rfJGzrpcGJRjXXWxjYhzx7rjqyw22MDevtb8T8APTgonCNSbk25Hufty6gzCGYBx5QgX2bA9bD?cluster=devnet

Two bugs found and fixed during this run:

1. **"Loading the deal…" forever in Phantom's browser.** The public devnet RPC answered 429 (rate limit per network: laptop and
   phone share the Wi-Fi). Each deal page sent ~30 requests per 10 s, most of them automatic retries. Fixed in `be84556`
   (no retries on 429, no polling in hidden tabs, transaction list fetched only while a timeline link is missing).
   Measured after the fix: ~5–9 requests per 10 s while visible, 0 while hidden. For the demo, use a dedicated devnet RPC.
2. **Red "account to be already initialized" after the release.** The tenant's page had been in the background during the
   scan and still showed "I have the keys"; tapping it tried a second settlement, which the program rejected before sending
   (no failed transaction on-chain). Fixed in `7fae92b`: buttons re-check the live status first, and the raw error reads
   "This deal has already been settled".

Negative check (same evening) — PASS: a second deal was funded by the tenant, then the QR was scanned with a different
Phantom account. Phantom showed only its own generic error ("could not load this transaction request… QR expired, invalid or
server unavailable"), offered no approve button, and the landlord's page stayed on "Deposit locked". Switching back to the
tenant account and approving released the deposit.

Observations for the demo:

- Phantom still shows the "unsafe" warning when approving the release (domain review submitted 2026-09-27, pending).
- Phantom does not display the endpoint's refusal message, only its generic error, so the hand-off page should tell the tenant
  which wallet to use.
- Phantom draws the request icon as a black square: it does not render `icon.svg`; a PNG icon should fix it.
