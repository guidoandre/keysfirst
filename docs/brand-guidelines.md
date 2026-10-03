# Keysfirst Brand Guidelines v1.0 · "Clear Rules"

Chosen on 2026-09-28 from three directions (boards in [docs/brand/directions/](brand/directions/index.html); this is direction A).
Tokens, components and motion rules for the web app live in [docs/design-system.md](design-system.md).

## Quick reference

- **Promise:** The deposit moves only when the keys do.
- **Primary colours:** Ink `#16181D` and White `#FFFFFF`; Highlighter `#FFE14D` as the one accent.
- **Fonts:** Barlow Semi Condensed (display) + Barlow (text), both via `next/font/google`.
- **Voice:** clear, calm, fair, honest.
- **Idea:** every deal reads like a timetable: what happens, when, and what happens if it doesn't.

## 1. Promise and messaging

### Core statements

- **Promise (primary message):** The deposit moves only when the keys do.
- **Mission:** We protect people who rent a room in Germany from abroad by locking the deposit until the key handover, so a fake listing can't take it.
- **Positioning:** Keysfirst is the deposit link for rooms rented from abroad. The landlord is paid at the door, when the tenant scans, and never before.
- **Value proposition, tenant:** Pay the deposit before you arrive without trusting a stranger. It goes to the landlord only when you scan their code at the door, and comes back to you if you never do.
- **Value proposition, landlord:** Show you are genuine and get paid at the handover, in seconds, with no bank delay and no chargeback.

### Key messages and proof

| Message | Need it answers | Proof we can show |
|---|---|---|
| Only the tenant's scan pays the landlord. | "What if the landlord is fake?" | Program rule: the release needs the tenant's own approval; 45 automated tests including the invariants. |
| No handover, no money: it comes back after the deadline. | "What if I can't get in?" | After the deadline anyone can trigger the return; the program checks Solana's clock. |
| Works with any listing. | "My room is on WG-Gesucht / Facebook / a friend's sublet." | It's a link, not a marketplace. |
| Paid in seconds at the door. | "Why would a landlord agree?" | Payment on Solana is final in seconds and can't be charged back. |
| You don't owe the full deposit before you move in. | "The landlord wants it now." | §551(2) BGB: the tenant may pay in three monthly instalments, the first due at the start of the tenancy. |

### Message by audience

| Audience | Pain | Key message | Call to action |
|---|---|---|---|
| Tenant (international student abroad) | Fear of a fake landlord; can't view the room first | Your deposit waits in a lock until you're at the door with the keys. | "How it protects me" · "Ask for a deposit link" |
| Landlord (often an outgoing student subletting) | Tenants abroad don't trust you; chasing payments | Get paid at the handover, in seconds; look trustworthy from the first message. | "Create a deposit link" |
| Challenge judges | Understand it fast; see the role of Solana | The rules are code: only the tenant's scan pays, only the clock refunds. | "See how it works" · "Try it with test money" |

### Elevator pitches

- **10 seconds:** A deposit link that pays the landlord only when the tenant scans their code at the door.
- **30 seconds:** Students renting in Germany from abroad get scammed by fake landlords who take the deposit and vanish. With Keysfirst the deposit waits in a lock on Solana. At the door, the tenant checks the room and scans the landlord's code: the landlord is paid in seconds. No handover by the deadline, and the money goes back to the tenant automatically.

### Words we use

| Say | Instead of | Why |
|---|---|---|
| lock, "in the lock" | escrow, vault, PDA, escrow account | Everyone knows what a lock does. |
| deposit link, deal | deal account, contract | It's what the landlord sends. |
| approve in Phantom | sign a transaction, instruction | Describes what the person actually does. |
| receipt, "View on Solana Explorer" | transaction hash, signature, tx | A receipt is proof; the explorer is where it lives. |
| test money, Test EUR | tokens, SPL, mint, lamports, token account | Devnet money has no value; say so. |
| wallet (first use: "an app like Phantom that holds your money and approves payments") | keypair, address, account | Explain once, then use freely. |
| the deadline, the handover window | settlement, expiry slot | Plain time words. |
| Solana's test network (devnet) | cluster, RPC | Honest about the prototype. |

Status labels are fixed and always written exactly: **Waiting for deposit · Deposit locked · Released to landlord · Returned to tenant · Cancelled**.

## 2. Logo

**Idea:** the lock and the letters are one shape. A padlock shackle closes over a "K" whose arms run into the two bars of an "F": Keysfirst, locked until the keys change hands.

### Variants

| Variant | Use |
|---|---|
| **Lockup** (mark + "Keysfirst" wordmark, horizontal) | Header, footer, link previews, documents |
| **Mark on yellow plate** | App icon, favicon, wallet request icon (PNG), avatar |
| **Mono mark** (ink padlock-K, no plate) | One-colour contexts, watermarks |
| **Lockup on ink** (yellow plate, white wordmark) | Dark bands, the handover screen header |

### Construction (48-unit grid)

