# Docs

Start with the [root README](../README.md). These files record how Keysfirst was designed and built; the code is the source of truth where they differ.

## Current reference

| File | What it is |
|---|---|
| [deployments.md](deployments.md) | Devnet program id, upgrade history, Test EUR mint, faucet wallet, live URLs |
| [superpowers/specs/2026-09-27-keysfirst-design.md](superpowers/specs/2026-09-27-keysfirst-design.md) | Product spec. **§6 (deal rules and invariants) is what the program enforces.** Login, payments and the demo script were later replaced by the euro-experience spec |
| [superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md](superpowers/specs/2026-09-28-keysfirst-euro-experience-design.md) | Email/Google login (Privy), card payment (Stripe test mode), withdraw to bank |
| [research/2026-09-29-country-rules.md](research/2026-09-29-country-rules.md) | Legal deposit caps for the six countries, with sources (research, not legal advice) |
| [brand-guidelines.md](brand-guidelines.md) · [design-system.md](design-system.md) | The "Clear Rules" brand and the tokens and components in `web/` |

## History

Kept as a record of the process; parts are out of date.

| File | What it is |
|---|---|
| [superpowers/specs/2026-09-28-keysfirst-redesign-design.md](superpowers/specs/2026-09-28-keysfirst-redesign-design.md) | Redesign spec (merged 28 Sep, `48d2b21`) |
| [superpowers/plans/](superpowers/plans/) | Step-by-step implementation plans written before each phase and its execution log. Unticked boxes are not a to-do list: the euro-experience plan shipped in `8e4e0ca` without its boxes being ticked |
| [spike.md](spike.md) | Day-1 test of Solana Pay with Phantom on an iPhone; the `/spike` pages it mentions were removed once the real handover shipped |
| [audits/2026-09-28-accessibility.md](audits/2026-09-28-accessibility.md) | WCAG 2.1 AA audit of the redesign and its fixes (28 Sep) |
| [brand/directions/](brand/directions/index.html) | The three brand directions compared on 28 Sep; direction A was chosen |
