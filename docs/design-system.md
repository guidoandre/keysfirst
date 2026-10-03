# Keysfirst Design System v1.0 · "Clear Rules"

Brand, voice and logo: [docs/brand-guidelines.md](brand-guidelines.md). This file is the build reference: tokens, layout, components, states, motion and accessibility for `web/`.
Stack: Next.js 16 App Router, Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config`), fonts via `next/font/google`, no UI kit, no icon set, no animation library.

## 1. Principles

1. **Rules first.** Every screen answers: what happens, when, and what happens if it doesn't. Timetable rows beat paragraphs.
2. **Ink does the work.** Black on white, generous space, one Highlighter accent for "now" and "look here".
3. **Colour means status.** Green = released, blue = returned, red = error. Nothing decorative uses them.
4. **One next step.** Each screen has at most one primary button for the viewer's role; everything else is secondary or a link.
5. **Calm motion.** Things flip or rise once, fast; nothing loops except loading; reduced motion means no motion.
6. **Phone first.** Designed at 375 px inside Phantom's in-app browser, then widened. No horizontal scroll, ever.

## 2. Tokens (three layers)

Primitives are raw values; semantic tokens give them a job and become Tailwind utilities; component tokens tune individual components. Components use semantic tokens (as Tailwind classes) or component tokens, never primitives or raw hex.

This block is the top of `web/src/app/globals.css`:

```css
@import "tailwindcss";

/* ── Layer 1 · Primitives: raw brand values (no utilities; never used in components) ── */
:root {
  --k-ink: #16181d;
  --k-ink-muted: #aeb4bc;
  --k-graphite: #545b66;
  --k-stone: #6b7079;
  --k-line: #8a919b;
  --k-rule: #d8dbdf;
  --k-mist: #f4f5f2;
  --k-paper: #ffffff;
  --k-marker: #ffe14d;
  --k-marker-soft: #fff6c2;
  --k-green: #0b7a47;
  --k-green-soft: #e3f4ea;
  --k-blue: #1a56db;
  --k-blue-soft: #e6eefc;
  --k-red: #c0262d;
  --k-red-soft: #fbe9ea;
}

/* ── Layer 2 · Semantic tokens → Tailwind utilities (bg-*, text-*, border-*, fill-*, …) ── */
@theme inline {
  --color-*: initial; /* only brand colours exist: no stray emerald-700 */
  --color-white: var(--k-paper);
  --color-canvas: var(--k-paper);          /* page */
  --color-subtle: var(--k-mist);           /* quiet panels, bands */
  --color-inverse: var(--k-ink);           /* dark bands, primary buttons */
  --color-fg: var(--k-ink);                /* text */
  --color-fg-muted: var(--k-graphite);     /* secondary text */
  --color-fg-subtle: var(--k-stone);       /* captions, timestamps, waiting */
  --color-fg-inverse: var(--k-paper);
  --color-fg-inverse-muted: var(--k-ink-muted);
  --color-rule: var(--k-rule);             /* dividers, card borders: decorative */
  --color-field: var(--k-line);            /* input/control borders: 3.2:1 */
  --color-accent: var(--k-marker);         /* the Highlighter */
  --color-accent-soft: var(--k-marker-soft);
  --color-released: var(--k-green);
  --color-released-soft: var(--k-green-soft);
  --color-returned: var(--k-blue);
  --color-returned-soft: var(--k-blue-soft);
  --color-danger: var(--k-red);
  --color-danger-soft: var(--k-red-soft);

  --font-sans: var(--font-barlow), system-ui, sans-serif;
  --font-display: var(--font-barlow-condensed), "Arial Narrow", system-ui, sans-serif;
}