The geometry lives in one place, `web/src/components/brand/mark.tsx`; the header, footer, favicon, app icons, wallet request icon and link previews all draw from it.

- Plate: 48 × 48, corner radius 9, fill Highlighter.
- Shackle: a half ring centred at (23.85, 17.2), centreline radius 8, 4.6-unit ink stroke, flat ends, open at the bottom above the letters.
- K: stem x 11 to 16.25, y 19.5 to 39.9; the upper arm rises from the stem into the F's top bar (y 19.5 to 23.75, out to x 36.9); the leg runs down to the baseline at x 25.2 to 31.65.
- F middle bar: x 27.4 to 36.9, y 27.3 to 31.6.
- One drawing at every size, favicon included (no simplified version).
- Wordmark: "Keysfirst" in Barlow ExtraBold (800), tracking −2%, set at 0.74 × plate height, gap 0.3 × plate height.

### Clear space and minimum size

- Clear space: half the plate height on every side.
- Minimum: lockup 96 px wide; mark 16 px.

### Don'ts

- Don't recolour the plate (Highlighter only, or the mono version).
- Don't put the yellow plate on a yellow field; use the mono mark instead.
- Don't rotate, stretch, outline, shadow or animate the logo (the one exception is the loading key, see the design system).
- Don't use the padlock-K as a generic "lock" icon inside the UI; it is the brand mark only.

## 3. Colour

Strategy: **restrained**. Ink and white do the work. The Highlighter marks "now" and "look here", never danger. Status colours mean status and nothing else.

### Primary

| Name | Hex | RGB | Use |
|---|---|---|---|
| Ink | `#16181D` | rgb(22, 24, 29) | Text, primary buttons, strong frames, dark bands |
| White | `#FFFFFF` | rgb(255, 255, 255) | Page and card surfaces |
| Highlighter | `#FFE14D` | rgb(255, 225, 77) | Marker highlights on key words, the "now" row, focus halo, icon plate |

### Secondary (status)

| Name | Hex | RGB | Use |
|---|---|---|---|
| Released green | `#0B7A47` | rgb(11, 122, 71) | "Released to landlord", success; white text only |
| Returned blue | `#1A56DB` | rgb(26, 86, 219) | "Returned to tenant"; white text only |
| Alert red | `#C0262D` | rgb(192, 38, 45) | Errors and destructive actions only |
| Highlighter soft | `#FFF6C2` | rgb(255, 246, 194) | "Now" row and hint backgrounds |
| Green soft · Blue soft · Red soft | `#E3F4EA` · `#E6EEFC` · `#FBE9EA` | | Callout backgrounds for the matching status |

### Neutrals

| Name | Hex | RGB | Use |
|---|---|---|---|
| Graphite | `#545B66` | rgb(84, 91, 102) | Secondary text, descriptions |
| Stone | `#6B7079` | rgb(107, 112, 121) | Captions, timestamps, "waiting" state |
| Line | `#8A919B` | rgb(138, 145, 155) | Input and control borders (the only grey that passes 3:1 for controls) |
| Rule | `#D8DBDF` | rgb(216, 219, 223) | Dividers and card borders (decorative only) |
| Mist | `#F4F5F2` | rgb(244, 245, 242) | Subtle panels, page bands |
| Ink muted | `#AEB4BC` | rgb(174, 180, 188) | Secondary text on Ink |

### Accessibility (WCAG 2.1 AA, measured)

| Pair | Ratio | Allowed for |
|---|---|---|
| Ink on White | 17.8:1 | All text |
| Ink on Highlighter | 13.6:1 | All text |
| Graphite on White / Mist | 6.9:1 / 6.3:1 | All text |
| Stone on White / Mist | 5.0:1 / 4.6:1 | Text ≥ 13 px; prefer Graphite on Mist |
| White on Released green / Returned blue / Alert red | 5.4 / 6.2 / 5.9:1 | All text |
| Status colour on its soft background (green / blue / red) | 4.7 / 5.3 / 5.1:1 | Text ≥ 14 px, icons |
| Ink muted on Ink | 8.5:1 | All text |
| Line on White | 3.2:1 | Control borders (1.4.11) |
| Highlighter on White | 1.3:1 | **Never** the only signal: always pair with ink (focus ring, "now" row edge) |
| Rule on White / Mist | 1.4 / 1.3:1 | Decoration only, never a control boundary |
| Light green text on Released green | 4.4:1 | **Not allowed**: use white |

## 4. Typography

```css
--font-display: "Barlow Semi Condensed", "Arial Narrow", system-ui, sans-serif; /* 600, 700 */
--font-sans: "Barlow", system-ui, sans-serif;                                  /* 400, 600 */
```

A DIN-like grotesk, the letterforms of German road and rail signs. Four font files only (Barlow 400/600, Barlow Semi Condensed 600/700) to stay light on phones.

