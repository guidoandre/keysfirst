# Accessibility audit (WCAG 2.1 AA)

**Date:** 28 September 2026 · **Branch:** `redesign` · **Standard:** WCAG 2.1 AA, plus the project's own rules (design system §5 and §9, contrast table in the brand guidelines) · **Commit with the fixes:** `fix(web): accessibility audit fixes (WCAG 2.1 AA) and audit notes`

Checklist: the `design:accessibility-review` skill's WCAG 2.1 AA quick reference (1.1.1, 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.5.5, 3.2.1, 3.3.1, 3.3.2, 4.1.2). Two more criteria came up during the audit and are included: 1.4.10 Reflow and 4.1.3 Status messages.

## Summary

**15 findings: 0 critical, 7 major, 8 minor. All 15 are fixed.** The five items carried over from earlier reviews are among them. Ten items stay open with a reason (see "Open items").

After the fixes, the Step 2 structure check returns `[]` on every page at 375 px and 1280 px. There is no horizontal scroll at 320, 375, 640 or 1280 px. Every text pair measures at least 4.5:1, and every control has a hit area of at least 44 × 44 px, except links that sit inside a sentence (WCAG 2.5.5 allows that).

## Pages

`/`, `/how-it-works`, `/faq`, `/tenants`, `/landlords`, `/about`, `/start`, `/new` (all three steps and the error states), `/deals` (logged out), `/dev/deal`, `/dev/deals`, `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy` (a released deal), `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy/handover`, `/this-does-not-exist`.

`/dev/deal` was checked in all 54 combinations: 9 phases × 3 viewers × logged in or out. It was also checked with handover mode and the Released screen open. The sheets were checked open: menu, log-in and confirmation. `/dev/ui` was added for more contrast coverage: callout tones, the loading and disabled buttons, and field errors.

## Method

- Dev server in the Claude Browser pane at four sizes:
  - 375 × 812 (phone emulation)
  - 1280 × 800
  - 320 × 800
  - 640 × 400, which has the same CSS size as 200 % zoom on a 1280 × 800 window
- **Structure:** the brief's Step 2 script, run unchanged on every URL at 375 and 1280, before and after the fixes.
- **Contrast:** a page script that finds every visible piece of text, measures its colour against the real background behind it, and applies the WCAG formula. Results are grouped by colour pair. Non-text pairs were computed from the tokens.
- **Touch targets:** every link, button, summary and field smaller than 44 × 44 px, including any invisible `::after` hit area. A second script checks that no enlarged hit area covers another control.
- **Reflow:** a scan for any element wider than the viewport. The phone emulation widens the page instead of scrolling it sideways, so `innerWidth` was checked as well. That is how the My deals overflow (F13) was found; the structure script alone missed it.
- **Keyboard:** real Tab, Shift+Tab, Enter, Space and Esc key presses, with a focus log that records the order of stops, whether `:focus-visible` matched, whether a ring was drawn, and whether the stop was on screen. The log also shows where focus goes after dialogs close and after step changes.
- **Runtime errors:** the Next.js dev-tools issue badge, confirmed first with a deliberate error. No page showed an issue after the fixes.
- **Test-browser limits (not app problems).** The browser pane was hidden, so the page reported `document.hidden = true` and `requestAnimationFrame` never ran:
  - The deal page pauses its polling in hidden tabs by design, so it stayed on "Loading the deal…". For the checks, `document.hidden` was overridden in the page.
  - React's streamed HTML waits for an animation frame before swapping in, so the handover page kept a hidden copy (`<div hidden id="S:0">`, `display: none`) and the script counted 2 h1s. Running React's pending swap (`$RV`), which is what the next frame does in any visible tab, gave `[]`. Loads that didn't stream also gave `[]`.
  - Animations can't advance, so reduced motion was checked through the CSS, not by watching.
  - Screenshots of scrolled pages came out blank or shifted, so position checks were done by measuring instead.

## Findings and fixes