@theme {
  /* Type scale (fluid between 375 px and 1280 px) */
  --text-hero: clamp(2.75rem, 1.55rem + 4.4vw, 4.75rem);
  --text-hero--line-height: 0.94;
  --text-hero--letter-spacing: -0.015em;
  --text-hero-xl: clamp(3.125rem, min(1.8rem + 5.6vw, 10svh), 6.5rem);   /* 50 → 104 px: the landing headline; also shrinks with a short window */
  --text-hero-xl--line-height: 0.9;
  --text-hero-xl--letter-spacing: -0.025em;
  --text-display: clamp(2.625rem, 1.5rem + 3vw, 4.5rem);  /* 42 → 72 px: the landing page's big section headlines */
  --text-display--line-height: 0.94;
  --text-display--letter-spacing: -0.02em;
  --text-title: clamp(2.25rem, 1.75rem + 2vw, 3.5rem);
  --text-title--line-height: 1;
  --text-title--letter-spacing: -0.01em;
  --text-section: clamp(1.75rem, 1.5rem + 1vw, 2.25rem);
  --text-section--line-height: 1.1;
  --text-card: clamp(1.25rem, 1.15rem + 0.4vw, 1.375rem);
  --text-card--line-height: 1.2;
  --text-amount: clamp(3rem, 2.45rem + 2.2vw, 4rem);
  --text-amount--line-height: 1;
  --text-lead: clamp(1.0625rem, 0.97rem + 0.45vw, 1.25rem);
  --text-lead--line-height: 1.5;
  --text-body: clamp(1rem, 0.97rem + 0.15vw, 1.0625rem);
  --text-body--line-height: 1.55;
  --text-label: 0.8125rem;
  --text-label--line-height: 1;
  --text-label--letter-spacing: 0.08em;
  /* Tailwind's text-xs / text-sm / text-base stay for UI text */

  /* Radii */
  --radius-sm: 0.375rem;   /* 6px: chips, small plates */
  --radius-md: 0.625rem;   /* 10px: buttons, inputs, logo plate */
  --radius-lg: 0.875rem;   /* 14px: cards, timetables */
  --radius-xl: 1.25rem;    /* 20px: sheets, dialogs */

  /* Content widths → max-w-app / max-w-read / max-w-page */
  --container-app: 40rem;    /* deal page, create flow, hand-off */
  --container-read: 42rem;   /* guide, FAQ, long text */
  --container-page: 72rem;   /* marketing pages, dashboard */
  --container-wide: 90rem;   /* the landing page (hero with the deal demo beside it) */

  /* Elevation: borders do most of the work; shadows only for things that float */
  --shadow-pop: 0 18px 40px -20px rgb(22 24 29 / 0.45);
  --shadow-sheet: 0 -16px 48px -16px rgb(22 24 29 / 0.4);

  /* Motion */
  --ease-out: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-in: cubic-bezier(0.5, 0, 0.9, 0.4);
  --ease-settle: cubic-bezier(0.16, 1, 0.3, 1); /* landing entrances: quick start, long exact stop */
  --animate-rise: rise 200ms var(--ease-out) both;
  --animate-flip: flip 420ms var(--ease-out);
  --animate-marker: marker 600ms var(--ease-out) 150ms both;
  --animate-sheet: sheet 250ms var(--ease-out) both;
  --animate-released: released 450ms var(--ease-out) both;
  --animate-pulse-dot: pulse-dot 1.6s ease-in-out infinite;
  --animate-spin: spin 0.9s linear infinite;

  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  @keyframes flip {
    0% { transform: rotateX(0); } 45% { transform: rotateX(-90deg); }
    55% { transform: rotateX(90deg); } 100% { transform: rotateX(0); }
  }
  @keyframes marker { from { background-size: 0% 100%; } }
  @keyframes sheet { from { transform: translateY(100%); } }
  @keyframes released { from { opacity: 0; transform: perspective(800px) rotateX(-70deg); } }
  @keyframes pulse-dot { 50% { opacity: 0.35; } }
  @keyframes spin { to { transform: rotate(360deg); } }
}

/* ── Layer 3 · Component tokens ── */
:root {
  --btn-h: 3rem;          /* 48px: default buttons (touch target ≥ 44px) */
  --btn-h-lg: 3.5rem;     /* 56px: money actions (pay, release, create) */
  --btn-h-sm: 2.5rem;     /* 40px: header only; hit area padded to 44px */
  --field-h: 3rem;
  --header-h: 4rem;
  --qr-size: min(78vw, 56vh, 22rem);
  /* focus: white gap, ink ring (≥3:1 on any surface), Highlighter halo */
  --focus-ring: 0 0 0 2px var(--k-paper), 0 0 0 4px var(--k-ink), 0 0 0 7px var(--k-marker);
}

@layer base {
  html { color-scheme: light; -webkit-text-size-adjust: 100%; }
  body { background: var(--color-canvas); color: var(--color-fg); font-family: var(--font-sans); }
  h1, h2, h3, h4 { font-family: var(--font-display); text-wrap: balance; }
  p, li { text-wrap: pretty; }
  ::selection { background: var(--k-marker); color: var(--k-ink); }
  :focus-visible { outline: 2px solid transparent; outline-offset: 2px; box-shadow: var(--focus-ring); }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 1ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important;
      transition-duration: 1ms !important; transition-delay: 0ms !important; scroll-behavior: auto !important;
    }
  }
}

