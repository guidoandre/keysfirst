# Deployments (Solana devnet)

| What | Value |
|---|---|
| Program id | `BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP` — https://explorer.solana.com/address/BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP?cluster=devnet |
| Upgrade authority | `55NsMRviKQj4K5M97qcsL6AHdME4WJNywXtTyXLUBgVH` (devnet deploy key; see README limitations) |
| Deploy transaction | https://explorer.solana.com/tx/4o8fyKorsDEgj4w3pXC4uGAXsSoKLhstwVBp9pym4b1668294TBtMqyqGvhKcVoaFN1hLPTT3SeAXmBExwtp8Bb5?cluster=devnet |
| Upgrade 2026-09-30 | Slot 505857811 (`anchor deploy --provider.cluster devnet`; the standalone `solana program deploy` CLI rejects Anchor 1.2's SBPF v3). Refund and handover no longer require the landlord/tenant wallets to be System-owned (a landlord could otherwise block every refund); the vault is `init_if_needed`. On-chain binary sha256 `e49f0f34…4295a` matches `target/deploy/keysfirst.so`. |
| IDL (on-chain metadata) | `6XDS1A2GvnWbTGbdiy45nx15dZB9WoTEjQknNFq4Q2zn` — `anchor idl fetch BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP --provider.cluster devnet` |
| Test EUR mint | `5Me8DGHKU8tbr8Q9sUdHMsvtU7Wy4QsnvFvWedGGnfPE` (Token-2022, 6 decimals, symbol tEUR, no freeze authority) — https://explorer.solana.com/address/5Me8DGHKU8tbr8Q9sUdHMsvtU7Wy4QsnvFvWedGGnfPE?cluster=devnet |
| Mint transaction | https://explorer.solana.com/tx/2JU3P2c8aw6hMfP11QrW7rxEmG8Mfc2jrELcfGo3q5Q7Kxgb3xFHf2TbtwLFfjcX1ykwrWRfpDpFmA1hWVcEQbZy?cluster=devnet |
| Faucet wallet (mint authority) | `5s735wKnBWKptwuGp7qSh2YYDNdyUuXhzwafDd2UAZ1b` (funded with 3 devnet SOL; secret only in `web/.keys/` and Vercel env) |
| Web app | https://www.keysfirst.io (keysfirst.io redirects there; https://keysfirst.vercel.app still serves the same deployment) |
| RPC (web app) | Helius devnet (free plan), set in Vercel as `NEXT_PUBLIC_RPC_URL` since 2026-09-27; replaces the public `api.devnet.solana.com`, which rate-limits per network |