| # | Page(s) | Criterion | Problem | Fix |
|---|---|---|---|---|
| F1 (carried 1) | `/new` | 2.4.3 Focus order | After Next, Back or "Use demo values", focus stayed on the button that was pressed. Where that button disappeared (Back on step 2, Next on step 2), focus fell back to the page body. Screen-reader users were not told the step had changed. | `CreateDealFlow.tsx`: the step `<h1>` gets a ref and `tabIndex={-1}`, and is focused in an effect when `step` changes (not on the first render; a ref remembers the step already shown). Keyboard users see the focus ring on the heading; mouse users don't. |
| F2 | `/new` | 3.3.1 Error identification, 4.1.3 Status messages | Next with an empty or invalid field showed the error, but focus stayed on Next and nothing was announced. | `CreateDealFlow.tsx`: a failed Next focuses the first field in error once its message has rendered. The field's `aria-describedby` then reads the error. |
| F3 (carried 1) | `/new` | Design system §2 (semantic tokens only) | The demo checkbox used the raw primitive `accent-[var(--k-ink)]`. | `accent-fg`. |
| F4 (carried 1) | `/new` | Copy rule (amounts like €600.00) | "Use demo values (… €600, …)". | "€600.00". |
| F5 (carried 2) | `/faq` | 2.4.3 Focus order | `/faq#devnet` opened and scrolled to the answer, but focus stayed at the top of the page. | `OpenHashDetails.tsx`: after opening, focus goes to the question's `<summary>` with `focus({ preventScroll: true })`. |
| F6 (carried 2) | `/faq` | Robustness | A malformed hash (for example `/faq#%E0%A4%A`) threw `URIError` in an effect and replaced the whole FAQ with the error screen. | `OpenHashDetails.tsx`: `decodeURIComponent` is wrapped in try/catch. A bad hash now opens nothing. |
| F7 | `/faq` | 2.4.3, usability | The ribbon's "What's devnet?" link, clicked while already on `/faq`, scrolled to the question but left it closed. Next.js navigates within the page without firing `hashchange`. | `OpenHashDetails.tsx`: clicks on links to the same page read the hash from the link and open the question (and focus it). |
| F8 (carried 3) | Any page whose group layout fails | 1.3.1, 2.4.1 | The root error boundary rendered without a `<main>`, so "Skip to content" had no target and the page had no main landmark. | `app/error.tsx` wraps `ErrorView` in `<main id="main" className="flex-1">`. Checked by making the (site) layout throw on purpose; the change was reverted afterwards. |
| F9 (carried 4) | Landing, How it works, create preview, deal pages | 1.3.1 Info and relationships | Timetable rows showed done, now, next and later only through the marker and Highlighter (only the "now" row had `aria-current="step"`). | `Timetable.tsx`: a visually hidden "Done:", "Now:", "Next:" or "Later:" before each row title. The page looks the same. |
| F10 (carried 5) | My deals | 2.4.4, 2.5.3; screen-reader noise | Each card's link name was the whole card, starting with "You're letting". In the last hour its countdown ("4 min 12 s") changed the name every second. | `DealCard.tsx`: `aria-label` = title, amount, status, role, next step (for example "Room in Vallendar, €600.00, Deposit locked. You're letting. Start the handover when you meet"). The countdown becomes the link's description (`aria-describedby`), so it is read on focus but no longer changes the name. The visible card is unchanged. |
| F11 | Every page (phone header) | 4.1.2 Name, role, value; brand contrast rule | The menu button's name was only on the SVG inside it, which the Step 2 script flagged on every page. Its outline used Rule (1.39:1), which the brand guidelines keep for decoration and never for a control boundary. | `MobileMenu.tsx`: `aria-label="Menu"` on the button, the icon becomes decorative, and the border becomes `border-field` (3.18:1). |
| F12 | Every page | 2.5.5 Target size; design system §5 | Many controls were under 44 × 44 px at 375 px (list below). | A shared `HIT_AREA` class (`Button.tsx`) adds an invisible 44 × 44 px minimum `::after` area centred on the control; nothing moves on screen. It is used by the `sm` size ("Log in" in the header), the quiet variant, desktop nav links, footer, deal and Released-screen links. The logo link is now a 44 px box. Footer links are 44 px rows (the list keeps its first line in place). The FAQ answer links and the CTA band's "New to wallets?" link use the quiet style, which they already matched visually. |
| F13 | `/deals` (logged in), `/dev/deals` | 1.4.10 Reflow | A long room title made a deal card 362 px wide in a 343 px column: sideways scrolling at 375 px (at 320 px, cards were 323–361 px in 288 px). The list grid's implicit column can't shrink below its content. | `MyDeals.tsx`: the list uses `grid-cols-1` (`minmax(0, 1fr)`), so long titles are cut off with an ellipsis inside the card as designed. |
| F14 | Every page with the CTA band (landing, How it works, FAQ, For tenants, For landlords), the For tenants hero, My deals when empty, the wallet menu | 4.1.3 Status messages | "Copy the message" and "Copy address" changed to "Copied" with no announcement. `CopyField` already announced it. | `AskLandlord.tsx`, `WalletChip.tsx`: the same polite, visually hidden live region as `CopyField` ("Copied to the clipboard"). |
| F15 | Timetables (landing, create preview, deal), `/new` counter | Brand contrast rule (Stone only for text of 13 px or more) | "Rules run in a public program on Solana." and "64 left" were Stone at 12 px. That is 4.98:1: passes WCAG, but breaks the brand rule. | `Timetable.tsx`, `Field.tsx`: `text-fg-muted` (Graphite, 6.85:1). |

