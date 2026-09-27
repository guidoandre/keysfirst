# Solana Pay spike (Task 1)

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
