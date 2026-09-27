# Keysfirst — working notes for AI sessions

- Spec: docs/superpowers/specs/2026-09-27-keysfirst-design.md
- Plan: docs/superpowers/plans/2026-09-27-keysfirst.md (tick checkboxes as tasks complete)
- Devnet only. Never print, paste or commit private keys or seed phrases.
- Program/tests run in WSL: `wsl -d Ubuntu -- bash -lc 'cd /mnt/c/Users/STAGE/Desktop/keysfirst && anchor build && cargo test'`
- Web runs in PowerShell in `web/`: `npm run dev`, `npm test`, `npm run build`, `npm run lint`.
- Ask the user before adding dependencies or changing the deal rules in the spec (section 6).
- UI copy: plain English, no blockchain jargon; amounts in €.
- After each milestone: what works, what doesn't, what's next.