Severity: major = F1, F2, F5, F6, F9, F12, F13; minor = the rest.

## Step 2 structure check (script unchanged)

| URL | 375 before | 1280 before | 375 after | 1280 after |
|---|---|---|---|---|
| All 14 URLs | `[["control without a name", "<button type=\"button\" aria-haspopup=\"dialog\" class=\"grid size-11 place-items-center rounde"]]` (the menu button, F11) | same | `[]` | `[]` |
| `/deal/8cTv…8xTy` | also `["h1 count is not 1", 0]` while the loading skeleton showed (hidden pane, see Method) | same | `[]` (loaded) | `[]` |
| `/deal/8cTv…8xTy/handover` | also `["h1 count is not 1", 2]` on streamed loads (hidden copy `S:0`, see Method) | same | `[]` (non-streamed load, or after React's pending swap) | `[]` |
| `/dev/deals` | the script saw no horizontal scroll, but `innerWidth` was 377 at a 375 px viewport (F13) | `[]` besides the menu button | `[]`, `innerWidth` 375 | `[]` |
| `/dev/deal`, 54 combinations | menu button only, no duplicate ids | same | `[]` for all 54 | `[]` for all 54 |

## Manual checks

### Keyboard (after the fixes)

| Page | Tab order | Focus ring | Enter / Space | Esc and return |
|---|---|---|---|---|
| `/` at 1280 | 34 stops in reading order: Skip to content, ribbon link, logo, nav, Get started, Log in, hero, split, what-ifs, Why Solana, FAQ, CTA band, footer. Each stop scrolled into view. | On every stop (white gap, ink ring, Highlighter halo) | Links, buttons, summaries | No sheet at this width |
| `/` at 375 | Skip, ribbon, logo, Log in, Menu, content | Every stop | Enter opens the menu sheet | Focus starts on Close; Esc closes; focus back on Menu |
| Skip link | First stop, shown on focus (ink box, top left) | Yes | Enter goes to `#main`; the next Tab lands on "Create a deposit link" | — |
| `/new` | Room, Deposit in euros, Use demo values, Next. Step 2: Move-in (date parts), Now, handover window (one radio stop, arrows move), demo checkbox, Back, Next | Every stop | Enter submits the step; Space presses Back | Failed Next: focus moves to the first field in error. Next, Back or demo values: focus moves to the step heading. |
| `/deals` (logged out) | Header Log in, main Log in, Open in Phantom | Every stop | Enter opens the log-in sheet | Focus on Close, stays inside the sheet (Close, Install Phantom, How?), Esc closes, focus back on the Log in that opened it |
| `/dev/deal` | Phase, viewer and wallet radio groups (one stop each), Open handover mode, Open Released screen, then the deal's actions | Every stop, including the radio labels | Yes | Handover mode: focus on "Close the handover", Esc closes, back to the opener. Released screen: focus on the receipt link, Esc closes, back to the opener. Confirmation dialog (`/dev/ui`): focus on Close, Esc closes, back to the opener. |
| `/faq` | Skip, ribbon, logo, Log in, Menu, then the questions (`summary`, 56 px) | Every stop | Enter and Space open and close answers | `/faq#devnet`, the ribbon link on `/faq`, and the ribbon link from another page all open "What are devnet and test money?" and focus it |

### Contrast (measured on every page after the fixes)

Text pairs:

| Pair | Ratio | Smallest text seen | Where |
|---|---|---|---|
| Ink on White | 17.76:1 | Any size | Body text, chips, headings |
| White on Ink | 17.76:1 | 13 px | Primary buttons, timetable headers, footer links, handover header |
| Ink on Highlighter soft | 16.25:1 | 14 px | "Now" rows, info callouts |
| Ink on Mist | 16.23:1 | 13 px | Ribbon ("test money only"), bands, next-step panel |
| Ink on Released / Returned / Alert soft | 15.56 / 15.22 / 15.18:1 | 14 px | Callouts, How it works status panels |
| Ink on Highlighter | 13.64:1 | 12 px | "For trying it out" badge, marker words |
| Ink muted on Ink | 8.50:1 | 12 px | Footer muted text, "Deposit locked" band label, timetable aside |
| Graphite on White | 6.85:1 | 12 px | Secondary text, timetable footer and counter (after F15) |
| Graphite on Highlighter soft | 6.27:1 | 14 px | Time in the "now" row (not listed in the brand table; see Open items) |
| Graphite on Mist | 6.26:1 | 12 px | Devnet ribbon, next-step label, Cancelled chip |
| White on Returned blue | 6.18:1 | 13 px | Returned chip and band |
| Alert red on White | 5.90:1 | 14 px | Field errors |
| White on Released green | 5.40:1 | 13 px | Released chip, band and screen |
| Stone on White | 4.98:1 | 14 px (was 12 px before F15) | Captions ("For landlords · free on devnet") |
| Stone on Mist | 4.55:1 | 16 px | Step numbers on bands, the loading button's text |

The spot checks the brief names:

- **Devnet ribbon:** Graphite on Mist 6.26:1 at 13 px; "test money only" 16.23:1.
- **Status chips on every band:** the chip on the deal band is white with ink text (17.76:1), with its icon in Released green 5.40:1, Returned blue 6.18:1, ink 17.76:1 (Waiting and Locked) or Graphite 6.85:1 (Cancelled).
- **Band text:**
  - Waiting and Cancelled: ink on Mist 16.23:1, label 6.26:1.
  - Locked: white on Ink 17.76:1, label 8.50:1.
  - Released and Returned: white 5.40:1 and 6.18:1.
- **Chips elsewhere (default tone):** Locked 17.76:1 with the Highlighter lock at 13.64:1; Cancelled 6.26:1.
- **Muted text on `bg-subtle`:** 6.26:1.
- **Footer muted text:** 8.50:1.
- **Released screen:** all text 5.40:1; focus ring on green is white 5.40:1, ink 3.29:1, halo 4.15:1.

Non-text (1.4.11):

- **Control borders:** field border on white 3.18:1 (inputs, radio options, wallet chip, menu button after F11).
- **Status icons:** on their soft backgrounds 4.73:1 (green), 5.30:1 (blue), 5.05:1 (red).
- **Focus ring:** the ink ring is 17.76:1 on white and 16.23:1 on Mist. On Ink bands the white gap (17.76:1) and the halo (13.64:1) carry it.
- **Decoration only:** Rule (1.39:1) now only on decoration and card surfaces. Highlighter on white (1.30:1) never appears alone: the "now" row also has an ink-framed marker, `aria-current` and its state word.

No pair fails WCAG AA.

### Zoom and reflow

- **320 × 800:** all 14 URLs, the 54 deal states, handover mode and the Released screen: no horizontal scroll and nothing cut off. Before F13, `/dev/deals` overflowed. The only intentional cut-offs are the deal card title (the full title is in the link name and on the deal page), the timetable aside and the handover header title.
- **640 × 400 (200 % zoom at 1280 × 800):** all pages and all 54 deal states fit. The sticky header is 65 px of the 400 px.

### Reduced motion

`globals.css` sets `animation-duration: 1ms`, `animation-iteration-count: 1`, `transition-duration: 1ms` and `scroll-behavior: auto` for everything when `prefers-reduced-motion: reduce` is set. The browser tool can't emulate that media feature, so I injected the block's own declarations. With them, every animation (marker, rise, sheet, flip, Released entry, pulsing dot and spinner) runs once for 1 ms, and transitions take 1 ms. The pulsing dot and the spinner stand still, and sheets and dialogs still open, close and respond to Esc.

There is no motion driven by JavaScript: a code search found no `requestAnimationFrame`, `.animate()` or smooth scrolling. The marker keeps its 150 ms delay and then appears fully drawn, without moving.

### Screen reader

NVDA and VoiceOver aren't available in this environment, so these are structural checks:

- **Deal page status:** its only live region that follows the deal is the status line (`role="status"`), and its text changes only when the status does. Nothing in the live regions changed during 3.5 s of the countdown ticking.
- **Countdowns:** the countdown panel, the handover countdown and the My deals countdown are not live. After F10 the countdown is no longer part of any link name.
- **Other announcements:** errors use `role="alert"`. "Copied" is announced politely (tested with a stand-in clipboard). Timetable rows say Done, Now, Next or Later.

### Touch targets at 375 px

- **Before:**
  - Logo link: 39 px tall in the header, a 19 px inline box in the footer.
  - Header "Log in": 76 × 40.
  - Quiet links and buttons, 24 px tall: "I'm renting: how it protects me", "How it protects tenants", "All the rules, step by step", "All questions", "Copy the message", "Get started" on For tenants and the 404, and "How it works" on For landlords. The About page's "FAQ" was 27 px wide.
  - FAQ answer links, 19 px: "All known limits", "Get started in 5 minutes", "Get test funds".
  - CTA band: "New to wallets? Get started in 5 minutes", 19 px.
  - Footer: the explorer link, 20 px; eight links at 19 px (FAQ 27 px wide, About 41 px wide).
  - Deal page: "Receipt" 65 × 20 and the deal address 87 × 20.
  - Released screen: the receipt link, 24 px tall.
  - At 1280 only: header nav links and "Get started", 19–24 px.
- **After:** every one is at least 44 × 44. No enlarged hit area overlaps another control; this was checked on the landing, FAQ, About, For tenants and 404 pages, on `/dev/deal` in several phases, and in the Released screen and the log-in sheet.
- **Exempt (a link inside a sentence, WCAG 2.5.5 "Inline"):** the ribbon's "What's devnet?" (84 × 16), "See the program on Solana Explorer" on the landing and How it works pages, "Use demo values", "How?" in the log-in sheet (which also has the hit area), and the receipt link inside the "Done." message.
- **The demo checkbox** (20 × 20) sits inside a label that covers the whole dashed box, so the whole box is the target.

## Open items (accepted)

1. **Two headers on `/dev/*` in production.** In a production build, `/dev/*` renders the 404 with two headers. These are development-only pages; real unknown URLs are correct. (Known.)
2. **Repeated ids on `/dev/*`.** The galleries may repeat ids between demo sections, which the brief allows. None showed up in this audit's runs.
3. **VoiceOver on the user's iPhone (Task 20)** is needed for the real screen-reader check:
   - The deal status is announced once when it changes, and the countdown stays silent.
   - The FAQ questions expand.
   - `/new` announces the step heading after Next or Back, and reads the error after a failed Next.
   - "Copied" is announced.
4. **Next above Back on phones.** Below 640 px, `/new` shows Next above Back (`flex-col-reverse`), while Tab reaches Back first. Both buttons are adjacent and clearly named, so meaning and operation are preserved (2.4.3 met). Swapping the order in the code would break the desktop order instead.
5. **No h1 while a deal loads.** On `/deal/…`, the loading skeleton has no h1 for the few seconds devnet takes to answer. Its "Loading the deal…" status is announced, and the h1 arrives with the deal.
6. **`global-error.tsx` has no `id="main"`.** It replaces the whole root layout and has no skip link, so nothing targets it.
7. **One contrast pair missing from the brand table.** Graphite on Highlighter soft (6.27:1, the time in the "now" row) passes AA but isn't listed. Suggest adding it at the next brand-guidelines update.
8. **Footer rows have no 8 px gap.** Footer links are 44 px rows that touch each other; the menu sheet's links have a 4 px gap. Each whole row is the target, so a tap can't land between two small targets.
9. **Wallet menu "Copied" not tested in the browser.** It needs a connected wallet. It uses the same markup as `CopyField` and `AskLandlord`, which were tested.
10. **Test-browser artifacts.** The hidden pane effects under Method (paused deal polling, the streamed hidden copy, frozen animations, blank screenshots) are not app issues.

## Files changed

`web/src/components/ui/Button.tsx` (`HIT_AREA`, `sm` and quiet hit areas), `ui/Timetable.tsx`, `ui/Field.tsx`, `brand/Logo.tsx`, `site/MobileMenu.tsx`, `site/NavLinks.tsx`, `site/SiteFooter.tsx`, `marketing/OpenHashDetails.tsx`, `marketing/FaqList.tsx`, `marketing/CtaBand.tsx`, `marketing/AskLandlord.tsx`, `deal/DealCard.tsx`, `deal/DealDetails.tsx`, `deal/DealTimetable.tsx`, `deal/ReleasedScreen.tsx`, `wallet/WalletChip.tsx`, `app/error.tsx`, `app/(app)/new/CreateDealFlow.tsx`, `app/(app)/deals/MyDeals.tsx`.

`rules.ts` was not changed. The `(site)` pages still ship no wallet code: none of the production chunks of the six marketing pages contain wallet-adapter code, and the same check does find it on `/deals`.

<!-- Task 19 appends its Lighthouse section below. -->