| Element | Font | Weight | Desktop / mobile | Line height |
|---|---|---|---|---|
| Hero (H1 on the landing page) | Semi Condensed | 700 | 76 / 44 px | 0.94 |
| Page title (H1) | Semi Condensed | 700 | 56 / 36 px | 1.0 |
| Section title (H2) | Semi Condensed | 700 | 36 / 28 px | 1.1 |
| Card title (H3) | Semi Condensed | 600 | 22 / 20 px | 1.2 |
| Amount | Semi Condensed | 700 | 64 / 48 px, tabular | 1.0 |
| Lead paragraph | Barlow | 400 | 20 / 17 px | 1.5 |
| Body | Barlow | 400 | 17 / 16 px | 1.55 |
| UI text, buttons | Barlow | 600 | 16 px | 1.25 |
| Small | Barlow | 400 | 14 px | 1.45 |
| Label (caps) | Semi Condensed | 600 | 13 px, +8% tracking, uppercase | 1.0 |

Rules: sentence case for headings and buttons; uppercase only for small labels; tabular figures for every amount, time and countdown; paragraphs max 65 characters wide; `text-wrap: balance` on headings.

## 5. Imagery

- **Pictograms, not pictures.** A 56-unit grid, 90° and 45° lines, round heads, solid ink shapes and 4-unit outlines (3-unit interior detail), plus one Highlighter accent. In the tradition of Otl Aicher's pictograms for Munich 1972 (inspiration, not copies).
- **UI icons:** a 24 px grid, 2 px stroke, square caps and mitred joins, ink or currentColor. Always paired with a text label or an `aria-label`.
- **Guide illustrations:** simplified phone and laptop screens drawn in the same line language, with labels. Phantom is named in words; never draw its logo or copy its screens pixel for pixel.
- **Timetables as graphics:** rules and timelines are drawn as rows (time | what happens | outcome), with the "now" row highlighted.
- **Never:** photography, stock people, 3D, gradients, glows, emoji, crypto imagery (coins, chains, rockets), or partner or press logos.

## 6. Voice and tone

We sound like a calm, exact friend who knows the rules: facts first, then the time, then what happens if it doesn't.

| Trait | We are | We are not | Do | Don't |
|---|---|---|---|---|
| Clear | Specific: amounts, dates, times | Vague | "Returns to you on Sun 4 Oct, 14:00." | "Funds are subject to release conditions." |
| Calm | Steady, even when something fails | Alarmist | "The deadline passed. The deposit can go back now." | "Act now! Time is running out!" |
| Fair | Clear about both sides | Anti-landlord | "The landlord is paid in seconds at the door." | "Landlords can't be trusted." |
| Personal | Talks to the reader as "you" wherever we know who they are | Third person about the reader | Tenant: "€600.00 goes back to you." Landlord: "Your tenant scans your code." | Tenant: "€600.00 goes back to the tenant." |
| Honest | Upfront about limits | Salesy | "Prototype on Solana devnet, test money only." | "100% scam-proof." |

### Tone by context

| Context | Tone | Example |
|---|---|---|
| Landing and marketing | Confident, calm | "The deposit moves only when the keys do." |
| Creating and paying | Instructional, exact | "Choose the latest handover. If there's no handover by then, the deposit goes back to your tenant." |
| Waiting | Reassuring, factual | "Deposit locked · €600.00. It goes to the landlord when you scan at the door, or back to you after Sun 4 Oct, 14:00." |
| Errors | Calm, specific, next step | "That wallet didn't pay this deposit. Switch Phantom to the wallet that did, then scan again." |
| Success | Quiet confirmation | "Released: hand over the keys." |
| Limits and safety | Frank | "At the door you scan first, so a landlord could take the money and keep the keys. That would be theft by a known person at a real address." |

### Prohibited

- Blockchain jargon in UI copy: PDA, escrow account, lamports, token account, instruction, transaction hash, signature, mint, SPL, RPC, on-chain (say "on Solana").
- Hype: seamless, revolutionary, trustless, next-gen, guaranteed, 100%, scam-proof, "bank-grade security".
- Emoji in the UI, exclamation marks, "Oops", passive blame ("An error occurred").
- Claims we can't prove: invented testimonials, user numbers, partner logos, press quotes, and "nobody can ever change the rules" (the devnet program can still be upgraded by its deploy key; say so on the Safety page).

## 7. Motion personality

A departure board, not a party: short (150–250 ms), exact, ease-out. Status changes flip once like a split-flap board; countdowns tick; the highlighter draws in once on the hero. The landing page arrives the same way: its parts rise into place in reading order, the example timetable's rows flip in like a departure board, and each section settles as it scrolls into view (longer, 600–700 ms, but still exact and once). Nothing loops except loading indicators, and reduced-motion settings replace every flip and sweep with an instant change. Full rules are in the design system.

## 8. Honesty rules (from the project brief)

- Every page says it's a devnet prototype with test money (in the footer; the top ribbon was removed on 2026-09-28 so the product looks like the real thing).
- No invented testimonials, user numbers, partner logos or press quotes.
- Legal statements stay exactly as accurate as §551(2) BGB allows; no legal advice.
- The Safety page states the limitations from spec §10 in plain words, including the upgradeable program.
