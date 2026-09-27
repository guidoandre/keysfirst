# Keysfirst — Design Spec

Date: 2026-09-27 · Status: approved design (automated, arbiter-free) · Network: Solana **devnet only**

## 1. Challenge and constraints

- Target: Superteam Germany "Build an MVP with Solana at WHU" (https://superteam.fun/earn/listing/build-at-whu).
- Judged on: useful idea, working prototype, clear role for Solana, potential to grow.
- Submission: pitch-deck link (the "Bounty submission link" field), public GitHub repo, follow https://x.com/SuperteamDE. Listing is restricted to participants in Germany.
- Deadline: plan to submit **Sat 3 Oct 2026**, hard stop **Sun 4 Oct 2026 23:59 CET**. The listing page showed "October 08, 2026" on 2026-09-27; confirm with the sponsor (Telegram @merdussss) and treat extra days as buffer.
- Builder: solo business student using AI coding tools (Claude Code + solana.new). Simplest working solution, few dependencies.
- Never mainnet, never real money, never print or commit private keys.

## 2. Problem

International students rent rooms in Germany remotely, before arriving. Fake landlords (Facebook groups, WG-Gesucht, WhatsApp/Telegram) demand the deposit (Kaution) up front and disappear. Platforms like HousingAnywhere protect only bookings made on their platform. German law already says the deposit is not due before the tenancy starts: §551(2) BGB lets the tenant pay in three monthly instalments, the first due at the start of the tenancy, and §551(4) voids any agreement that is worse for the tenant.

## 3. Product in one sentence

A deposit link that locks the money on-chain and releases it to the landlord only when the tenant, standing in the room with the keys, scans the landlord's QR code. If that never happens, the money goes back to the tenant automatically. **The money moves only when the keys do.**

## 4. Core design decision: no arbiter

An automated system cannot observe the physical world, so any automated judge could be fooled with fake evidence, and a landlord-chosen arbiter lets a scammer appoint an accomplice. The only reliable observer is the tenant at the door. Therefore:

1. **Only the tenant's signature at handover pays the landlord** (`confirm_handover`).
2. **Only the clock refunds the tenant**: after the handover deadline, anyone can trigger a full refund (`refund`).
3. **The landlord can always give the money back** (`refund` by the landlord at any time) or cancel an unfunded deal (`cancel_deal`).

Default favours the tenant because the harms are asymmetric: a landlord who never sees a tenant loses nothing but time; a tenant who pays a fake landlord loses the deposit.

The handover is an exchange at the door: the landlord shows the QR code; the tenant inspects the room and scans; the landlord's screen turns "Released" within seconds; only then does the landlord hand over the keys. Solana's fast, irreversible settlement is what makes this safe for the landlord (no bank delay, no card chargeback).

## 5. Roles

| Role | Who | Can do |
|---|---|---|
| Landlord | Person renting out the room (beachhead: outgoing student subletting to an incoming one) | Create a deal; show the handover QR; give the deposit back at any time; cancel before funding |
| Tenant | Whoever funds the deal (open link) | Fund; confirm the handover (scan QR or in-app button); take the deposit back after the deadline |
| Anyone | Any wallet | Trigger the refund to the tenant after the deadline |

There is no arbiter, no admin key, and no config account.

## 6. Deal lifecycle

```
            create_deal (landlord)
                    │
                    ▼
               ┌────────┐  cancel_deal (landlord)  ┌───────────┐
               │  Open  │ ───────────────────────▶ │ Cancelled │
               └────────┘                          └───────────┘
                    │ fund (tenant, exact amount, before deadline)
                    ▼
               ┌────────┐  refund (landlord any time,  ┌──────────┐
               │ Funded │ ───────────────────────────▶ │ Refunded │ → 100% to tenant
               └────────┘   or anyone after deadline)  └──────────┘
                    │ confirm_handover (tenant, from 24h before move-in until deadline)
                    ▼
              ┌──────────┐
              │ Released │ → 100% to landlord
              └──────────┘
```

A deal stores: landlord, tenant, mint, deal id, amount, move-in time, handover deadline, created/funded/settled timestamps, status, PDA bump, title (≤ 64 bytes).

### Rules (program-enforced)

| Rule | Value |
|---|---|
| Amount | > 0, exact amount taken from the deal (fund takes no amount argument) |
| Title | ≤ 64 bytes |
| Handover deadline | after move-in, at most 14 days after move-in, in the future at creation |
| Funding | only while Open, only until the deadline, and only if the deposit would be locked ≤ 180 days; landlord cannot fund own deal |
| Handover confirmation | tenant only, Funded only, from 24 hours before move-in until the deadline |
| Refund | Funded only; landlord at any time; anyone strictly after the deadline; always to the tenant's canonical token account |
| Cancel | landlord only, Open only |
| Settlement | pays out the full vault balance, closes the vault, returns the vault's rent to the landlord; the deal account stays as an on-chain receipt |

### Invariants (tests must prove)

1. The landlord receives money only through the tenant's signature.
2. The tenant never loses money without signing the handover.
3. Money only ever goes to the tenant or the landlord.
4. Each deal settles exactly once.
5. Payout equals everything deposited (no loss, no double payout); donations to the vault are paid out, never stuck.
6. Wrong token, wrong accounts or wrong signers are rejected.
7. Works with both SPL Token (mainnet EURC) and Token-2022 (devnet Test EUR).

## 7. Solana features used (visibly)

- Custom Anchor program with a program-controlled vault (PDA-owned token account). Tests with LiteSVM, including clock manipulation.
- SPL stablecoin: own Token-2022 mint "Test EUR (devnet)" (symbol tEUR, 6 decimals like EURC) with on-chain metadata. Mainnet target: EURC (Circle's MiCA-regulated euro stablecoin). Circle's devnet faucet (20 EURC per 2 h) is too small for a €600 demo.
- Solana Pay transaction request for the handover QR.
- On-chain clock for the deadline and the permissionless refund.
- Solana Explorer (devnet) links for every transaction.

## 8. UX requirements

- Plain language, no jargon: "Waiting for deposit", "Deposit locked", "Released to landlord", "Returned to tenant", "Cancelled".
- Mobile-first; English; amounts in €.
- Deal page: status, timeline with Explorer links, and only the actions valid for the viewer's role right now.
- Landlord QR screen updates live; shows a big "Released — hand over the keys" when the tenant signs.
- In-app "I have the keys — release the deposit" button as the fallback to the QR (same instruction).
- "Get test funds" button (1,000 tEUR + a little devnet SOL) so judges can try the app.
- "Open in Phantom" link for phones (wallet connection from Safari/Chrome on iOS does not work).
- Everything labelled as a devnet prototype with test money.

## 9. Scope

Must: program (5 instructions) + full tests; devnet deploy; Vercel web app (create, fund, deal status, handover QR, in-app confirm, refund, cancel); Solana Pay handover working with Phantom mobile on devnet; faucet; README; deck; demo video.

Should: "Why this exists" landing section; WhatsApp share with preview; optional daily keeper cron (not needed for correctness).

Won't (roadmap only): card/fiat on-ramps, email login/embedded wallets/gasless, landlord verification/KYC, deposit held for the whole tenancy, reputation, mainnet, multiple languages, verified domain, smart-lock integration.

## 10. Known limitations (state honestly)

- A tenant pressured into scanning remotely close to move-in can still be tricked; the 24-hour guard and wallet/UI copy reduce, not remove, this risk.
- At the door the tenant scans first, so a landlord could take the money and keep the keys; this is an in-person theft by an identifiable person at a real address, far rarer than the anonymous online scam.
- Fake copies of the website are out of scope (roadmap: verified domain).
- The escrow proves the room exists and the keys work, not that the person may legally rent it (roadmap: landlord verification).
- Disputes after move-in (damage etc.) are ordinary tenancy law.
- A no-show tenant gets the deposit back; the landlord loses only the reservation time.
- The program is upgradeable by the deploy key on devnet; disclose, roadmap: freeze or multisig.
- Regulatory treatment of the service is not yet assessed.

## 11. Demo script (~90 s)

1. Landlord creates a €600 deal "Room in Vallendar", move-in now, 5-minute demo window; copies the link.
2. Tenant opens the link, connects Phantom, pays: "Deposit locked" + Explorer link.
3. Handover: landlord shows the QR; tenant scans with Phantom mobile and approves; the landlord's screen turns green "Released — hand over the keys" + Explorer link.
4. Second, pre-staged deal: "the room didn't exist", no scan, deadline passed; a third wallet taps "Return the deposit to the tenant"; 100% back to the tenant.
5. Closing line: "No scan, no money. No arbiter, no admin, nobody in the middle."