/* The Highlighter stroke behind a word: <span class="marker">keys</span> (+ animate-marker to draw it in once) */
@utility marker {
  background-image: linear-gradient(transparent 56%, var(--k-marker) 56%, var(--k-marker) 94%, transparent 94%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  padding-inline: 0.06em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* Small caps label: <p class="label">Your next step</p> */
@utility label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-label);
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Notes:

- `@theme inline` is used where a token points at another variable (primitives, next/font variables) so utilities resolve correctly; plain `@theme` for literal values.
- `--color-*: initial` removes Tailwind's default palette. Only the semantic colours above exist as classes (`bg-inverse`, `text-fg-muted`, `border-field`, `bg-accent`, `text-released`, …).
- Fonts load in `layout.tsx`: `Barlow({ weight: ["400", "600"], variable: "--font-barlow" })` and `Barlow_Semi_Condensed({ weight: ["600", "700"], variable: "--font-barlow-condensed" })`, `subsets: ["latin"]`, `display: "swap"`, classes on `<html>`.
- Tabular figures: add `tabular-nums` to every amount, time, date and countdown.
- Light mode only (`color-scheme: light`). Dark mode is out of scope.

## 3. Layout and spacing

- **Base unit:** 4 px (Tailwind's default spacing scale).
- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Design at 375, check at 390, 768, 1280 and 1440.
- **Gutters:** 16 px phone (`px-4`), 24 px tablet (`sm:px-6`), 40 px desktop (`lg:px-10`).
- **Widths:** `max-w-wide` (90rem, gutters `xl:px-16`) for the landing page only: its hero marks itself `data-wide-page`, and the site header and footer follow with the `wide-page:` variant so the logo lines up; `max-w-page` (72rem) for the other marketing pages and My deals; `max-w-read` (42rem) for the guide, FAQ and long text; `max-w-app` (40rem) for the deal page, the create flow and the hand-off page (a centred column, like a ticket).
- **Section rhythm:** `py-14 lg:py-24` between marketing sections; more space above a heading than below it (heading → content 24–32 px); cards `p-5 sm:p-6`; stacks inside cards `gap-3`/`gap-4`.
- **Grid:** 12 columns on desktop marketing pages (hero 7/5; feature rows 6/6 or 4/4/4 when content is equal); single column below `lg`.
- **Layers (z-index):** content 0 · sticky header 30 · menus/popovers 40 · dialogs and sheets 50 · handover mode 60.
- **Safe areas:** full-screen views (handover mode, sheets) pad with `env(safe-area-inset-*)`.

## 4. Surfaces, borders, radii

| Surface | Classes | Use |
|---|---|---|
| Page | `bg-canvas` | Everything by default |
| Band | `bg-subtle` | Alternate marketing sections, next-step panels |
| Card | `bg-canvas border border-rule rounded-lg` | Groups of related content |
| Timetable frame | `border-2 border-fg rounded-lg`, header row `bg-inverse text-fg-inverse` | Rules, deal timelines: the signature component |
| Inverse band | `bg-inverse text-fg-inverse` | Handover header, CTA band, footer |
| Floating | `shadow-pop` / `shadow-sheet` + `rounded-xl` | Menus, sheets, dialogs only |

Borders: 1 px `rule` for decoration, 1.5 px `field` for controls, 2 px `fg` for the timetable and emphasised frames. No gradients, glows or blurred glass.

## 5. Interaction states

Priority when several apply: disabled > loading > active > focus > hover > default.

| State | Visual | Timing |
|---|---|---|
| Hover (pointer only, `@media (hover:hover)`) | The Highlighter draws in, it never just appears. Primary: 4 px bar grows left to right along the bottom edge (`.btn-draw`). Nav and footer links: a marker stroke draws under the text and stays under the current page (`.link-draw` on the label `<span>`). Secondary, chips, menu rows, icon buttons: `bg-subtle` fades in. Quiet links: underline thickens 2 → 3 px; plain underlined links 1 → 2 px. Link cards: border darkens (`.card-link`); deal cards also nudge their arrow 4 px. Closed FAQ question: chevron nudges 2 px toward the answer. An arrow inside a link or button leans 4 px forward (`.nudge-x`); external-link arrows lean 2 px up and out | in 200–280 ms, out 180 ms, ease-out |
| Active | `translate-y-px` | instant |
| Focus-visible | `--focus-ring` (white gap, ink ring, Highlighter halo) on every focusable element | none |
| Disabled | `bg-subtle text-fg-subtle border-rule`, `cursor-not-allowed`, plus a reason line underneath ("Available from Wed 30 Sep, 14:00") | none |
| Loading | Spinner icon (the only looping animation) + verb in progress ("Waiting for your wallet…"); keeps its width | spin 0.9 s |
| Error (fields) | 2 px `danger` border, message under the field with an alert icon, `aria-invalid`, `aria-describedby` | none |

Touch targets are at least 44 × 44 px, with at least 8 px between neighbouring targets.

## 6. Status system

The five labels are fixed (spec §8). One component (`StatusChip`) renders them everywhere.

| Status | Label | Chip | Icon | Deal hero band | Meaning |
|---|---|---|---|---|---|
| open | Waiting for deposit | `bg-canvas border-[1.5px] border-field text-fg` | hourglass | `bg-subtle` | Link created, nobody has paid |
| funded | Deposit locked | `bg-inverse text-fg-inverse` | lock with Highlighter body | `bg-inverse text-fg-inverse` | Money in the lock |
| released | Released to landlord | `bg-released text-white` | check | `bg-released text-white` | Tenant approved at the handover |
| refunded | Returned to tenant | `bg-returned text-white` | return arrow | `bg-returned text-white` | Back with the tenant |
| cancelled | Cancelled | `bg-subtle text-fg-muted` | cross | `bg-subtle` | Landlord withdrew before payment |

Countdowns derive from `web/src/lib/rules.ts` only. The UI never offers an action that `availableActions()` doesn't return.

## 7. Components

All live in `web/src/components/` (primitives in `components/ui/`). Server components by default; `"use client"` only where there's state, the wallet or timers.

### Foundations

| Component | Spec |
|---|---|
| `Logo` | `variant: "lockup" | "mark"`, `tone: "default" | "inverse"`; inline SVG from the brand construction; lockup has `aria-label="Keysfirst"` and links home |
| `Icon` | Inline SVG set on a 24 px grid, 2 px stroke, square caps: `lock, key, check, clock, hourglass, arrow-right, external, return, copy, share, wallet, menu, close, phone, qr, alert, info, chevron-down, door, refresh, spinner, logout`. `aria-hidden` unless given a `label` |
| `Pictogram` | 56-unit grid, solid ink + one Highlighter accent: `pay-into-lock, scan-at-door, keys-change-hands, back-to-you, tenant, landlord, fake-listing, deadline, phone-wallet, laptop-wallet, share-link`. Decorative (`aria-hidden`) next to a text heading |

### Primitives (`components/ui/`)

| Component | Variants and states |
|---|---|
| `Button` / `ButtonLink` | `variant: primary (bg-inverse text-fg-inverse) · secondary (bg-canvas border-2 border-fg) · quiet (text link with Highlighter underline) · danger (border-2 border-danger text-danger)`; `size: sm · md (48) · lg (56)`; `loading`, `disabled` + `reason`; `fullWidth` on phones for primary actions; `ButtonLink` wraps `next/link` or an external `<a>` (adds the `external` icon + `rel="noreferrer"` for external) |
| `Field` | Label above (never placeholder-only), optional hint, error slot; wraps `input`, `select`, `datetime-local`; `h-(--field-h) border-[1.5px] border-field rounded-md`; character counter for the room title |
| `Segmented` | Radio group styled as buttons (`role="radiogroup"`), used for the handover window and dashboard filter; arrow-key navigation from native radios |
| `StatusChip` | See §6; `size: sm · md`; label text always present (colour is never the only signal). Pass the viewer's `role` on their own deal: the person the money went to reads "Released to you" / "Returned to you" (`statusLabel` in `lib/deal-view.ts`) |
| `Callout` | `tone: info (bg-accent-soft) · success (bg-released-soft) · returned (bg-returned-soft) · danger (bg-danger-soft)`, left 4 px bar in the tone colour, icon + text; `role="status"` for live updates, `role="alert"` for errors |
| `Card` | `tone: default · subtle · strong (2 px fg frame) · inverse` |
| `Timetable` | Rows of `time | what happens | outcome`, `state: done · now · next · later`; "now" row = `bg-accent-soft` + 6 px Highlighter left edge + bold time; header row `bg-inverse`; used on the landing hero, How it works, create preview and deal page. `rowsEnterAt` (landing hero only) flips the rows in one after another (§8) |
| `Countdown` | Live value from `useNow()`; formats `2 days 4 h` / `18 h 42 min` / `4 min 12 s`; `aria-live="off"` (announce only on state change); `tabular-nums` |
| `KeyValue` | `dl` rows for facts (move-in, deadline, amount) |
| `Stepper` | "Step 2 of 3" + three segments; `aria-current="step"` |
| `Sheet` | Native `<dialog>` with `showModal()`: bottom sheet under `sm` (`animate-sheet`), centred dialog above; focus trapped by the browser; Esc and backdrop close; returns focus to the opener |
| `ConfirmDialog` | `Sheet` with title, consequence sentence, confirm (primary or danger) + "Go back" (secondary). Replaces `window.confirm` (unreliable inside in-app browsers) |
| `CopyField` | Read-only text + "Copy" button → "Copied" for 2 s (`aria-live="polite"`) |
| `Skeleton` | `bg-subtle rounded-md`, static (no shimmer) |
| `EmptyState` | Pictogram + title + one sentence + one action |
| `FaqItem` | Native `<details>/<summary>` with a chevron that rotates 180° (150 ms); the answer slides open (280 ms) where the browser can animate to `height: auto`, and opens instantly elsewhere |

### Site chrome

| Component | Spec |
|---|---|
| `SiteHeader` | Sticky, `h-(--header-h)`, `bg-canvas/95 border-b border-rule`. Two variants (see the route groups in the redesign spec). **Site** (marketing pages, no wallet code): How it works · For tenants · For landlords · FAQ, then Get started (quiet) + "Log in" (secondary sm, links to `/deals?login=1`). **App**: logged out: How it works · FAQ · Get started + "Log in" (`LoginButton`); logged in: My deals · Create a deal · How it works · FAQ + `WalletChip`. Under `lg`: logo + Log in or `WalletChip` + menu button opening a `Sheet` with all links. Current page link: `aria-current="page"` + Highlighter underline |
| `SiteFooter` | `bg-inverse text-fg-inverse`: lockup, one-line promise, links (How it works, For tenants, For landlords, FAQ, About, Get started), "Program on Solana Explorer ↗", devnet disclaimer |
| `LoginButton` | Calls `useAccount().login`, which opens Privy's login modal: email, Google, or an existing Solana wallet such as Phantom (optional). No custom connect sheet and no wallet-library modal |
| `WalletChip` | Email (or short account number `7xKp…3mQe`) + green dot; opens a `Sheet` titled "Your account": email, balance (re-read on open), Withdraw to bank (only above €0.00), My deals, Copy account number, Log out |

### Deal components

| Component | Spec |
|---|---|
| `DealHero` | Band in the status colour (§6): room title, amount (`text-amount tabular-nums`), `StatusChip`, "You're the landlord / tenant" line, one-sentence explanation |
| `NextStep` | The single primary action for this role and moment (from `availableActions`) with its reason line; secondary actions below as quiet buttons; logged out → `LoginButton` (Privy login; no second callout on the page) |
| `DealTimetable` | `Timetable` of created → locked → handover window → released/returned, with receipt links ("Receipt ↗" → Solana Explorer) and the "if it doesn't happen" row |
| `ShareLink` | Landlord while `open`: inside NextStep (`share`, outlined box): `CopyField` with the link + WhatsApp + Email + native share (`navigator.share`) when available; "Cancel this deal" sits below a rule, not full width |
| `HandoverMode` | Landlord, full screen (`fixed inset-0 z-60 bg-canvas`): lockup-on-ink header with Close, the QR (`--qr-size`, white quiet zone) encoding `https://<origin>/deal/<id>/handover`, three numbered instructions, live line "Waiting for your tenant to approve…" (pulsing dot), deadline countdown; asks for a screen wake lock while open (progressive, ignored if unsupported) |
| `ReleasedScreen` | Full-screen `bg-released text-white` panel entering with `animate-released`: "Released: hand over the keys.", amount, "is in your Keysfirst balance now" + where to withdraw it, receipt link, "Back to the deal" (secondary on green: white border). `role="status"` |
| `DealCard` | My deals row/card: title, amount, `StatusChip`, role, countdown line, next-action text, whole card is one link |
| `BalanceCard` | My deals, logged in: "Your balance" + amount (`€0.00` included, with "Money you receive shows up here." at zero) + "Withdraw to bank" (disabled at zero). Hidden only while the balance is unknown |
| `WithdrawSheet` | `Sheet` "Withdraw to bank": amount (empty = everything), account holder, IBAN; signing removes the money from the balance, then "€… is on its way" (demo: no real transfer). Mounted outside any balance condition so the confirmation survives the balance reaching €0.00. No "Get test funds" anywhere |

### Marketing blocks

`SectionHeader` (eyebrow label + H2 + lead), `StepList` (numbered pictogram steps), `ScenarioGrid` ("What if…" cards: question, one-line answer, "the rule behind it"), `CtaBand`, `FaqList`, `AskLandlord` (WhatsApp or copy the tenant's message; `useLandlordMessage` + `CopyMessageButton` for other layouts).

Landing page only (copy per role and per demo step in `content/landing.ts`): `LandingRoleProvider` + `RoleToggle` ("I'm renting" / "I'm letting" rewrites the hero, the problem band and the closing band), `LandingHero`, `DealDemo` (a scripted €600.00 deal, pure client state: both phones from `sm`, the viewer's in front, a money track, "No handover?" branch; the phones take the window height the rest leaves, keep 276 × 540 proportions and scale their text with `cqi`, so the whole demo fits one screen on phones and laptops), `ProblemBand` (inverse), `WhySolana` (heading, `LockDiagram`, three rules, `NoCryptoNote`, the deploy-key caveat; the header's "Why Solana" lands on `/#why-solana`), `ClosingCta` (Highlighter band, `#ask`). Their blocks carry `data-reveal`; it does nothing unless the page mounts `ScrollReveal` (only the landing page does, §8).

## 8. Motion rules

| What | Animation | Duration / easing | Reduced motion |
|---|---|---|---|
| Page and section content | `animate-rise` on first paint of hero and cards (≤ 3 staggered steps of 60 ms) | 200 ms ease-out | none |
| Landing hero | `.enter` rises each part in reading order (`[--enter-delay:…]`: toggle 0, label 40, headline 80, lead 140, deal demo 180, buttons 200, facts 260 + 70 ms steps) | 640 ms rise, `ease-settle` | none |
| Landing deal demo | Phones swap front/back from `sm` (translate + scale 480 ms, opacity 360 ms); below `sm` they share one spot and crossfade, the outgoing one gone (150 ms) before the incoming one is up, each sliding a little toward its side of the toggle (`.demo-phone`, own compositor layers); the "You" tag fades and scales with the front phone; each step the phone screen rises in line by line (`.demo-stagger`, 60 ms apart) and the status chip flips when the status changes; the €600.00 tag glides along the track while an ink fill follows it and the place it reached turns ink (700 ms); the caption and the Next label rise in (`.demo-in`), "No handover?" settles in (`.demo-pop`) | 320–700 ms `ease-settle` | instant |
| Landing role switch | "I'm renting" / "I'm letting": the toggle's ink fill slides across carrying a white copy of the labels that slides back by the same amount, so each label turns white exactly under the ink (`.role-fill`, 380 ms). Every piece of copy that depends on the role (hero eyebrow, lead, button labels; problem band) keeps both versions stacked in one grid cell (`RoleSwap`): nothing reflows or moves, the outgoing text fades in 130 ms drifting toward its side, the incoming one glides in from its side 70 ms later (`.role-variant`; renting left, letting right). Buttons keep their size; only labels and links change. All CSS transitions on transform/opacity, so a second click mid-switch turns everything around from where it is. The closing band, three screens down, swaps instantly | 130–480 ms `ease-settle` | instant |
| Landing sections | `[data-reveal]` blocks rise as they scroll into view (`ScrollReveal`, one IntersectionObserver); blocks arriving together land 80 ms apart (≤ 400 ms); inside a block, pictograms settle (`.reveal-pop`), "The rule:" Highlighters draw and Why-Solana rules draw left to right (`.reveal-rule`). Only blocks still below the fold are ever hidden, and only once the script runs | 720 ms, `ease-settle` | none: nothing is hidden |
| Status change on the deal page | `StatusChip` flips (`animate-flip`) when the status changes while viewing | 420 ms | instant swap |
| Released | `ReleasedScreen` swings in (`animate-released`) | 450 ms | instant |
| Sheets and dialogs | `animate-sheet` (phone) / fade + 8 px rise (desktop); exit 150 ms | 250 ms | instant |
| Hover and press | Every `a`, `button`, `summary`, `label` and field eases colour, border, underline, shadow and translate (base layer, zero specificity); hover signatures in §5; press `translate-y-px` lands in 75–80 ms | 180–280 ms in, 180 ms out | instant |
| Pointer reactions (marketing pages) | Icons act out their word once when a mouse settles on their block for 70 ms (a quick sweep sets nothing off) or a finger taps it (`[data-play]`; `PlayOnPointer` in the `(site)` layout keeps it running to the end and never loops): the lock jumps and its shackle pops open and snaps shut as it lands (`.play-hop` on what jumps), the clock's hands sweep one turn, the return arrow swings back, a check redraws its tick, "To Keysfirst" shakes its head (`.play-shake`). Lock diagram: the lock arrives open and clicks shut once its block has risen in (`.lock-shuts`); resting on the tenant or a real way out (`[data-lean]` in `[data-flow]`, set by `PlayOnPointer`, not `:has(:hover)`, which left arrows pushed out) leans that arrow 6 px toward where the money goes after 60 ms and lets go 160 ms after the pointer leaves; the way out that doesn't exist moves nothing. A check that appears (Copied) draws in (`.draw-in`). Everything that moves is its own compositor layer moved by whole pixels; the lock's shackle and the clock's hands are separate layers (`PlayIcon`), so nothing is repainted mid-move | 380–820 ms; arrows 320 ms `ease-settle` in, 200 ms out | none |
| App pages (deal, My deals, create, guide, handover) | `.enter-stack`: children rise 8 px, 60 ms apart (4th child onwards at 180 ms); create flow: each step's content rises in (`.step-in`, keyed by step) and the progress bar fills over 300 ms | 320 ms / 280 ms ease-out | none |
| Marketing pages | Every page's hero rises in reading order like the landing (`.enter`), markers draw once; `ScrollReveal` sits in the `(site)` layout and re-arms after each navigation | as the landing rows above | none |
| Waiting | pulsing dot (`animate-pulse-dot`), spinner (`animate-spin`) | loops | static dot, static icon |

Only `transform` and `opacity` animate (plus `background-size` for the marker, `stroke-dashoffset` for a check drawing its tick, and the FAQ answer's height). No scroll-jacking, parallax, confetti or looping decoration. Motion never delays an action: buttons work mid-animation. Every landing rule sits inside `@media (prefers-reduced-motion: no-preference)`, and reduced motion also zeroes animation and transition delays.

## 9. Accessibility checklist (WCAG 2.1 AA)

- Contrast pairs from the brand guidelines only (text ≥ 4.5:1, large text and controls ≥ 3:1). Highlighter is never the only signal.
- Semantic landmarks: `header`, `nav` (with `aria-label`), `main` (skip link "Skip to content" first in the tab order), `footer`; one `h1` per page; headings in order.
- Every control has a visible label; icon-only buttons have `aria-label`; wallet icons have `alt` with the wallet name.
- Live regions: deal status changes are announced once (`role="status"`); countdowns are not announced every second.
- Keyboard: everything reachable and operable; dialogs trap focus (native `<dialog>`) and restore it; Esc closes; no keyboard traps.
- Forms: errors identified in text next to the field and summarised on submit; inputs use `inputMode="decimal"` for money, `autoComplete="off"` where needed.
- Zoom to 200 % and 320 px width without loss; no horizontal scrolling at 375 px.
- Images: pictograms beside headings are decorative (`aria-hidden`); informative illustrations (guide) have alt text describing the step.
- `prefers-reduced-motion` honoured globally (base layer) and in JS-driven motion.

## 10. Implementation notes

- No new runtime dependencies. Keep `qrcode.react` and web3. Login is Privy (`@privy-io/react-auth`) through `AccountProvider`; its modal replaces any connect sheet.
- Link-preview and icon images are drawn with `ImageResponse` in the same brand language: Highlighter plate, ink type.
- The wallet request icon stays a PNG at `/icon.png` (Phantom renders SVG icons as a black square).
- Class merging: a 5-line `cx(...classes)` helper in `lib/cx.ts`; no `clsx` or `tailwind-merge`.
