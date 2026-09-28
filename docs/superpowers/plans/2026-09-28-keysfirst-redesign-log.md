# Keysfirst redesign — execution log

Copied from the subagent-driven-development ledger when the redesign was merged into main (2026-09-28, merge 48d2b21). It records every task's commits and review outcome, the controller's rulings (decisions made without asking, with their reason and cost if wrong) and the minors deliberately deferred. The ledger itself lived in the git-ignored .superpowers/ workspace, which is deleted after the merge.


Spec (binding authority): docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md
Branch start (merge-base with main): f027f78

## Setup

- Ruling: work in the main checkout on branch `redesign`, no extra worktree — the user asked to "build on a branch named redesign"; a worktree would need a second npm install and a copy of web/.env.local (secrets) — cost if wrong: none, main stays untouched either way.

## Pre-flight scan

### Task pairs sharing a file or interface

| Tasks | Shared file / interface | Produces → consumes | Finding |
|---|---|---|---|
| T1 ↔ T4 | web/src/app/layout.tsx, ./providers import | T1 edits layout (keeps Providers, WalletButton); T4 git-mvs providers and replaces the layout | consistent |
| T1 ↔ T2 | web/vitest.config.ts | T2 adds `env: { TZ: "UTC" }` | consistent |
| T2 ↔ T3 | Icon / Pictogram names | T2 defines; T3 uses spinner, external, check, close, alert, info, return, hourglass, lock, copy + all pictograms | consistent |
| T2 ↔ T7 | web/src/lib/hooks.ts | T7 appends useWakeLock (useEffect already imported there) | consistent |
| T3 ↔ T4 | web/src/app/dev | T3 creates dev/ui; T4 git-mvs dev → (app)/dev | consistent |
| T3 ↔ T6 (↔ T10) | EmptyState title heading | T3 renders the title as h2; T6 DealMessage uses it as the page's only heading | conflicts with spec §10 "one h1 per page" → R2 |
| T4 ↔ T6 | components/DealActions.tsx | T4 rewires imports; T6 deletes the file | consistent |
| T4 ↔ T9 | (app)/new/page.tsx | T4 rewires imports; T9 replaces the page | consistent |
| T4 ↔ T11 | (site)/page.tsx | T4 strips wallet widgets; T11 replaces the page | consistent |
| T4 ↔ T10 | /deals?login=1 | T4's verification expects /deals?login=1 to open the sheet, but /deals exists only after T10 | plan self-conflict → R3 |
| T5 ↔ T6 | deal-view exports, useDeal return shape | T6 destructures address, deal, signatures, loadError, statusChanged, refresh | consistent |
| T6 ↔ T7 | DealClient.tsx quoted strings; dev/deal/DealGallery.tsx | every string T7 replaces exists verbatim in T6's code (import, useDeal line, useState line, onAction block, copy line, temporary QR block) | consistent |
| T6 ↔ T14 | (app)/deal/[id]/page.tsx openGraph lines | T14 replaces the exact comment + images + return lines T6 writes | consistent |
| T9 ↔ T6 | `?created=1` | CreateDealFlow pushes it; DealPage reads searchParams.created | consistent |
| T10 ↔ T5 | DealData, dealPhase | dashboard builds on them | consistent |
| T11 ↔ T15/T16/T17 | content/faq.ts, content/scenarios.ts, SectionHeader, FaqList, ScenarioGrid, CtaBand, AskLandlord | anchors #limits (T15) and #devnet (T11 FAQ data) exist; no duplicate ids on the landing (scenario ids vs FAQ ids) | consistent |
| T13 ↔ T4 | SiteHeader in not-found | consistent |
| T14 ↔ T17 | ogCard, OG_SIZE, OG_CONTENT_TYPE | consistent |
| T14 ↔ Global Constraints | ogCard kicker uses textTransform uppercase; deal preview passes STATUS_LABEL as kicker | conflicts with "status labels … never uppercased" → R4 |

### Per-task self-consistency

