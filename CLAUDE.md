# Keysfirst — working notes for AI sessions

- Spec: docs/superpowers/specs/2026-09-27-keysfirst-design.md
- Plan: docs/superpowers/plans/2026-09-27-keysfirst.md (tick checkboxes as tasks complete)
- Devnet only. Never print, paste or commit private keys or seed phrases.
- Program/tests run in WSL: `wsl -d Ubuntu -e bash -lc 'cd /mnt/c/Users/STAGE/Desktop/keysfirst && anchor build && cargo test'`
- Web runs in PowerShell in `web/`: `npm run dev`, `npm test`, `npm run build`, `npm run lint`.
- Ask the user before adding dependencies or changing the deal rules in the spec (section 6).
- UI copy: plain English, no blockchain jargon; amounts in €.
- After each milestone: what works, what doesn't, what's next.
- Deadline confirmed by the sponsor: Sun 4 Oct 2026, 23:59 (German time). Target submission: Sat 3 Oct.
- APP_URL (Vercel production, root dir `web`, public): https://keysfirst.vercel.app
- Phantom domain review form submitted on 2026-09-27 for https://keysfirst.vercel.app (new-domain warning). Re-check the warning before recording the demo.
- Redesign (Sep–Oct 2026): brand "Clear Rules" in docs/brand-guidelines.md, tokens and components in docs/design-system.md (Tailwind v4 @theme in web/src/app/globals.css; only semantic colour utilities exist). Spec: docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md, plan: docs/superpowers/plans/2026-09-28-keysfirst-redesign.md.
- Route groups: web/src/app/(site) = static marketing pages with no wallet code (keep it that way: Lighthouse); web/src/app/(app) = wallet pages under one Providers + connect sheet. Dev galleries at /dev/ui, /dev/deal, /dev/deals (404 in production).
- Links from marketing pages into (app) routes use prefetch={false} (isAppRoute in web/src/lib/site.ts): Next's prefetch pulled ~200 KiB of wallet code into the landing page. Audit and Lighthouse notes: docs/audits/2026-09-28-accessibility.md.
- Deal logic for the UI lives in web/src/lib/deal-view.ts (next-step matrix, tested); never offer an action that rules.ts availableActions() doesn't return.
- Deal copy speaks to the viewer: "you" for yourself, "your tenant" for a landlord's tenant (statusLabel/statusLine/dealRows take the role; a visitor on an unpaid deal is the tenant-to-be). No devnet ribbon: the footer carries the devnet disclaimer.
- Motion (design system §5, §8): marketing heroes use .enter/[--enter-delay], sections data-reveal + ScrollReveal (in the (site) layout); app pages .enter-stack / .step-in; hovers .btn-draw / .link-draw / .card-link plus a base-layer transition on every control. All in globals.css, entrances behind prefers-reduced-motion: no-preference.
- Legal pages (Sep 2026): /impressum, /privacy, /terms in web/src/app/(site); operator details in web/src/lib/legal.ts. The Impressum postal address is still a placeholder: fill it in before submission. Update LEGAL_UPDATED and the privacy policy whenever a new service (analytics, RPC, storage) is added.