| Task | Tests vs code / files vs later edits | Finding |
|---|---|---|
| T1 | cx, siteUrl tests match code; layout keeps imports that still exist | ok |
| T2 | recomputed: formatCountdown(3660)="1 h 1 min", (252)="4 min 12 s", (240)="4 min"; formatShortDateTime UTC/Berlin; shortAddress; whatsappUrl encoding | ok |
| T3 | UI only; gallery imports exist | ok |
| T4 | verification step uses /deals?login=1 before /deals exists | → R3 |
| T5 | recomputed dealPhase boundaries, nextStep messages (Wed 30 Sep 14:00, Thu 1 Oct 14:07), countdown labels, dealRows states | ok |
| T6 | DealClient hooks before early returns; gallery covers all 9 phases | ok |
| T7 | dynamic HandoverMode mounted after first open (plan patched before dispatch) | ok |
| T8 | blocker() covers every status | ok |
| T9 | byte counts (ü×33 = 66 bytes), demo window 300 s, Set spread OK at ES2020 | ok |
| T10 | recomputed sort order act, waitSoon, waitLater, renting, done; "Payment closes in 8 days"; "Handover opens in 1 day" | ok |
| T11 | heading order and ids on the landing | ok |
| T12 | ok | ok |
| T13 | not-found uses a raw `<title>`; bundled docs document metadata only for global-not-found | → R5 |
| T14 | kicker uppercase vs status label | → R4 |
| T15–T17 | ok | ok |
| T18–T20 | process tasks | ok |

### Rulings

- R2 Ruling: EmptyState gets `headingLevel?: "h1" | "h2"` (default "h2") in T3, and DealMessage (T6) passes "h1" — spec §10 wants one h1 per page and the deal's invalid/not-found states have no other heading — cost if wrong: one extra prop.
- R3 Ruling: T4 verifies `?login=1` on `/new?login=1` (exists in the app group); the site header's "Log in" → `/deals?login=1` is verified in T10 — cost if wrong: none.
- R4 Ruling: ogCard's kicker drops `textTransform: "uppercase"` (keeps letterSpacing) so a deal preview shows "Released to landlord" exactly; T14's verification expects that casing — Global Constraints: status labels never uppercased — cost if wrong: page kickers look slightly less like labels in previews.
- R5 Ruling: in T13 first try `export const metadata: Metadata = { title: "Page not found" }` in not-found.tsx; if the build rejects it or the tab title isn't "Page not found · Keysfirst", fall back to the plan's `<title>` element — the bundled docs only document metadata for global-not-found — cost if wrong: a wrong tab title on the 404 page.

## Progress
- Ruling: subagent commits keep the trailer their own harness gives them (e.g. Claude Sonnet 5) instead of the plan's literal Opus 5.5 line — accurate attribution of who wrote the code — cost if wrong: cosmetic commit-message inconsistency.
Task 1: minor (deferred): siteUrl tests don't cover VERCEL_ENV=development explicitly (falls through to preview URL branch)
Task 1: ⚠️ browser runtime checks resolved from the report's evidence (computed font-family, local woff2 @font-face, scrollWidth, console)
Task 1: complete (commits c0d4cd1..b206f0f, review clean)
Task 2: Ruling: pictograms keep the plan's 56-unit viewBox; brand-guidelines §5 and design-system (Pictogram row, Icon row, ButtonLink external icon) now describe the built set (c5151ab) — code and plan agree and the SVG scales to any size; redrawing 11 pictograms buys nothing visible — cost if wrong: construction notes differ from the original board.
Task 2: minor (deferred): INK/MARKER hex duplicated in Logo.tsx and Pictogram.tsx (hex kept on purpose: link-preview images can't read CSS variables)
Task 2: minor (deferred): LogoMark `simplified` is manual; callers under 24 px must pass it
Task 2: minor (deferred): some pictogram interior strokes are 3 units (now documented as interior detail)
Task 2: complete (commits b206f0f..c5151ab, review approved; plan-mandated grid finding resolved by ruling)
Task 3: minor (deferred → Task 18 audit): Timetable rows convey done/next/later only visually (the "now" row has aria-current="step")
Task 3: minor (deferred): CopyField's 2 s "Copied" timeout is never cleared (harmless no-op after unmount)
Task 3: complete (commits c5151ab..d381cda, review approved, R2 applied)
Task 4: deviation accepted: SiteHeader "Get started" uses max-sm:hidden (brief's `hidden sm:inline-flex` lost to buttonClass's inline-flex); the plan has no other hidden+display pair on a buttonClass element
Task 4: Ruling: fix the plan-mandated silent connect failure now (WalletProvider onError → friendlyError message → danger Callout in the open ConnectSheet, cleared on open and on each new choice) — a silent revert after a rejected or failed Phantom connect is exactly the confusion the demo can't afford — cost if wrong: ~30 lines across providers/ConnectProvider/ConnectSheet
Task 4: fix round 1 (resume implementer): connect errors shown in the sheet
Task 4: fix round 1 re-review: finding addressed, no new breakage (3a791cc)
Task 4: complete (commits d381cda..3a791cc, review approved after 1 fix round); plan ticks 51ff6db; branch pushed for the M1 Preview
Task 5: Ruling: (plan-mandated Important) the landlord's refund after the deadline gets no confirmation, as spec §6.4's funded-expired row shows — confirmCopy gains an optional 4th param `expired = false` (landlord refund → null when expired) with a test, and DealClient passes isExpired(); carried by Task 6, the consumer that already edits this flow, instead of a separate fix round — once the deadline has passed the money can only go to the tenant, so the dialog guards nothing — cost if wrong: one extra dialog-free tap path
Task 5: minor (deferred): dealRows shows the "deposit locked" row as "now" during open-too-early (deadline > 180 days away) while nextStep offers no payment yet
Task 5: minor (deferred): test gaps — ROLE_LINE, handover row "next" state, exact boundaries at handoverOpensAt and deadline − MAX_LOCK_DURATION, message strings for open-too-early/funded-window/funded-expired/refunded
Task 5: minor (deferred): spec §6.4 prose omits the open-too-early phase that the code (correctly) has
Task 5: complete (commits 51ff6db..d30daf6, review approved; Important finding carried into Task 6 by ruling)
Task 6: Ruling: (plan-mandated Important) /dev/deal shows two h1s (gallery title + DealHero) — Task 7 replaces DealGallery.tsx anyway, so its title becomes a <p> with the same classes; the deal's own h1 stays the page heading — cost if wrong: none (dev-only page)
Task 6: minor (deferred): no test covers DealClient's isExpired → confirmCopy wiring (pure confirmCopy is tested)
Task 6: complete (commits d30daf6..2c33f2e, review approved; gallery h1 fix carried into Task 7)
- Ruling: pipeline — the next task's implementer may run while the previous task's reviewer (read-only) runs, only when their files don't overlap and never two implementers or a fix round at once (shared checkout and .next build dir) — saves ~12 min per task against the Thu deadline — cost if wrong: a fix round waits for the running implementer to finish
Task 7: implementer done (becc72b); review dispatched, Task 8 implementer dispatched in parallel (disjoint files: handover/page.tsx only), Task 8 BASE becc72b
Task 8: implementer done (53dc8cc); review dispatched. Task 9 implementer dispatched in parallel (new-deal.ts, (app)/new/*), Task 9 BASE 53dc8cc
Task 7: review approved with one plan-mandated Important: the wake lock ends when the Released screen appears
Task 7: Ruling: fix it — ReleasedScreen calls useWakeLock(open) (no interface change; it already has `open`), and role="status" moves from the whole container to the announcement text (plan-mandated Minor, same file) — the landlord's screen must stay on while "Released: hand over the keys" is shown — cost if wrong: ~3 lines; fix round 1 waits until the Task 9 implementer finishes (shared checkout)
Task 7: minor (deferred): DealGallery effectiveRole line rewrapped without being listed (whitespace only)
Task 8: review approved with one plan-mandated Important: the server-side deal read on the hand-off page has no timeout, so a hanging RPC blocks the tenant at the door instead of falling back to the checklist + approve button
Task 8: Ruling: fix it — loadDeal races the read against a 3 s timeout and falls back exactly like an RPC error (data undefined → checklist + "Approve in Phantom") — the approve link must never wait on a slow devnet RPC — cost if wrong: on a very slow RPC the page shows no deal summary
Task 8: minor (deferred): "The handover opens {time}." vs "released … on {time}." wording (matches spec §6.4's style; kept)
Task 7+8: fix rounds batched into one resumed implementer after Task 9's implementer finishes (shared checkout, one build)
Task 9: implementer done (13a1dae); review dispatched
Open item (for Task 18 / final review): with the browser's mobile (Android) emulation, every (app) page logs "Uncaught (in promise) WalletConnectionError: Local Network Access permission denied" — wallet-adapter-react auto-selects the Solana Mobile Wallet Adapter on Android and autoConnect tries it; pre-existing behaviour (old app had the same provider), not visible to users; decide whether to gate autoConnect for the mobile adapter
Open item resolved: the "WalletConnectionError: Local Network Access permission denied" console error was a test-browser artifact — an earlier check under Android emulation picked "Mobile Wallet Adapter" in the connect sheet, so localStorage walletName="Mobile Wallet Adapter" made every emulated-Android load auto-connect it (the sandbox denies Local Network Access). Key cleared; the library's default walletName is null, so real visitors don't auto-connect it. Future dispatches: clear localStorage "walletName" if that error appears after selecting a wallet in mobile emulation.
Task 7+8: fix round 1 done (ae5311a Task 7, 5e40d1c Task 8); scoped re-review dispatched; Task 10 implementer dispatched, BASE 5e40d1c
Task 7+8: fix round 1 re-review: all findings addressed, no new breakage
Task 8: minor (deferred): the 3 s timeout timer isn't cleared when the read wins (harmless no-op reject; tidy with clearTimeout in the final wave)
Task 7: complete (commits 2c33f2e..becc72b + fix ae5311a, review approved after 1 fix round)
Task 8: complete (commits becc72b..53dc8cc + fix 5e40d1c, review approved after 1 fix round)
Task 9: Ruling: (plan-mandated Important) the create flow doesn't move focus to the step heading on Next/Back — deferred to Task 18 (the WCAG audit task, which already keyboard-tests /new) with the exact fix carried in its dispatch: h1 gets tabIndex={-1} + ref, focused in an effect when `step` changes (not on first render) — avoids a fix round while Task 10 runs in the shared checkout — cost if wrong: the gap lives ~1 day longer on the branch
Task 9: minor (→ Task 18): `accent-[var(--k-ink)]` on the demo checkbox should be the semantic `accent-fg`
Task 9: minor (→ Task 18): "Use demo values" hint says "€600" — use "€600.00"
Task 9: minor (deferred): client-side deadline check isn't re-sampled right before signing (5-minute demo window only; program rejects with a readable message)
Task 9: complete (commits 53dc8cc..13a1dae, review approved; Important deferred to Task 18 by ruling)
Task 10: implementer done (f4ac3b4); review dispatched
Task 11: Ruling: WhySolana's "A clock nobody controls" becomes "The clock decides, not a person" — the devnet program is upgradeable, so absolute "nobody" claims stay out (Global Constraints honesty line) — cost if wrong: a slightly less punchy heading
Task 11: implementer dispatched in parallel with the Task 10 review (disjoint files), BASE f4ac3b4
Task 10: review approved with one plan-mandated Important: spec §6.7's no-deals state wants the tenant path "Waiting for a link? It appears here once you pay" plus "Ask your landlord"; the brief's empty state has only "Create a deposit link"
Task 10: Ruling: fix after Task 11 lands (it creates AskLandlord): the no-deals state keeps its title, copy and "Create a deposit link" action and adds the AskLandlord block for tenants below it — spec §6.7 is binding and the share is the tenant's only next step there — cost if wrong: one extra block on an empty page
Task 10: minor (deferred): A→B→A quick wallet switch can show the staler of two same-wallet fetches (self-corrects on refresh)
Task 10: minor (deferred): no test for sortDeals' done-group ordering; urgencyOf computed twice per deal; long card link names (Task 18 may shorten)
Task 11: implementer done (92d4955; landing JS 587 KB raw / 182 KB gzip, no wallet code); review dispatched; implementer flagged "Hi!" in the AskLandlord message
Task 11: Ruling: the AskLandlord message opens with "Hi," not "Hi!" — Global Constraints: no exclamation marks, and the pre-filled message is product copy — cost if wrong: a slightly flatter greeting; applied in Task 11's fix round together with Task 10's AskLandlord addition
Task 12: implementer dispatched in parallel with the Task 11 review (disjoint files), BASE 92d4955
Task 12: implementer done (5377277); review dispatched. Task 10+11 combined fix round dispatched to the Task 11 implementer (fix base 5377277)
Task 10+11: fix round 1 done (d1a1ec3 Task 11 A+B, 6a2b3f6 Task 10 C); re-review dispatched; Task 13 implementer dispatched, BASE 6a2b3f6
Task 10+11: fix round 1 re-review: all findings addressed, no new breakage
Task 11: minor (open, controller fixes between implementers): the message now reads "Hi, Could we…" — lowercase "could" after the comma
Task 11: minor (deferred): CtaBand's aria-labelledby names only the first of its two h2s; landing scenarios render in SCENARIOS order, not LANDING_SCENARIO_IDS order (same today)
Task 10: complete (commits 5e40d1c..f4ac3b4 + fix 6a2b3f6, review approved after 1 fix round)
Task 11: complete (commits f4ac3b4..92d4955 + fix d1a1ec3, review approved after 1 fix round)
Task 12: review: Needs fixes — plan-mandated Important: the "Try both sides" step omits the tenant's "I have the keys" alternative that spec §6.2 point 4 requires (the solo tester's path without a second device)
Task 12: Ruling: the tenant paragraph gains one sentence: "Or, once the handover window is open, tap “I have the keys: release the deposit” on the deal page." — spec §6.2 is binding — cost if wrong: one more sentence in the step; fix round 1 (Task 12 implementer) after Task 13's implementer finishes, batched with Task 11's "Hi, could" typo
Task 12: minor (deferred): phantom.com/download hard-coded in three places; SVGs use aria-label without <title> (valid)
Task 13: implementer done (f1e94df; R5 outcome: metadata export kept, tab title verified); review dispatched
Task 13: concern (dev-only): notFound() inside the (app) group (only the /dev/* galleries in production) renders AppHeader + the 404's own SiteHeader, and the tab title reverts after hydration — real unmatched URLs are correct; deferred as minor unless the review says otherwise
Task 12 fix round 1 (+ Task 11 "Hi, could" typo) dispatched to the Task 12 implementer
Task 12: fix round 1 done (3cdcb33, includes Task 11's 'Hi, could'); re-review dispatched; Task 14 implementer dispatched, BASE 3cdcb33
Task 12: fix round 1 re-review: all findings addressed, no new breakage (3cdcb33; also closes Task 11's "Hi, could" minor)
Task 12: complete (commits 92d4955..5377277 + fix 3cdcb33, review approved after 1 fix round)
Pushed 51ff6db..3cdcb33 to origin/redesign (Tasks 5–12 reviewed) for the M2–M4 Preview; Preview URL still unknown (asked the user)
Task 13: Ruling: (plan-mandated Important ×2) (a) notFound() inside (app) renders two headers + two id="main" — only the /dev/* galleries can reach it in production, so deferred (minor); (b) root error.tsx renders ErrorView without a <main id="main"> (only reachable when a group layout itself throws) → carried into Task 18: the root error.tsx wraps ErrorView in <main id="main" className="flex-1"> — cost if wrong: a rare error page lacks a landmark until Task 18
Task 13: minor (deferred): global-error has no devnet ribbon (inherent: it replaces the root layout)
Task 13: complete (commits 6a2b3f6..f1e94df, review approved; R5 → metadata export kept)
Task 14: implementer done (c759e95; fixed a brief bug: Fragments inside <svg> made /icon.png answer 500); review dispatched. Task 15 implementer dispatched in parallel, BASE c759e95
Task 15: implementer done (c488b88); review dispatched. Task 16 implementer dispatched in parallel, BASE c488b88
Task 14: Ruling: (plan-mandated Important) (a) sitemap lists /tenants, /landlords, /about before Task 17 builds them — self-heals with Task 17; if Tier 3 is cut, drop the cut pages from sitemap.ts (cut rule); (b) a failed TTF read throws out of every OG route (the deal fallback reuses the same rejected promise) → carried into Task 17 (it adds more ogCard routes): displayFont becomes `readFile(...).catch(() => null)` and ogCard omits `fonts` when it's null, so previews degrade to the default font instead of a 500 — cost if wrong: a plainer preview when the font file is missing
Task 14: minor (deferred): /icon.png has no Cache-Control; the mark geometry is duplicated in icon.png/apple-icon/og; no tests for the kicker/timeout paths; the deal OG alt text is generic; manifest icons and favicon sizes follow the brief, not spec §8's older sentence
Task 14: complete (commits 3cdcb33..c759e95, review approved; brief bug fixed: Fragments inside <svg> broke /icon.png)
Task 16: implementer done (af47552); review dispatched. Task 17 implementer dispatched in parallel (all of Tier 3; carries Task 14's font-fallback fix), BASE af47552
Task 15: review: Needs fixes — the page says three times that only the clock/deadline sends the deposit back, but the landlord can give it back at any time (product spec §6 Refund rule, rules.ts, and the page's own rule list)
Task 15: Ruling: replacement copy (plan text came from product spec §4's shorthand; §6 is the rule) — meta description: "Two rules and a clock: only the tenant's approval at the handover pays the landlord; otherwise the deposit goes back to the tenant, at the deadline or earlier if the landlord returns it. Plus the honest limits." · hero lead: "Keysfirst doesn't decide any deal. A public program on Solana applies the same rules to every deal: only the tenant's approval at the handover pays the landlord. Otherwise the deposit goes back to the tenant, when the deadline passes or earlier if the landlord gives it back." · no-arbiter: "So only the tenant's approval pays the landlord, and without it the deposit goes back to the tenant when the clock runs out, or earlier if the landlord gives it back." — a public safety page must not misstate the rules — cost if wrong: longer sentences; fix round 1 after Task 17's implementer finishes
Task 16: Ruling: (plan-mandated Important) OpenHashDetails opens and scrolls to the answer but doesn't move focus → carried into Task 18: after opening, focus the entry's <summary> with { preventScroll: true }; also wrap decodeURIComponent in try/catch (Minor, same file) — cost if wrong: keyboard/screen-reader users land on the answer a day later
Task 16: complete (commits c488b88..af47552, review approved; focus fix carried to Task 18)
Task 17: implementer done (1cd19a0); review dispatched. Task 15 fix round 1 dispatched to the Task 15 implementer (fix base 1cd19a0)
Task 15: fix round 1 done (8b36850); re-review dispatched. The implementer's grep found one more false claim in Task 17's file: how-it-works/opengraph-image.tsx subtitle "Only the tenant's scan pays the landlord. Only the deadline sends the deposit back."
Task 17: Ruling: that OG subtitle becomes "Only the tenant's approval pays the landlord. Otherwise the deposit goes back to the tenant." — same rule as Task 15's copy fix — goes into Task 17's fix round (or Task 18 if Task 17 needs no other fix)
Task 15: fix round 1 re-review: finding addressed, no new breakage (8b36850)
Task 15: minor (deferred): the rule list omits the 64-byte title limit (a form rule, enforced by the create flow)
Task 15: complete (commits c759e95..c488b88 + fix 8b36850, review approved after 1 fix round)
Task 17: review: Needs fixes — the How it works preview subtitle claims "Only the deadline sends the deposit back" (plan-mandated; ruling above); the report's copy self-check missed it
Task 17: fix round 1 dispatched (subtitle copy + og.tsx fontFamily only when the font loaded)
Task 17: fix round 1 done (3b2210d); re-review dispatched
Task 18: Ruling: the audit notes file uses the real date, docs/audits/2026-09-28-accessibility.md (the plan's 2026-10-01 name assumed a later day); Task 19 appends its Lighthouse section there — cost if wrong: a file name differs from the plan
Task 18 implementer dispatched (opus: judgment-heavy audit across all pages), BASE 3b2210d, with carried items from Tasks 3, 9, 10, 13, 16
Task 17: fix round 1 re-review: all findings addressed, no new breakage (3b2210d)
Task 17: complete (commits af47552..1cd19a0 + fix 3b2210d, review approved after 1 fix round; nothing cut from Tier 3)
Task 18: implementer done (c7fac6f; 15 findings fixed incl. known items 1-5; audit notes docs/audits/2026-09-28-accessibility.md); review dispatched
Plan ticks for Tasks 5–17 committed (0bf5dc2); Task 8 Step 4 (phone check) and Task 14 Step 11 (Preview checks + WhatsApp card) stay open until the user provides the Preview link
- Ruling: run the final whole-branch review right after Task 18, before Task 19 (Lighthouse on the Preview) and Task 20 (user's Phantom regression + merge) — both need the user and the Preview link, and they should measure and test the final code, not code the final review may still change — cost if wrong: none (Tasks 19–20 are measurement and user steps)
Task 18: complete (commits 3b2210d..c7fac6f, review approved; minors: Released-screen 6 px target gap not in the audit's open items; findings table has no per-row commit column)
Final whole-branch review dispatched (opus) on f027f78..0bf5dc2; pushed 3cdcb33..0bf5dc2 (Tasks 13–18 + ticks) for the Preview
Vercel connector connected by the user: team "ATLAS" (slug atlas-fee2, team_9Zg8ZEkoC4CtW2C2F4jc91UD); Preview branch URL https://keysfirst-git-redesign-atlas-fee2.vercel.app (latest build dpl_5GtfKsMAxnVyGPmKNUQTbrYT3RMv for 0bf5dc2, READY). Checks: / → 200 (no Vercel Authentication), /api/handover/<released deal> → label + Preview icon URL, /api/faucet config present (invalid address → 400, not "not configured"). M1 Preview check done.
Task 19: baseline (PSI web UI; the PSI API's shared anonymous quota was exhausted) on the Preview landing, mobile: Performance 85, Accessibility 100, Best practices 100, SEO 100; FCP 1.0 s, LCP 4.1 s (LCP element = hero h1, render delay 2.4 s), TBT 50 ms, CLS 0, SI 3.8 s; JS transfer ~322 KB in 5 first-party chunks incl. a fully unused 93.7 KB chunk (suspect Link prefetch of (app) routes); vercel.live toolbar on Previews only; legacy JS 14 KB
- Ruling: start Task 19 now, in parallel with the read-only final review (the final fix wave waits for it), and let the Task 19 implementer push `redesign` to measure on the Preview — Previews only, production untouched, the user's process pushes this branch — cost if wrong: extra Preview builds
Task 19 implementer dispatched (opus: bundle investigation + judgment), BASE 0bf5dc2
Final review (opus, f027f78..0bf5dc2): With fixes — Important: (1) Released screen can vanish for good after one stale/out-of-order poll (Sheet calls onClose on programmatic close → releasedClosed; useDeal accepts backwards statuses); (2) logged-out viewers of an open/locked deal with no primary action get no log-in / Open in Phantom prompt (regresses global constraint 3; spec §6.4 table dropped it); (3) copy misstates rules ("automatic" return — there is no keeper bot; scan-only payment claims ignore "I have the keys"; tenants page door order "take the keys, then scan"). Minors 4–13 listed in the review.
- Ruling (final fix wave, one dispatch after Task 19's implementer finishes, opus): fix Important 1–3 plus Minors 4 (share box also while open-too-early), 5 (handover mode closes once the deadline passes), 6 (hand-off page: invalid id → "This isn't a valid deal link", not the approve button), 7 (shared withTimeout helper that clears its timer, used by the hand-off page, the deal OG image and the deal page's generateMetadata), 8 (/icon.png rounds size), 11 ("100%" → "The whole deposit"; ErrorView keeps only "Nothing moves without your approval in Phantom."). Global constraint 3 (the user's brief) outranks the spec table for Important 2. Skipped: 9 (disputed: Wallet Standard adapters vanish with the extension, and connect errors deselect), 10 (unused dependency: harmless, removal not asked for), 12 (focus after log-in → Task 20 VoiceOver note), 13 (controller ticks Task 18). — cost if wrong: one more fix round
- Copy rulings for Important 3 (exact strings): FACTS "Automatic return after the deadline" → "After the deadline it can only go back to the tenant"; RulesTimetable "€600.00 comes back to you, automatically." → "Take the €600.00 back with one tap."; scenario rule "The clock returns the deposit; nobody has to decide." → "After the deadline, anyone can send the deposit back to the tenant; nobody has to decide."; root description "…only when the tenant scans their code at the key handover; otherwise the deposit goes back." → "…only when the tenant confirms the key handover; otherwise the deposit goes back."; deal OG subtitle → "Protected by Keysfirst: the landlord is paid only when the tenant confirms the key handover."; deal page description → "Protected by Keysfirst: the landlord gets the deposit only when you confirm the key handover."; faq "what" answer → "…The landlord receives it only when the tenant confirms the key handover, by scanning the landlord's code at the door or tapping “I have the keys”. If that never happens, the deposit goes back to the tenant: the landlord can return it at any time, and after the deadline anyone can."; deal-view open message → "Pay ${amount} into the lock. The landlord gets it only when you confirm the key handover at the door. If that doesn't happen by ${deadline}, you can take it back." (update its test); AudienceSplit scan step → "Check the room, then scan the landlord's code or tap “I have the keys”. Only then are they paid. No handover? You take it back after the deadline."; tenants door step → "Look at the room, then scan the landlord's code and take the keys. The landlord is paid only then."; how-it-works "100% goes to the landlord, in seconds." → "The whole deposit goes to the landlord, in seconds." and "100% goes back to the tenant. Anyone can trigger it." → "The whole deposit goes back to the tenant. Anyone can trigger it."
Task 19: implementer done (aa1ea8b prefetch={false} on (site) links into (app) routes; dae15d7 audit notes); mobile landing on the Preview: 85/100/100/100 → 96/100/100/91*, 96/100/100/100, 94/100/100/100 (*one-off robots.txt fetch timeout); LCP 2.7–2.9 s, TBT ≤ 50 ms, CLS 0, page weight 516 → 278 KiB. Pushed (Preview READY on dae15d7). Review dispatched.
Final fix wave dispatched (opus), fix base dae15d7; adds Task 19 concern 1: an (app)/loading.tsx so taps from marketing links into wallet pages show feedback while their code loads
Task 19: review: Needs fixes — not-found.tsx's /deals and /start ButtonLinks still prefetch (audit note overclaims "every marketing link"); minor: tenants NEEDS links hardcode prefetch={false} instead of isAppRoute
Task 19: Ruling: folded into the running final fix wave (message sent) — same pattern, tiny, and the final re-review covers it — cost if wrong: none
Final fix wave done: de460f3 (Released screen: monotonic polls + user-only dismissal, tested), ddb98ed (logged-out log-in path), 1cae6cf (copy), 2607e4c (small fixes incl. 404 prefetch); 72 tests pass. Deviation: no (app)/loading.tsx — measured: it outlines /start (~13 KB > React's 12.8 KB progressive chunk) so every direct load flashes a skeleton ~300 ms, and it never shows on taps because the router waits for the (app) layout's ~155 KiB gz client code
- Ruling: accept dropping (app)/loading.tsx; instead ButtonLink shows a pending spinner via next/link's useLinkStatus when its prefetch is off (the (site) → (app) CTAs), icon aria-hidden, static under reduced motion, label unchanged — a tap on "Create a deposit link" must visibly respond on a slow phone — cost if wrong: a tiny client component on marketing pages
- Ruling: the implementer's kept copy (landlord-facing "goes back to the tenant after the deadline", How it works Released card naming the scan) stays — those are outcome descriptions, not "only"/"automatic" claims; How it works and the FAQ spell out that anyone can trigger the return
Final fix wave: + 59058aa (useLinkStatus spinner on non-prefetched ButtonLinks; landing JS 146,930 → 146,405 B gz); scoped re-review dispatched (opus) on dae15d7..59058aa
CLAUDE.md redesign notes committed (db0cad6) — Task 20 Step 3
Final fix wave re-review (opus): all findings addressed, no new Critical/Important breakage; 72 tests pass
- Ruling (residuals): the controller fixed the re-review's out-of-scope copy minors directly — landing and tenants "paid when you scan…, otherwise" → "paid when you confirm the handover at the door"; How it works description/lead/no-arbiter no longer read as an automatic return ("the landlord can return it at any time, and after the deadline anyone can") — these were the controller's own Task 15 ruling texts; plus "Try again" catches refresh()'s rejection. Lint/test (72)/build green. Kept: deal "not found" metadata without description (inherits root) — cost if wrong: none
Task 20 Step 1–2 (controller, on the Preview build 91fd450): lint/test (72)/build green; every route answers as expected (marketing, /start, /new, /deals, deal, hand-off, invalid hand-off, 404, /dev/ui 404, robots, sitemap, manifest, icons, OG, /icon.png?size=100.5); at 375 px every page has one visible h1, main#main, the devnet ribbon and no horizontal scroll; released deal page renders (status, next step, timeline); no app console errors (only my deliberate 404 probe and the Preview-only Vercel toolbar requests)
Minor (noted, not fixed): the dynamic hand-off page leaves a hidden duplicate of its content in React's streamed <div hidden id="S:0"> (not exposed to users or assistive tech; Next/React streaming leftover)
Sent the user "ready to test" with the 9-step regression + WhatsApp check + the final reviewer's two extra checks (logged-out landlord on a locked deal; handover mode across the deadline)
Task 20 Step 4 (user regression): tests 1–8 passed (user report). Then "Create deposit link" failed with the generic "Check that Phantom is set to Solana Devnet" message. systematic-debugging: landlord 3BNf…zA4e had 0.00257 SOL; a new deal needs 0.00331 SOL (deal account rent 0.00182 + vault rent 0.00149 + fee) → system program "insufficient lamports" (custom error 0x1) wasn't mapped. Fix 2a0? (see git log): friendlyError maps "insufficient lamports" to a clear SOL message; needsTestFunds() lets the create flow and the deal page show the Get test funds button next to it; test added (73 pass). User told to tap Get test funds (faucet tops up below 0.02 SOL) and continue.
