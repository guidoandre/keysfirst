# Keysfirst Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Keysfirst web app's visual layer with the approved "Clear Rules" brand and add the missing pages (landing, guide, My deals, content pages, system states, previews) without changing any on-chain behaviour, merged to `main` by Thu 1 Oct 2026 evening.

**Architecture:** Next.js 16 App Router in `web/` with two route groups: `(site)` for static marketing pages without wallet code (fast on phones), `(app)` for wallet pages under one `Providers` + connect-sheet tree. Tailwind v4 tokens from `docs/design-system.md` in `globals.css`; small, focused components in `src/components/{ui,brand,site,wallet,deal,marketing,guide}`; all deal logic stays in `src/lib/rules.ts` and new pure modules (`deal-view.ts`, `dashboard.ts`, `new-deal.ts`) that are unit-tested with vitest.

**Tech Stack:** Next.js 16.3.6 (Turbopack, React 19.2 + vendored canary), Tailwind CSS 4.3, TypeScript 5 strict, `@solana/wallet-adapter-react` 0.15.40, `@solana/web3.js` 1.x, `@anchor-lang/core` 1.2, `qrcode.react` 4, vitest 4, `next/font/google`, `next/og` `ImageResponse`.

**Spec:** [docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md](../specs/2026-09-28-keysfirst-redesign-design.md) · Brand: [docs/brand-guidelines.md](../../brand-guidelines.md) · Tokens and components: [docs/design-system.md](../../design-system.md) · Product rules: [docs/superpowers/specs/2026-09-27-keysfirst-design.md](../specs/2026-09-27-keysfirst-design.md) §6 and §10.

## Global Constraints

- No change to the on-chain program, the deal rules (product spec §6) or the deployment.
- The UI never offers an action the program would reject: every button comes from `availableActions()` in `web/src/lib/rules.ts` (unchanged file).
- Keep exactly as they behave today: (1) the landlord's QR encodes `https://<origin>/deal/<id>/handover`, and that page links to `solana:<origin>/api/handover/<id>`; (2) `/api/handover/[id]` and its tenant-only check (`handoverProblem`) unchanged; (3) "Open in Phantom" wherever a phone browser has no wallet; (4) deal polling every 2 s that pauses in hidden tabs, `disableRetryOnRateLimit: true`, transaction history fetched only while a timeline link is missing; (5) action buttons re-check the live deal status before signing; (6) the wallet request icon is a PNG at `/icon.png`; the faucet's SOL top-up stays 0.02.
- Devnet only. Never print, paste or commit private keys or seed phrases (`web/.env.local` and `.keys/` stay untouched).
- No new dependencies. The one approved addition is a font file: Barlow Semi Condensed Bold TTF (SIL Open Font License) in `web/assets/fonts/`, used only for link-preview images.
- Copy: plain English, no blockchain jargon (brand guidelines §1 "Words we use" and §6 "Prohibited"); status labels exactly `Waiting for deposit`, `Deposit locked`, `Released to landlord`, `Returned to tenant`, `Cancelled` (never uppercased); amounts like `€600.00`; English only; no exclamation marks; no emoji.
- Honesty: every page shows the devnet ribbon; no invented testimonials, numbers, logos or press; §551 BGB stated only as written in the FAQ task; limitations (product spec §10) stated, including that the devnet program can still be upgraded by its deploy key. Never claim "nobody can take the money" or "nobody can change the rules".
- Styling: Tailwind v4 CSS-first. Only the semantic colour utilities from `docs/design-system.md` §2 exist (`bg-canvas`, `bg-subtle`, `bg-inverse`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-inverse`, `text-fg-inverse-muted`, `border-rule`, `border-field`, `bg-accent`, `bg-accent-soft`, `*-released(-soft)`, `*-returned(-soft)`, `*-danger(-soft)`, `white`). Fonts: `font-sans` (Barlow), `font-display` (Barlow Semi Condensed). No gradients, glows, blur, shadows except `shadow-pop` / `shadow-sheet`.
- React lint (eslint-plugin-react-hooks 7, errors): no synchronous `setState` in an effect body (defer with `setTimeout(fn, 0)` as `lib/hooks.ts` does), no reading `ref.current` during render, no `Date.now()` / `new Date()` without arguments during render (use `useNow()`), no components declared inside components.
- Next.js 16: `params` and `searchParams` are Promises; `error.tsx` receives `retry`; `metadata` only from server files; marketing pages export `dynamic = "error"`; never call `headers()` / `getOrigin()` in the root layout or the `(site)` layout; `ImageResponse` fonts must be TTF.
- Commands (PowerShell, in `web/`): `npm test`, `npm run lint`, `npm run build`. Dev server: `npm run dev` (Claude: `preview_start` with name `web` from `.claude/launch.json`).
- Browser checks for every UI task: widths 375 and 1280; no console errors; no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).
- Git: branch `redesign` only; production stays on `main`. Commit message `type(scope): summary` and every commit ends with the trailer, e.g. `git commit -m "feat(web): summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`. Push at the end of every milestone; merge to `main` only after the user approves the Preview.
- After each milestone: tell the user what works, what doesn't, what's next; tick this plan's checkboxes.

## File Structure

```
web/
├── assets/fonts/BarlowSemiCondensed-Bold.ttf, OFL.txt      (Task 14: link-preview font, approved)
├── scripts/make-favicon.mjs                                 (Task 14)
├── next.config.ts                                           (Task 14: font file tracing)
├── vitest.config.ts                                         (Task 2: TZ=UTC for date tests)
└── src/
    ├── app/
    │   ├── layout.tsx            root: fonts, metadata, skip link, ribbon, footer (no wallet code)
    │   ├── globals.css           design-system tokens
    │   ├── fonts.ts              next/font definitions
    │   ├── error.tsx  global-error.tsx  not-found.tsx
    │   ├── icon.svg  favicon.ico  apple-icon.tsx  manifest.ts  robots.ts  sitemap.ts  opengraph-image.tsx
    │   ├── icon.png/route.tsx    wallet request icon (PNG)            [kept path]
    │   ├── api/handover/[id]/route.ts  api/faucet/route.ts  test-eur.json/route.ts   [unchanged]
    │   ├── (site)/               static marketing pages, no wallet code
    │   │   ├── layout.tsx  error.tsx  page.tsx (landing)
    │   │   └── how-it-works/ faq/ tenants/ landlords/ about/   page.tsx (+ opengraph-image.tsx, Task 17)
    │   └── (app)/                wallet pages
    │       ├── layout.tsx  error.tsx  providers.tsx
    │       ├── start/page.tsx  start/GuideFunds.tsx
    │       ├── new/page.tsx  new/CreateDealFlow.tsx
    │       ├── deals/page.tsx  deals/MyDeals.tsx
    │       ├── deal/[id]/page.tsx  DealClient.tsx  loading.tsx  opengraph-image.tsx  handover/page.tsx
    │       └── dev/ui  dev/deal  dev/deals   (development-only galleries, 404 in production)
    ├── components/
    │   ├── brand/  Logo.tsx  Pictogram.tsx
    │   ├── ui/     Icon  Button  Callout  StatusChip  Timetable  Segmented  Field  Sheet  ConfirmDialog  CopyField  Skeleton  EmptyState
    │   ├── site/   DevnetRibbon  SiteHeader  SiteFooter  NavLinks  MobileMenu  ErrorView
    │   ├── wallet/ ConnectProvider  ConnectSheet  AppHeader  WalletChip  LoginButton  OpenInPhantom  TestFundsButton
    │   ├── deal/   DealView  DealHero  CountdownPanel  NextStep  ShareBox  DealTimetable  DealDetails  DealStates  HandoverMode  ReleasedScreen  DealCard
    │   ├── marketing/  SectionHeader  RulesTimetable  ProblemSteps  StepList  AudienceSplit  ScenarioGrid  WhySolana  FaqList  CtaBand  AskLandlord  OpenHashDetails
    │   └── guide/  GuideIllustrations.tsx
    ├── content/  scenarios.ts  faq.ts
    └── lib/
        ├── rules.ts instructions.ts send.ts program.ts config.ts origin.ts      [unchanged]
        ├── format.ts (+ formatCountdown, formatShortDateTime, shortAddress, whatsappUrl)
        ├── hooks.ts  (+ useWakeLock)
        ├── cx.ts  site.ts  deal-view.ts  deal-data.ts  dashboard.ts  new-deal.ts  use-deal.ts  use-my-deals.ts
        └── *.test.ts
```

Removed along the way: `src/components/{WalletButton,DealActions,HandoverQR,ShareLink,Timeline,OpenInPhantom,TestFundsButton}.tsx` (old locations), `src/app/providers.tsx` (moves into `(app)`), `public/{icon,next,vercel,globe,file,window}.svg`.

## Schedule and milestones

| Milestone | Tasks | When | Ends with |
|---|---|---|---|
| M1 Foundation | 1–4 | Tue 29 Sep morning | push → Preview check (env vars, no login wall) |
| M2 The deal | 5–8 | Tue 29 Sep | push → user's quick phone check |
| M3 Create + My deals | 9–10 | Wed 30 Sep morning | push |
| M4 Landing + guide | 11–12 | Wed 30 Sep | push |
| M5 States, metadata, icons | 13–14 | Wed 30 Sep evening | push |
| M6 Content pages | 15–17 | Thu 1 Oct morning | push (cut order: About → For tenants/For landlords → per-page previews) |
| M7 Audit and merge | 18–20 | Thu 1 Oct | user's Phantom regression → merge |

Cut rule (agreed 2026-09-27): if Thursday gets tight, skip Task 17's parts in this order: About page → For tenants and For landlords pages → page-specific preview images. When a page is cut, remove its links from `SITE_NAV` (Task 4), `SiteFooter` (Task 4) and `sitemap.ts` (Task 14), and point the "Ask your landlord" message at `/` instead of `/landlords` (Task 11).

---

### Task 1: Tokens, fonts, class helper, site URL and root metadata

**Files:**
- Modify: `web/src/app/globals.css` (replace)
- Create: `web/src/app/fonts.ts`
- Create: `web/src/lib/cx.ts`, `web/src/lib/cx.test.ts`
- Create: `web/src/lib/site.ts`, `web/src/lib/site.test.ts`
- Modify: `web/src/app/layout.tsx` (fonts on `<html>`, metadata, viewport; everything else stays until Task 4)

**Interfaces:**
- Produces: `cx(...parts: Array<string | false | null | undefined>): string` from `@/lib/cx`; `PRODUCTION_URL: string`, `siteUrl(env?: Record<string, string | undefined>): string` from `@/lib/site`; `barlow`, `barlowCondensed` from `@/app/fonts` (CSS variables `--font-barlow`, `--font-barlow-condensed`); every token utility listed in Global Constraints.

- [ ] **Step 1: Write the failing tests**

`web/src/lib/cx.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins class names and skips falsy parts", () => {
    expect(cx("a", false, "b", null, undefined, "", "c")).toBe("a b c");
    expect(cx()).toBe("");
  });
});
```

`web/src/lib/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PRODUCTION_URL, siteUrl } from "./site";

describe("siteUrl", () => {
  it("uses the production domain in production", () => {
    expect(siteUrl({ VERCEL_ENV: "production", VERCEL_URL: "keysfirst-abc.vercel.app" })).toBe(PRODUCTION_URL);
  });
  it("uses the branch URL on Preview deployments", () => {
    expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "keysfirst-git-redesign-x.vercel.app", VERCEL_URL: "keysfirst-123.vercel.app" }))
      .toBe("https://keysfirst-git-redesign-x.vercel.app");
    expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "keysfirst-123.vercel.app" })).toBe("https://keysfirst-123.vercel.app");
  });
  it("falls back to localhost", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run (in `web/`): `npm test`
Expected: FAIL, `Failed to resolve import "./cx"` and `"./site"`.

- [ ] **Step 3: Write `web/src/lib/cx.ts`**

```ts
/** Joins class names, skipping falsy parts: cx("a", open && "b") */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Write `web/src/lib/site.ts`**

```ts
export const PRODUCTION_URL = "https://keysfirst.vercel.app";

/**
 * The public origin used for metadata and link previews. Comes from the build environment, never from
 * request headers, so marketing pages stay static. Vercel sets VERCEL_ENV, VERCEL_BRANCH_URL and VERCEL_URL.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === "production") return PRODUCTION_URL;
  const preview = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
  return preview ? `https://${preview}` : "http://localhost:3000";
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm test`
Expected: all test files pass (the existing 19 tests plus the new ones).

- [ ] **Step 6: Replace `web/src/app/globals.css`**

Copy the complete CSS block from `docs/design-system.md` §2 (from `@import "tailwindcss";` to the end of the `@utility label` block) into `web/src/app/globals.css`, unchanged. It is reproduced here so this task is self-contained:

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

  /* Elevation: borders do most of the work; shadows only for things that float */
  --shadow-pop: 0 18px 40px -20px rgb(22 24 29 / 0.45);
  --shadow-sheet: 0 -16px 48px -16px rgb(22 24 29 / 0.4);

  /* Motion */
  --ease-out: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-in: cubic-bezier(0.5, 0, 0.9, 0.4);
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
  --ribbon-h: 2rem;
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
      animation-duration: 1ms !important; animation-iteration-count: 1 !important;
      transition-duration: 1ms !important; scroll-behavior: auto !important;
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

- [ ] **Step 7: Write `web/src/app/fonts.ts`**

```ts
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";

// Loaded once and imported wherever needed (root layout, global-error). Not variable fonts, so weights are listed.

/** Body and UI text: Barlow 400 and 600. */
export const barlow = Barlow({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
});

/** Headings, labels and numbers: Barlow Semi Condensed 600 and 700. */
export const barlowCondensed = Barlow_Semi_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow-condensed",
});
```

- [ ] **Step 8: Update `web/src/app/layout.tsx`** (fonts, metadata and viewport only; the header, providers and wallet stylesheet stay until Task 4)

Replace the file with:

```tsx
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { WalletButton } from "@/components/WalletButton";
import { siteUrl } from "@/lib/site";
import { barlow, barlowCondensed } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Keysfirst · The deposit moves only when the keys do", template: "%s · Keysfirst" },
  description:
    "A deposit link for renting a room in Germany from abroad. The landlord is paid only when the tenant scans their code at the key handover; otherwise the deposit goes back. Solana devnet prototype with test money.",
  openGraph: { siteName: "Keysfirst", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#16181D" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="bg-subtle px-4 py-2 text-center text-xs text-fg-muted">
            Prototype on Solana devnet · test money only, nothing here has real value
          </div>
          <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-display text-lg font-bold">
              Keysfirst
            </Link>
            <WalletButton />
          </header>
          <main className="mx-auto max-w-xl px-4 pb-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Verify**

Run: `npm test` → all pass. `npm run lint` → no errors. `npm run build` → succeeds; the route table still lists `/` and `/new` as `○ (Static)`.
Start the dev server and open `http://localhost:3000/`: text renders in Barlow (check in dev tools: computed `font-family` of `body` starts with `__Barlow`), the old page is unstyled where it used removed palette classes (expected until Tasks 4–11), and there are no console errors.

- [ ] **Step 10: Commit**

```bash
git add web/src/app/globals.css web/src/app/fonts.ts web/src/app/layout.tsx web/src/lib/cx.ts web/src/lib/cx.test.ts web/src/lib/site.ts web/src/lib/site.test.ts
git commit -m "feat(web): Clear Rules design tokens, Barlow fonts, site URL and root metadata" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Format helpers, icons, logo and pictograms

**Files:**
- Modify: `web/src/lib/format.ts` (append helpers), `web/src/lib/format.test.ts` (append tests)
- Modify: `web/vitest.config.ts` (fixed time zone for date tests)
- Create: `web/src/components/ui/Icon.tsx`
- Create: `web/src/components/brand/Logo.tsx`, `web/src/components/brand/Pictogram.tsx`

**Interfaces:**
- Consumes: `cx` (Task 1); existing `formatDuration` in `format.ts`.
- Produces: `formatCountdown(seconds: number): string`, `formatShortDateTime(unixSeconds: number, timeZone?: string): string`, `shortAddress(address: string): string`, `whatsappUrl(text: string): string` from `@/lib/format`; `Icon`, `type IconName` from `@/components/ui/Icon`; `Logo`, `LogoMark` from `@/components/brand/Logo`; `Pictogram`, `type PictogramName` from `@/components/brand/Pictogram`.

- [ ] **Step 1: Pin the test time zone**

Replace `web/vitest.config.ts` with:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Date strings are shown in the viewer's time zone; tests pin UTC so they don't depend on the machine.
  test: { include: ["src/**/*.test.ts"], env: { TZ: "UTC" } },
});
```

- [ ] **Step 2: Write the failing tests** (append to `web/src/lib/format.test.ts`, and add the new names to its import line so it reads `import { explorerTx, formatCountdown, formatDuration, formatEur, formatShortDateTime, parseEur, phantomBrowseUrl, shortAddress, whatsappUrl } from "./format";`)

```ts
describe("formatCountdown", () => {
  it("shows two units above an hour and ticks in seconds below it", () => {
    expect(formatCountdown(90_061)).toBe("1 day 1 h");
    expect(formatCountdown(3_660)).toBe("1 h 1 min");
    expect(formatCountdown(252)).toBe("4 min 12 s");
    expect(formatCountdown(240)).toBe("4 min");
    expect(formatCountdown(45)).toBe("45 s");
    expect(formatCountdown(-3)).toBe("0 s");
  });
});

describe("formatShortDateTime", () => {
  const wed30Sep1400Utc = Date.UTC(2026, 8, 30, 14, 0) / 1000;
  it("formats as weekday, day, month and 24-hour time", () => {
    expect(formatShortDateTime(wed30Sep1400Utc, "UTC")).toBe("Wed 30 Sep, 14:00");
    expect(formatShortDateTime(Date.UTC(2026, 9, 4, 9, 5) / 1000, "UTC")).toBe("Sun 4 Oct, 09:05");
  });
  it("uses the given time zone", () => {
    expect(formatShortDateTime(wed30Sep1400Utc - 2 * 3600, "Europe/Berlin")).toBe("Wed 30 Sep, 14:00");
  });
  it("defaults to the viewer's time zone (UTC in tests)", () => {
    expect(formatShortDateTime(wed30Sep1400Utc)).toBe("Wed 30 Sep, 14:00");
  });
});

describe("shortAddress / whatsappUrl", () => {
  it("shortens wallet addresses", () => {
    expect(shortAddress("7xKpQ2mZr9sT4uV6wX8yA1bC3dE5fG7hJ9kL3mQe")).toBe("7xKp…3mQe");
    expect(shortAddress("short")).toBe("short");
  });
  it("builds a WhatsApp share link", () => {
    expect(whatsappUrl("Pay here: https://k.app/deal/x")).toBe("https://wa.me/?text=Pay%20here%3A%20https%3A%2F%2Fk.app%2Fdeal%2Fx");
  });
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL with `formatCountdown is not a function` (and the other new names).

- [ ] **Step 4: Append the helpers to `web/src/lib/format.ts`**

```ts
/** Time left, ticking: 90061 -> "1 day 1 h", 3660 -> "1 h 1 min", 252 -> "4 min 12 s", 45 -> "45 s" */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s >= 3_600) return formatDuration(s);
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  if (minutes > 0) return `${minutes} min${rest ? ` ${rest} s` : ""}`;
  return `${rest} s`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Wed 30 Sep, 14:00" in the viewer's time zone (or `timeZone`). Built from parts so every browser prints the same. */
export function formatShortDateTime(unixSeconds: number, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(unixSeconds * 1000));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${MONTHS[Number(part("month")) - 1]}, ${part("hour")}:${part("minute")}`;
}

/** "7xKpQ2…3mQe" -> "7xKp…3mQe" */
export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm test`
Expected: PASS. If `formatShortDateTime(…)` without a time zone fails, the worker ignored `env.TZ`: add `web/vitest.setup.ts` containing `process.env.TZ = "UTC";`, add `setupFiles: ["./vitest.setup.ts"]` to the `test` block, and run again.

- [ ] **Step 6: Write `web/src/components/ui/Icon.tsx`**

```tsx
import type { SVGProps } from "react";

// 24 px grid, 2 px stroke, square caps (design system §7). Always next to a text label, or given `label`.
const PATHS = {
  lock: (
    <>
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <rect x="4.5" y="11" width="15" height="10" rx="1.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M17 12v4M20.5 12v3" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  hourglass: <path d="M6 3h12M6 21h12M7.5 3v3.5L12 12l-4.5 5.5V21M16.5 3v3.5L12 12l4.5 5.5V21" />,
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  external: <path d="M7 17L17 7M9 7h8v8" />,
  return: (
    <>
      <path d="M9 4L4 9l5 5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3M7 8l5-5 5 5" />
      <path d="M5 13v6.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  qr: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5l9 16.5H3z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.3v.4" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  door: (
    <>
      <path d="M6 21V4h12v17M3 21h18" />
      <path d="M14.5 12v1.5" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" />,
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  logout: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  label,
  ...rest
}: { name: IconName; size?: number; label?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
```

- [ ] **Step 7: Write `web/src/components/brand/Logo.tsx`**

```tsx
import Link from "next/link";
import { cx } from "@/lib/cx";

const INK = "#16181D";
const MARKER = "#FFE14D";

/** The key drawn as a timeline on the Highlighter plate (brand guidelines §2). `simplified` below 24 px. */
export function LogoMark({ size = 32, simplified = false, className }: { size?: number; simplified?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cx("shrink-0", className)}>
      <rect width="48" height="48" rx="10" fill={MARKER} />
      {simplified ? (
        <>
          <circle cx="15" cy="24" r="7" fill="none" stroke={INK} strokeWidth="5" />
          <path d="M22 24H40M31 24v7" stroke={INK} strokeWidth="5" strokeLinecap="square" />
        </>
      ) : (
        <>
          <circle cx="15" cy="24" r="6.5" fill="none" stroke={INK} strokeWidth="4" />
          <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke={INK} strokeWidth="4" strokeLinecap="square" />
        </>
      )}
    </svg>
  );
}

/** Lockup: mark + "Keysfirst". Links home unless `href` is null. */
export function Logo({ inverse = false, size = 32, href = "/" }: { inverse?: boolean; size?: number; href?: string | null }) {
  const lockup = (
    <span className={cx("inline-flex items-center gap-2.5", inverse ? "text-fg-inverse" : "text-fg")}>
      <LogoMark size={size} />
      <span className="font-display font-bold tracking-[-0.01em]" style={{ fontSize: Math.round(size * 0.72) }}>
        Keysfirst
      </span>
    </span>
  );
  if (href === null) return lockup;
  return (
    <Link href={href} aria-label="Keysfirst home" className="rounded-md">
      {lockup}
    </Link>
  );
}
```

- [ ] **Step 8: Write `web/src/components/brand/Pictogram.tsx`**

```tsx
import type { ReactNode } from "react";

const INK = "#16181D";
const MARKER = "#FFE14D";

// 56-unit grid, solid ink shapes and 4-unit strokes, one Highlighter accent (brand guidelines §5). Decorative only.
const PICTOGRAMS = {
  "pay-into-lock": (
    <>
      <path d="M18 24v-6a10 10 0 0 1 20 0v6" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="11" y="24" width="34" height="24" rx="4" fill={MARKER} stroke={INK} strokeWidth="4" />
      <path d="M33 31.5a6.5 6.5 0 1 0 0 9M22 34.5h9M22 38h9" fill="none" stroke={INK} strokeWidth="2.6" />
    </>
  ),
  "scan-at-door": (
    <>
      <rect x="6" y="6" width="22" height="44" rx="2" fill="none" stroke={INK} strokeWidth="4" />
      <circle cx="23" cy="29" r="2.4" fill={INK} />
      <rect x="31" y="18" width="19" height="32" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M36 25h4v4h-4zM41.5 25h4v4h-4zM36 31h4v4h-4zM41.5 36h4v4h-4z" fill={INK} />
      <path d="M31 42h19" stroke={MARKER} strokeWidth="4" />
    </>
  ),
  "keys-change-hands": (
    <>
      <circle cx="16" cy="12" r="6" fill={INK} />
      <path d="M8 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <circle cx="36" cy="30" r="6" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M42 30h10M47 30v6" stroke={INK} strokeWidth="4" />
      <path d="M24 30h6" stroke={MARKER} strokeWidth="4" />
    </>
  ),
  "back-to-you": (
    <>
      <path d="M44 28a16 16 0 1 1-5-11.6" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M40 8v10H30" fill="none" stroke={INK} strokeWidth="4" />
      <circle cx="28" cy="28" r="8" fill={MARKER} stroke={INK} strokeWidth="3" />
    </>
  ),
  tenant: (
    <>
      <circle cx="20" cy="12" r="6" fill={INK} />
      <path d="M12 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <rect x="31" y="30" width="16" height="20" rx="3" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M35 30v-4h8v4" fill="none" stroke={INK} strokeWidth="3" />
    </>
  ),
  landlord: (
    <>
      <circle cx="18" cy="12" r="6" fill={INK} />
      <path d="M10 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <circle cx="36" cy="30" r="5.5" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M41.5 30H50M46 30v5" stroke={INK} strokeWidth="3" />
    </>
  ),
  "fake-listing": (
    <>
      <rect x="8" y="8" width="40" height="40" rx="4" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M8 20h40" stroke={INK} strokeWidth="4" />
      <rect x="12" y="12" width="12" height="4" fill={MARKER} />
      <path d="M23 30a5 5 0 1 1 7 4.6c-1.3.6-2 1.4-2 2.9V39" fill="none" stroke={INK} strokeWidth="3.5" />
      <circle cx="28" cy="44" r="2" fill={INK} />
    </>
  ),
  deadline: (
    <>
      <path d="M28 12a18 18 0 0 1 18 18H28z" fill={MARKER} />
      <circle cx="28" cy="30" r="18" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M28 20v10l7 5" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M22 6h12" stroke={INK} strokeWidth="4" />
    </>
  ),
  "phone-wallet": (
    <>
      <rect x="16" y="4" width="24" height="48" rx="5" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="21" y="18" width="14" height="10" rx="2" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M25 44h6" stroke={INK} strokeWidth="4" />
    </>
  ),
  "laptop-wallet": (
    <>
      <rect x="10" y="12" width="36" height="24" rx="3" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M4 44h48" stroke={INK} strokeWidth="4" />
      <rect x="22" y="19" width="12" height="10" rx="2" fill={MARKER} stroke={INK} strokeWidth="3" />
    </>
  ),
  "share-link": (
    <>
      <rect x="6" y="22" width="24" height="12" rx="6" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="26" y="22" width="24" height="12" rx="6" fill={MARKER} stroke={INK} strokeWidth="4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type PictogramName = keyof typeof PICTOGRAMS;

export function Pictogram({ name, size = 56, className }: { name: PictogramName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" focusable="false" className={className}>
      {PICTOGRAMS[name]}
    </svg>
  );
}
```

- [ ] **Step 9: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → succeeds (the new components are not used yet; Task 3's gallery shows them).

- [ ] **Step 10: Commit**

```bash
git add web/vitest.config.ts web/src/lib/format.ts web/src/lib/format.test.ts web/src/components/ui/Icon.tsx web/src/components/brand
git commit -m "feat(web): countdown and date formats, icon set, logo and pictograms" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: UI primitives and the development gallery

**Files:**
- Create: `web/src/components/ui/{Button,Callout,StatusChip,Timetable,Segmented,Field,Sheet,ConfirmDialog,CopyField,Skeleton,EmptyState}.tsx`
- Create: `web/src/app/dev/ui/page.tsx`, `web/src/app/dev/ui/UiGallery.tsx` (development only; 404 in production)

**Interfaces:**
- Consumes: `cx` (Task 1), `Icon`, `Logo`, `LogoMark`, `Pictogram` (Task 2), `STATUS_LABEL`, `type DealStatus` from `@/lib/rules`.
- Produces:
  - `Button(props: ButtonLook & { loading?: boolean; loadingText?: string } & ButtonHTMLAttributes<HTMLButtonElement>)`, `ButtonLink(props: ButtonLook & { href: string; external?: boolean } & anchor attributes)`, `buttonClass(look?: ButtonLook): string`, `type ButtonVariant = "primary" | "secondary" | "quiet" | "danger"`, `type ButtonSize = "sm" | "md" | "lg"`, `interface ButtonLook { variant?; size?; fullWidth? }`
  - `Callout({ tone?: "info" | "success" | "returned" | "danger" | "neutral"; title?: string; children?; role?: "status" | "alert"; className? })`
  - `StatusChip({ status: DealStatus; size?: "sm" | "md"; tone?: "default" | "onBand"; animate?: boolean; className? })`
  - `Timetable({ title?: ReactNode; aside?: ReactNode; rows: TimetableRow[]; footer?: ReactNode; headingLevel?: "h2" | "h3" | "p"; className? })`, `interface TimetableRow { key: string; time?: ReactNode; title: ReactNode; detail?: ReactNode; state: "done" | "now" | "next" | "later"; tone?: "released" | "returned" }`
  - `Segmented<T extends string>({ name; legend; options: { value: T; label: string; hint?: string }[]; value: T; onChange: (v: T) => void; hideLegend?; disabled?; className? })`
  - `TextField({ id; label; hint?; error?; counter?; trailing?; className? } & InputHTMLAttributes<HTMLInputElement>)`
  - `Sheet({ open: boolean; onClose: () => void; title: string; children; variant?: "sheet" | "full"; className? })`
  - `ConfirmDialog({ open; title; body; confirmLabel; danger?: boolean; onConfirm: () => void; onCancel: () => void })`
  - `CopyField({ value: string; label: string })`, `Skeleton({ className? })`, `EmptyState({ pictogram: PictogramName; title: string; children?; action?: ReactNode })`

- [ ] **Step 1: Write `web/src/components/ui/Button.tsx`**

```tsx
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md text-center font-semibold leading-tight transition-[background-color,color,border-color] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-(--btn-h-sm) px-4 py-1.5 text-[0.9375rem]",
  md: "min-h-(--btn-h) px-5 py-2.5 text-base",
  lg: "min-h-(--btn-h-lg) px-6 py-3 text-lg",
};
const VARIANTS: Record<Exclude<ButtonVariant, "quiet">, string> = {
  // Hover: a 4 px Highlighter bar inside the bottom edge (design system §5).
  primary:
    "bg-inverse text-fg-inverse hover:[background-image:linear-gradient(to_top,var(--k-marker)_4px,transparent_4px)] disabled:bg-subtle disabled:text-fg-subtle disabled:[background-image:none]",
  secondary: "border-2 border-fg bg-canvas text-fg hover:bg-subtle disabled:border-rule disabled:bg-canvas disabled:text-fg-subtle",
  danger: "border-2 border-danger bg-canvas text-danger hover:bg-danger-soft disabled:border-rule disabled:text-fg-subtle",
};
const QUIET =
  "inline-flex items-center gap-1.5 rounded-sm font-semibold text-fg underline decoration-accent decoration-2 underline-offset-4 hover:decoration-[3px]";

export function buttonClass({ variant = "primary", size = "md", fullWidth = false }: ButtonLook = {}): string {
  if (variant === "quiet") return QUIET;
  return cx(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full");
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonLook & { loading?: boolean; loadingText?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? (
        <>
          <Icon name="spinner" size={18} className="animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  external = false,
  className,
  children,
  ...rest
}: ButtonLook & { href: string; external?: boolean; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cx(buttonClass({ variant, size, fullWidth }), className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
        <Icon name="external" size={16} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Write `web/src/components/ui/Callout.tsx`**

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type CalloutTone = "info" | "success" | "returned" | "danger" | "neutral";

const TONES: Record<CalloutTone, { box: string; icon: IconName; iconColor: string }> = {
  info: { box: "bg-accent-soft before:bg-accent", icon: "info", iconColor: "text-fg" },
  success: { box: "bg-released-soft before:bg-released", icon: "check", iconColor: "text-released" },
  returned: { box: "bg-returned-soft before:bg-returned", icon: "return", iconColor: "text-returned" },
  danger: { box: "bg-danger-soft before:bg-danger", icon: "alert", iconColor: "text-danger" },
  neutral: { box: "bg-subtle before:bg-field", icon: "info", iconColor: "text-fg-muted" },
};

export function Callout({
  tone = "info",
  title,
  children,
  role,
  className,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={role}
      className={cx(
        "relative flex gap-3 overflow-hidden rounded-md py-3 pr-4 pl-5 text-sm leading-relaxed text-fg before:absolute before:inset-y-0 before:left-0 before:w-1",
        t.box,
        className,
      )}
    >
      <Icon name={t.icon} size={18} className={cx("mt-0.5 shrink-0", t.iconColor)} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `web/src/components/ui/StatusChip.tsx`**

```tsx
import { cx } from "@/lib/cx";
import { STATUS_LABEL, type DealStatus } from "@/lib/rules";
import { Icon, type IconName } from "./Icon";

const LOOK: Record<DealStatus, { chip: string; icon: IconName; onBandIcon: string }> = {
  open: { chip: "border-[1.5px] border-field bg-canvas text-fg", icon: "hourglass", onBandIcon: "text-fg" },
  funded: { chip: "bg-inverse text-fg-inverse", icon: "lock", onBandIcon: "text-fg" },
  released: { chip: "bg-released text-white", icon: "check", onBandIcon: "text-released" },
  refunded: { chip: "bg-returned text-white", icon: "return", onBandIcon: "text-returned" },
  cancelled: { chip: "bg-subtle text-fg-muted", icon: "close", onBandIcon: "text-fg-muted" },
};

/**
 * One of the five fixed status labels (product spec §8), never uppercased.
 * tone "onBand": a white chip for use on a coloured deal band. `animate`: flips in; pass true only when
 * the status changed while the page was open.
 */
export function StatusChip({
  status,
  size = "md",
  tone = "default",
  animate = false,
  className,
}: {
  status: DealStatus;
  size?: "sm" | "md";
  tone?: "default" | "onBand";
  animate?: boolean;
  className?: string;
}) {
  const look = LOOK[status];
  return (
    <span className={cx("inline-block [perspective:400px]", className)}>
      <span
        key={status}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-sm font-display font-semibold",
          size === "md" ? "px-2.5 py-1.5 text-[0.9375rem]" : "px-2 py-1 text-[0.8125rem]",
          tone === "onBand" ? "bg-canvas text-fg" : look.chip,
          animate && "animate-flip",
        )}
      >
        <Icon
          name={look.icon}
          size={size === "md" ? 16 : 14}
          className={cx(tone === "onBand" ? look.onBandIcon : status === "funded" && "text-accent")}
        />
        {STATUS_LABEL[status]}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Write `web/src/components/ui/Timetable.tsx`**

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export type RowState = "done" | "now" | "next" | "later";

export interface TimetableRow {
  key: string;
  time?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  state: RowState;
  tone?: "released" | "returned";
}

const MARK: Record<RowState, string> = {
  done: "bg-inverse text-fg-inverse",
  now: "border-2 border-fg bg-accent",
  next: "border-2 border-fg bg-canvas",
  later: "border-2 border-dashed border-field bg-canvas",
};

/** The signature component: rules and deals as timetable rows (time | what happens | outcome). */
export function Timetable({
  title,
  aside,
  rows,
  footer,
  headingLevel = "h2",
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  rows: TimetableRow[];
  footer?: ReactNode;
  headingLevel?: "h2" | "h3" | "p";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section className={cx("overflow-hidden rounded-lg border-2 border-fg bg-canvas", className)}>
      {title && (
        <div className="flex items-baseline justify-between gap-3 bg-inverse px-4 py-3 text-fg-inverse">
          <Heading className="label">{title}</Heading>
          {aside && <span className="truncate text-sm text-fg-inverse-muted">{aside}</span>}
        </div>
      )}
      <ol className="divide-y divide-rule">
        {rows.map((row) => (
          <li
            key={row.key}
            aria-current={row.state === "now" ? "step" : undefined}
            className={cx(
              "grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-0.5 px-4 py-3.5 sm:grid-cols-[1.25rem_7rem_1fr]",
              row.state === "now" && "bg-accent-soft shadow-[inset_6px_0_0_var(--k-marker)]",
            )}
          >
            <span
              className={cx(
                "mt-1 grid size-4 place-items-center rounded-[4px]",
                row.tone === "released" ? "bg-released text-white" : row.tone === "returned" ? "bg-returned text-white" : MARK[row.state],
              )}
            >
              {row.state === "done" && <Icon name="check" size={12} className="[stroke-width:3]" />}
            </span>
            {row.time !== undefined && (
              <span className="col-start-2 font-display text-[0.95rem] leading-snug font-semibold text-fg-muted tabular-nums sm:col-start-auto">
                {row.time}
              </span>
            )}
            <div className="col-start-2 min-w-0 sm:col-start-auto">
              <p className="leading-snug font-semibold">{row.title}</p>
              {row.detail && <div className="mt-0.5 text-sm text-fg-muted">{row.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
      {footer && <div className="border-t border-rule px-4 py-2.5 text-xs text-fg-subtle">{footer}</div>}
    </section>
  );
}
```

- [ ] **Step 5: Write `web/src/components/ui/Segmented.tsx`**

```tsx
import { cx } from "@/lib/cx";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** A radio group that looks like buttons. Native radios, so arrow keys move between options. */
export function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
  disabled = false,
  className,
}: {
  name: string;
  legend: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hideLegend?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <fieldset disabled={disabled} className={cx("min-w-0", className)}>
      <legend className={cx("mb-2 text-sm font-semibold", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cx(
                "flex min-h-11 cursor-pointer flex-col justify-center rounded-md border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:shadow-[var(--focus-ring)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
                selected ? "border-fg bg-inverse text-fg-inverse" : "border-field bg-canvas text-fg hover:bg-subtle",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
              {option.hint && (
                <span className={cx("text-xs font-normal", selected ? "text-fg-inverse-muted" : "text-fg-muted")}>{option.hint}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 6: Write `web/src/components/ui/Field.tsx`**

```tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/** Label above (never placeholder-only), optional hint, error under the field (design system §7). */
export function TextField({
  id,
  label,
  hint,
  error,
  counter,
  trailing,
  className,
  ...input
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  counter?: string;
  trailing?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {counter && <span className="text-xs text-fg-subtle tabular-nums">{counter}</span>}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "h-(--field-h) w-full min-w-0 rounded-md bg-canvas px-3 text-base text-fg placeholder:text-fg-subtle",
            error ? "border-2 border-danger" : "border-[1.5px] border-field",
          )}
          {...input}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 7: Write `web/src/components/ui/Sheet.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/**
 * Modal built on the native <dialog> (replaces window.confirm, which in-app browsers can block):
 * the browser traps focus, Esc closes, focus returns to the opener.
 * "sheet": bottom sheet on phones, centred from sm up. "full": covers the screen (handover mode, Released).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "sheet" | "full";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    // A click on the <dialog> element itself (not its content) is a click on the backdrop.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={variant === "sheet" ? closeOnBackdrop : undefined}
      className={cx(
        "p-0 text-fg",
        variant === "sheet"
          ? "m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-xl bg-canvas shadow-sheet backdrop:bg-inverse/50 max-sm:animate-sheet sm:m-auto sm:max-w-md sm:rounded-xl sm:animate-rise"
          : "m-0 h-dvh max-h-none w-full max-w-none bg-canvas backdrop:bg-inverse",
        className,
      )}
    >
      {open &&
        (variant === "sheet" ? (
          <div className="max-h-[85dvh] overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-card font-bold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-md hover:bg-subtle"
              >
                <Icon name="close" />
              </button>
            </div>
            {children}
          </div>
        ) : (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {children}
          </>
        ))}
    </dialog>
  );
}
```

- [ ] **Step 8: Write `web/src/components/ui/ConfirmDialog.tsx`**

```tsx
"use client";

import { Button } from "./Button";
import { Sheet } from "./Sheet";

/** In-page confirmation for irreversible actions (release, cancel, landlord refund). */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="text-body text-fg-muted">{body}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Go back
        </Button>
        <Button variant={danger ? "danger" : "primary"} fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 9: Write `web/src/components/ui/CopyField.tsx`**

```tsx
"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function CopyField({ value, label }: { value: string; label: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some in-app browsers block the clipboard: select the text so it can be copied by hand.
      input.current?.select();
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          ref={input}
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          className="h-(--field-h) min-w-0 flex-1 rounded-md border-[1.5px] border-field bg-subtle px-3 font-mono text-sm text-fg"
        />
        <Button variant="secondary" onClick={copy} className="shrink-0">
          <Icon name={copied ? "check" : "copy"} size={18} />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied to the clipboard" : ""}
      </p>
    </div>
  );
}
```

- [ ] **Step 10: Write `web/src/components/ui/Skeleton.tsx` and `web/src/components/ui/EmptyState.tsx`**

`Skeleton.tsx`:

```tsx
import { cx } from "@/lib/cx";

/** Static placeholder block (no shimmer, per the motion rules). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("rounded-md bg-subtle", className)} />;
}
```

`EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

export function EmptyState({
  pictogram,
  title,
  children,
  action,
}: {
  pictogram: PictogramName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border-[1.5px] border-dashed border-field px-5 py-10 text-center">
      <Pictogram name={pictogram} size={64} className="mx-auto" />
      <h2 className="mt-4 font-display text-section font-bold">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-md text-body text-fg-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 11: Write the development gallery**

`web/src/app/dev/ui/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiGallery } from "./UiGallery";

export const metadata: Metadata = { title: "UI gallery (development)", robots: { index: false } };

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiGallery />;
}
```

`web/src/app/dev/ui/UiGallery.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyField } from "@/components/ui/CopyField";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { Timetable } from "@/components/ui/Timetable";
import type { DealStatus } from "@/lib/rules";

const ICONS: IconName[] = [
  "lock", "key", "check", "clock", "hourglass", "arrow-right", "external", "return", "copy", "share", "wallet", "menu",
  "close", "phone", "qr", "alert", "info", "chevron-down", "door", "refresh", "spinner", "logout",
];
const PICTOGRAMS: PictogramName[] = [
  "pay-into-lock", "scan-at-door", "keys-change-hands", "back-to-you", "tenant", "landlord", "fake-listing", "deadline",
  "phone-wallet", "laptop-wallet", "share-link",
];
const STATUSES: DealStatus[] = ["open", "funded", "released", "refunded", "cancelled"];
const BANDS: Record<DealStatus, string> = {
  open: "bg-subtle",
  funded: "bg-inverse",
  released: "bg-released",
  refunded: "bg-returned",
  cancelled: "bg-subtle",
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-rule pt-6">
      <h2 className="label text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

export function UiGallery() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [windowChoice, setWindowChoice] = useState<"1d" | "3d" | "7d" | "14d">("3d");

  return (
    <div className="mx-auto max-w-page space-y-10 px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-display text-title font-bold">UI gallery</h1>

      <Block title="Type">
        <p className="font-display text-hero font-bold">
          The deposit moves only when the <span className="marker animate-marker">keys</span> do.
        </p>
        <p className="font-display text-title font-bold">Page title</p>
        <p className="font-display text-section font-bold">Section title</p>
        <p className="font-display text-card font-bold">Card title</p>
        <p className="font-display text-amount font-bold tabular-nums">€600.00</p>
        <p className="text-lead text-fg-muted">Lead paragraph in graphite.</p>
        <p className="text-body">Body text for reading.</p>
        <p className="label text-fg-muted">Small caps label</p>
      </Block>

      <Block title="Logo">
        <div className="flex flex-wrap items-center gap-6">
          <Logo href={null} />
          <span className="rounded-md bg-inverse p-4">
            <Logo inverse href={null} />
          </span>
          <LogoMark size={64} />
          <LogoMark size={24} simplified />
          <LogoMark size={16} simplified />
        </div>
      </Block>

      <Block title="Icons">
        <div className="flex flex-wrap gap-4">
          {ICONS.map((name) => (
            <span key={name} className="flex w-20 flex-col items-center gap-1 text-xs text-fg-muted">
              <Icon name={name} size={24} className="text-fg" />
              {name}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Pictograms">
        <div className="flex flex-wrap gap-4">
          {PICTOGRAMS.map((name) => (
            <span key={name} className="flex w-24 flex-col items-center gap-1 rounded-md bg-subtle p-3 text-center text-xs text-fg-muted">
              <Pictogram name={name} />
              {name}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Cancel this deal</Button>
          <Button variant="quiet">Quiet link</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="lg">Pay €600.00 into the lock</Button>
          <Button loading loadingText="Waiting for your wallet…">
            Loading
          </Button>
          <Button disabled>Disabled</Button>
          <ButtonLink href="https://phantom.com/download" external variant="secondary">
            External link
          </ButtonLink>
        </div>
        <div className="max-w-sm">
          <Button size="lg" fullWidth>
            I have the keys: release the deposit
          </Button>
        </div>
      </Block>

      <Block title="Callouts">
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout tone="info" title="Info">Use the wallet that paid.</Callout>
          <Callout tone="success" title="Success">Done. View the receipt.</Callout>
          <Callout tone="returned" title="Returned">The deposit went back to the tenant.</Callout>
          <Callout tone="danger" title="Error" role="alert">You cancelled the request in your wallet.</Callout>
          <Callout tone="neutral">Neutral note.</Callout>
        </div>
      </Block>

      <Block title="Status chips">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} size="sm" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <span key={status} className={`rounded-md p-3 ${BANDS[status]}`}>
              <StatusChip status={status} tone="onBand" />
            </span>
          ))}
        </div>
      </Block>

      <Block title="Timetable">
        <div className="max-w-xl">
          <Timetable
            title="How your €600.00 moves"
            aside="Room in Vallendar"
            footer="Rules run in a public program on Solana."
            rows={[
              { key: "a", time: "Sun 27 Sep, 10:12", title: "Deal created", state: "done" },
              { key: "b", time: "Wed 30 Sep, 14:00", title: "Key handover", detail: "Until Sun 4 Oct, 14:00.", state: "now" },
              { key: "c", time: "Sun 4 Oct, 14:00", title: "No handover by then?", detail: "€600.00 goes back to the tenant.", state: "later" },
              { key: "d", time: "Thu 1 Oct, 14:07", title: "Released to landlord", state: "done", tone: "released" },
              { key: "e", title: "Next step without a time", state: "next" },
            ]}
          />
        </div>
      </Block>

      <Block title="Form controls">
        <div className="grid max-w-xl gap-5">
          <TextField id="g-title" label="Room" hint="Your tenant sees this." counter="47 left" placeholder="Room in Vallendar" />
          <TextField id="g-amount" label="Deposit (€)" error="Enter the deposit in euros, for example 600 or 600.50." defaultValue="abc" />
          <Segmented
            name="g-window"
            legend="Latest handover"
            value={windowChoice}
            onChange={setWindowChoice}
            options={[
              { value: "1d", label: "1 day" },
              { value: "3d", label: "3 days", hint: "Default" },
              { value: "7d", label: "7 days" },
              { value: "14d", label: "14 days" },
            ]}
          />
          <CopyField label="Deposit link" value="https://keysfirst.vercel.app/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy" />
        </div>
      </Block>

      <Block title="Dialogs">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            Open confirmation
          </Button>
        </div>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Log in with your wallet">
          <p className="text-fg-muted">A wallet is an app like Phantom that holds your money and approves payments.</p>
        </Sheet>
        <ConfirmDialog
          open={confirm}
          title="Release the deposit?"
          body="Only continue if you are holding the keys. €600.00 goes to the landlord immediately and can't be undone."
          confirmLabel="Yes, release it"
          onConfirm={() => setConfirm(false)}
          onCancel={() => setConfirm(false)}
        />
      </Block>

      <Block title="Loading and empty">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <EmptyState pictogram="laptop-wallet" title="No deals yet" action={<Button>Create a deposit link</Button>}>
          Deals you create or pay show up here.
        </EmptyState>
      </Block>
    </div>
  );
}
```

- [ ] **Step 12: Verify in the browser**

Run: `npm run lint` → no errors. `npm test` → PASS. `npm run build` → succeeds (`/dev/ui` builds as a 404 page in production).
Start the dev server and open `http://localhost:3000/dev/ui` at 1280 px and 375 px:
- Every icon and pictogram draws (no empty boxes); the Highlighter under "keys" draws in once.
- Buttons: the long primary label wraps inside the button at 375 px; primary hover shows the yellow bottom bar; Tab shows the white/ink/yellow focus ring on every control, including the segmented options.
- Status chips: sentence-case labels; on coloured bands the white "onBand" chips stay readable.
- Timetable: at 375 px the time sits above the title; at 1280 px it is a column; the "now" row has the yellow edge.
- Sheet: opens as a bottom sheet at 375 px and centred at 1280 px; Esc, the close button and a click on the backdrop close it; focus returns to the button.
- No console errors; `document.documentElement.scrollWidth <= innerWidth` at 375 px.

- [ ] **Step 13: Commit**

```bash
git add web/src/components/ui web/src/app/dev
git commit -m "feat(web): UI primitives (buttons, callouts, status chips, timetable, fields, sheets) and dev gallery" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Route groups, site chrome and one log-in experience

**Files:**
- Move (git mv): `web/src/app/page.tsx` → `web/src/app/(site)/page.tsx`; `web/src/app/new/` → `web/src/app/(app)/new/`; `web/src/app/deal/` → `web/src/app/(app)/deal/`; `web/src/app/dev/` → `web/src/app/(app)/dev/`; `web/src/app/providers.tsx` → `web/src/app/(app)/providers.tsx`
- Create: `web/src/app/(site)/layout.tsx`, `web/src/app/(app)/layout.tsx`
- Modify: `web/src/app/layout.tsx` (root: no wallet code), `web/src/app/(app)/providers.tsx`
- Create: `web/src/components/site/{DevnetRibbon,SiteHeader,SiteFooter,NavLinks,MobileMenu}.tsx`
- Create: `web/src/components/wallet/{ConnectProvider,ConnectSheet,AppHeader,WalletChip,LoginButton,OpenInPhantom,TestFundsButton}.tsx`
- Delete: `web/src/components/{WalletButton,OpenInPhantom,TestFundsButton}.tsx`
- Modify (imports only): `web/src/app/(app)/new/page.tsx`, `web/src/components/DealActions.tsx`, `web/src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: Tasks 1–3; `phantomBrowseUrl`, `shortAddress`, `explorerAddress` from `@/lib/format`; `useMounted` from `@/lib/hooks`; `RPC_URL` from `@/lib/config`; `idl.address` from `@/idl/keysfirst.json`.
- Produces:
  - `useConnect(): { openConnect: () => void }` from `@/components/wallet/ConnectProvider` (only inside the `(app)` group); `?login=1` on any app URL opens the connect sheet once.
  - `LoginButton({ label?: string; variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean })`, `WalletChip()`, `OpenInPhantom()`, `TestFundsButton({ variant?: ButtonVariant })`, `AppHeader()`.
  - `SiteHeader()` (static), `SiteFooter()`, `DevnetRibbon()`, `NavLinks({ items: NavItem[]; orientation?: "row" | "column"; onNavigate? })`, `MobileMenu({ items: NavItem[]; footer?: ReactNode })`, `type NavItem = { href: string; label: string }`, `SITE_NAV: NavItem[]`.
  - Every page in `(site)` and `(app)` renders inside `<main id="main">` (skip-link target).

- [ ] **Step 1: Move the routes into the two groups**

Run (repo root, PowerShell or Bash):

```bash
git mv web/src/app/page.tsx "web/src/app/(site)/page.tsx"
git mv web/src/app/new "web/src/app/(app)/new"
git mv web/src/app/deal "web/src/app/(app)/deal"
git mv web/src/app/dev "web/src/app/(app)/dev"
git mv web/src/app/providers.tsx "web/src/app/(app)/providers.tsx"
```

Expected: `git status` shows five renames. (`git mv` creates the `(site)` and `(app)` folders; in PowerShell keep the quotes because of the parentheses.)

- [ ] **Step 2: Rewrite `web/src/app/(app)/providers.tsx`** (the wallet library's modal and its stylesheet are no longer used)

```tsx
"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import type { ReactNode } from "react";
import { ConnectProvider } from "@/components/wallet/ConnectProvider";
import { RPC_URL } from "@/lib/config";

// No automatic retries on "429 Too Many Requests": each refusal was retried up to 5 times, which kept
// the whole Wi-Fi network over devnet's rate limit. The deal page's 2-second poll is the retry.
const CONNECTION_CONFIG = { commitment: "confirmed" as const, disableRetryOnRateLimit: true };

/**
 * Phantom (and other Wallet Standard wallets) are detected automatically, so `wallets` stays empty.
 * autoConnect: choosing a wallet in the connect sheet connects it, and a returning visitor is reconnected.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={RPC_URL} config={CONNECTION_CONFIG}>
      <WalletProvider wallets={[]} autoConnect>
        <ConnectProvider>{children}</ConnectProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

- [ ] **Step 3: Write `web/src/components/wallet/ConnectProvider.tsx`**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConnectSheet } from "./ConnectSheet";

const ConnectContext = createContext<{ openConnect: () => void } | null>(null);

/** One connect sheet for the whole app. Any "Log in" button opens it; so does ?login=1 (the marketing pages' Log in link). */
export function ConnectProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("login")) return;
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState(window.history.state, "", url);
      setOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openConnect = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openConnect }), [openConnect]);

  return (
    <ConnectContext.Provider value={value}>
      {children}
      <ConnectSheet open={open} onClose={close} />
    </ConnectContext.Provider>
  );
}

export function useConnect() {
  const context = useContext(ConnectContext);
  if (!context) throw new Error("useConnect must be used inside ConnectProvider (the (app) route group).");
  return context;
}
```

- [ ] **Step 4: Write `web/src/components/wallet/ConnectSheet.tsx`**

```tsx
"use client";

import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Sheet } from "@/components/ui/Sheet";
import { phantomBrowseUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

const PHANTOM_DOWNLOAD = "https://phantom.com/download";

export function ConnectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, wallet, select, connect, connecting, connected } = useWallet();
  const mounted = useMounted();

  // Close as soon as the wallet is connected.
  useEffect(() => {
    if (open && connected) onClose();
  }, [open, connected, onClose]);

  const detected = wallets
    .filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable)
    .sort((a, b) => Number(b.adapter.name === "Phantom") - Number(a.adapter.name === "Phantom"));
  const isPhone = mounted && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  async function choose(name: WalletName) {
    if (wallet?.adapter.name === name) {
      // Already selected (e.g. after a cancelled attempt): connect directly.
      await connect().catch(() => undefined);
    } else {
      // With autoConnect on, the provider connects right after the selection.
      select(name);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log in with your wallet">
      <p className="text-fg-muted">
        A wallet is an app like Phantom that holds your money and approves payments. Keysfirst never sees your keys.
      </p>

      {detected.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {detected.map((w) => (
            <li key={w.adapter.name}>
              <button
                type="button"
                onClick={() => void choose(w.adapter.name)}
                disabled={connecting}
                className="flex min-h-14 w-full items-center gap-3 rounded-md border-2 border-fg bg-canvas px-4 text-left font-semibold hover:bg-subtle disabled:cursor-wait disabled:opacity-70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the wallet's own data-URI icon */}
                <img src={w.adapter.icon} alt="" width={28} height={28} className="size-7 rounded-sm" />
                <span className="flex-1">{w.adapter.name}</span>
                <span className="text-sm font-normal text-fg-muted">
                  {connecting && wallet?.adapter.name === w.adapter.name ? "Opening…" : "Detected"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : isPhone ? (
        <div className="mt-5 space-y-3">
          <Callout tone="info" title="Open Keysfirst inside Phantom">
            Phone browsers can&apos;t reach your wallet. Phantom opens this page in its own browser, where logging in works.
          </Callout>
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              window.location.href = phantomBrowseUrl(window.location.href);
            }}
          >
            Open in Phantom
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <Callout tone="info" title="No wallet in this browser">
            Install the Phantom browser extension, then reload this page.
          </Callout>
          <ButtonLink href={PHANTOM_DOWNLOAD} external size="lg" fullWidth>
            Install Phantom
          </ButtonLink>
        </div>
      )}

      <p className="mt-5 text-sm text-fg-muted">
        Phantom must be set to Solana Devnet.{" "}
        <Link href="/start#devnet" onClick={onClose} className={buttonClass({ variant: "quiet" })}>
          How?
        </Link>
      </p>
    </Sheet>
  );
}
```

- [ ] **Step 5: Write `web/src/components/wallet/LoginButton.tsx`**

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { useConnect } from "./ConnectProvider";

export function LoginButton({
  label = "Log in",
  variant = "secondary",
  size,
  fullWidth,
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  const { openConnect } = useConnect();
  const { connecting } = useWallet();
  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} loading={connecting} loadingText="Logging in…" onClick={openConnect}>
      {label}
    </Button>
  );
}
```

- [ ] **Step 6: Write `web/src/components/wallet/OpenInPhantom.tsx`** (same rule as before: shown only when no wallet is installed)

```tsx
"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { phantomBrowseUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Phone browsers can't reach Phantom; this reopens the page inside Phantom's own browser. */
export function OpenInPhantom() {
  const mounted = useMounted();
  const { wallets } = useWallet();
  const hasWallet = wallets.some((w) => w.readyState === WalletReadyState.Installed);
  if (!mounted || hasWallet) return null;
  return (
    <Callout tone="info" title="On your phone?">
      <p>Open this page inside the Phantom app to log in and approve payments.</p>
      <Button
        className="mt-3"
        onClick={() => {
          window.location.href = phantomBrowseUrl(window.location.href);
        }}
      >
        Open in Phantom
      </Button>
    </Callout>
  );
}
```

- [ ] **Step 7: Write `web/src/components/wallet/TestFundsButton.tsx`** (same endpoint and messages; the faucet itself is unchanged)

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export function TestFundsButton({ variant = "secondary" }: { variant?: ButtonVariant }) {
  const { publicKey } = useWallet();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  if (!publicKey) return null;

  async function request() {
    if (!publicKey) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: publicKey.toBase58() }),
      });
      const body = await res.json();
      setResult(res.ok ? { ok: true, text: "Sent 1,000 Test EUR (and devnet SOL for fees if you had none)." } : { ok: false, text: body.error });
    } catch {
      setResult({ ok: false, text: "Could not reach the faucet. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant={variant} fullWidth loading={busy} loadingText="Sending test money…" onClick={request}>
        Get test funds
      </Button>
      {result && (
        <Callout tone={result.ok ? "success" : "danger"} role="status">
          {result.text}
        </Callout>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Write `web/src/components/wallet/WalletChip.tsx`**

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { shortAddress } from "@/lib/format";
import { TestFundsButton } from "./TestFundsButton";

/** The logged-in state: short address + a menu (My deals, Get test funds, Copy address, Log out). */
export function WalletChip() {
  const { publicKey, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!publicKey) return null;
  const address = publicKey.toBase58();

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-field px-3.5 text-sm font-semibold tabular-nums hover:bg-subtle"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-released" />
        <span className="sr-only">Your wallet: </span>
        {shortAddress(address)}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your wallet">
        <p className="break-all rounded-md bg-subtle p-3 font-mono text-sm text-fg-muted">{address}</p>
        <div className="mt-4 grid gap-2">
          <ButtonLink href="/deals" variant="secondary" fullWidth onClick={() => setOpen(false)}>
            My deals
          </ButtonLink>
          <Button variant="secondary" fullWidth onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied" : "Copy address"}
          </Button>
          <TestFundsButton />
          <Button
            variant="quiet"
            className="mt-2 justify-center"
            onClick={() => {
              void disconnect();
              setOpen(false);
            }}
          >
            <Icon name="logout" size={18} />
            Log out
          </Button>
        </div>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 9: Write the navigation pieces**

`web/src/components/site/NavLinks.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

export interface NavItem {
  href: string;
  label: string;
}

export function NavLinks({
  items,
  orientation = "row",
  onNavigate,
}: {
  items: NavItem[];
  orientation?: "row" | "column";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className={orientation === "row" ? "flex items-center gap-7" : "flex flex-col gap-1"}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cx(
                "font-semibold decoration-accent decoration-[3px] underline-offset-[6px] hover:underline",
                orientation === "column" && "flex min-h-11 items-center rounded-md px-2 text-lg hover:bg-subtle",
                current && "underline",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

`web/src/components/site/MobileMenu.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { NavLinks, type NavItem } from "./NavLinks";

export function MobileMenu({ items, footer }: { items: NavItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-md border-[1.5px] border-rule hover:bg-subtle lg:hidden"
      >
        <Icon name="menu" label="Menu" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Main">
          <NavLinks items={items} orientation="column" onNavigate={() => setOpen(false)} />
        </nav>
        {footer && <div className="mt-4 border-t border-rule pt-4">{footer}</div>}
      </Sheet>
    </>
  );
}
```

- [ ] **Step 10: Write the site chrome**

`web/src/components/site/DevnetRibbon.tsx`:

```tsx
import Link from "next/link";

export function DevnetRibbon() {
  return (
    <p className="bg-subtle px-4 py-2 text-center text-[0.8125rem] leading-snug text-fg-muted">
      Prototype on Solana devnet · <strong className="font-semibold text-fg">test money only</strong>, nothing here has real value ·{" "}
      <Link href="/faq#devnet" className="underline decoration-field underline-offset-2 hover:decoration-fg">
        What&apos;s devnet?
      </Link>
    </p>
  );
}
```

`web/src/components/site/SiteHeader.tsx` (static: marketing pages ship no wallet code):

```tsx
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import { MobileMenu } from "./MobileMenu";
import { NavLinks, type NavItem } from "./NavLinks";

// Cut rule: if the For tenants / For landlords pages are cut, remove them here.
export const SITE_NAV: NavItem[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/tenants", label: "For tenants" },
  { href: "/landlords", label: "For landlords" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-(--header-h) max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={SITE_NAV} />
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/start" className={cx(buttonClass({ variant: "quiet" }), "hidden sm:inline-flex")}>
            Get started
          </Link>
          <ButtonLink href="/deals?login=1" variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <MobileMenu items={[...SITE_NAV, { href: "/start", label: "Get started" }]} />
        </div>
      </div>
    </header>
  );
}
```

`web/src/components/site/SiteFooter.tsx`:

```tsx
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import idl from "@/idl/keysfirst.json";
import { explorerAddress } from "@/lib/format";

// Cut rule: remove links to pages that were cut (About, For tenants, For landlords).
const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/start", label: "Get started" },
      { href: "/new", label: "Create a deposit link" },
      { href: "/deals", label: "My deals" },
    ],
  },
  {
    title: "Keysfirst",
    links: [
      { href: "/tenants", label: "For tenants" },
      { href: "/landlords", label: "For landlords" },
      { href: "/faq", label: "FAQ" },
      { href: "/about", label: "About" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-inverse text-fg-inverse">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div className="space-y-3">
          <Logo inverse />
          <p className="max-w-xs text-fg-inverse-muted">The deposit moves only when the keys do.</p>
          <a
            href={explorerAddress(idl.address)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2"
          >
            The Keysfirst program on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="label text-fg-inverse-muted">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-white/15 px-4 py-5 text-center text-sm text-fg-inverse-muted">
        Keysfirst is a prototype on Solana devnet. Test money only; nothing here has real value. Not legal advice.
      </p>
    </footer>
  );
}
```

- [ ] **Step 11: Write `web/src/components/wallet/AppHeader.tsx`**

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/site/MobileMenu";
import { NavLinks, type NavItem } from "@/components/site/NavLinks";
import { useMounted } from "@/lib/hooks";
import { LoginButton } from "./LoginButton";
import { WalletChip } from "./WalletChip";

const LOGGED_OUT: NavItem[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/start", label: "Get started" },
];
const LOGGED_IN: NavItem[] = [
  { href: "/deals", label: "My deals" },
  { href: "/new", label: "Create a deal" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

/** App header: role-aware navigation once a wallet is connected. */
export function AppHeader() {
  const { publicKey } = useWallet();
  const mounted = useMounted();
  const loggedIn = mounted && publicKey !== null;
  const items = loggedIn ? LOGGED_IN : LOGGED_OUT;
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-(--header-h) max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={items} />
        </nav>
        <div className="flex items-center gap-3">
          {loggedIn ? <WalletChip /> : <LoginButton size="sm" />}
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 12: Write the layouts**

`web/src/app/layout.tsx` (root; no request data, no wallet code):

```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DevnetRibbon } from "@/components/site/DevnetRibbon";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteUrl } from "@/lib/site";
import { barlow, barlowCondensed } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Keysfirst · The deposit moves only when the keys do", template: "%s · Keysfirst" },
  description:
    "A deposit link for renting a room in Germany from abroad. The landlord is paid only when the tenant scans their code at the key handover; otherwise the deposit goes back. Solana devnet prototype with test money.",
  openGraph: { siteName: "Keysfirst", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#16181D" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-inverse focus:px-4 focus:py-3 focus:text-fg-inverse"
        >
          Skip to content
        </a>
        <DevnetRibbon />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
```

`web/src/app/(site)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Marketing pages: static, no wallet code (spec §4, route groups). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
```

`web/src/app/(app)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { AppHeader } from "@/components/wallet/AppHeader";
import { Providers } from "./providers";

/** Wallet pages: one provider tree and one connect sheet. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AppHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
    </Providers>
  );
}
```

- [ ] **Step 13: Point the old pages at the new wallet components** (they are replaced in Tasks 6, 9 and 11)

1. Delete the old components: `git rm web/src/components/WalletButton.tsx web/src/components/OpenInPhantom.tsx web/src/components/TestFundsButton.tsx`
2. In `web/src/app/(app)/new/page.tsx`: replace `import { OpenInPhantom } from "@/components/OpenInPhantom";` with `import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";`, replace `import { WalletButton } from "@/components/WalletButton";` with `import { LoginButton } from "@/components/wallet/LoginButton";`, and replace `<div className="flex justify-center"><WalletButton /></div>` with `<div className="flex justify-center"><LoginButton /></div>`.
3. In `web/src/components/DealActions.tsx`: replace the three lines `import { OpenInPhantom } from "./OpenInPhantom";`, `import { TestFundsButton } from "./TestFundsButton";`, `import { WalletButton } from "./WalletButton";` with `import { LoginButton } from "./wallet/LoginButton";`, `import { OpenInPhantom } from "./wallet/OpenInPhantom";`, `import { TestFundsButton } from "./wallet/TestFundsButton";`, and replace `<div className="flex justify-center"><WalletButton /></div>` with `<div className="flex justify-center"><LoginButton /></div>`.
4. In `web/src/app/(site)/page.tsx` (old landing, no wallet code allowed in this group): delete the two lines `import { OpenInPhantom } from "@/components/OpenInPhantom";` and `import { TestFundsButton } from "@/components/TestFundsButton";`, and replace the whole last `<section …>` ("Try it (test money only)") with:

```tsx
      <section className="space-y-3 rounded-lg bg-subtle p-5 text-sm">
        <h2 className="text-lg font-semibold">Try it (test money only)</h2>
        <p>
          <Link href="/deals?login=1" className="underline">Log in</Link> with Phantom set to Solana Devnet, then use Get test funds in the wallet menu.
        </p>
      </section>
```

- [ ] **Step 14: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → succeeds; `/` is still `○ (Static)` (no wallet code reaches the site group).
In the browser (dev server) at 375 and 1280 px:
- `/`: devnet ribbon, sticky site header (desktop links; menu sheet on phones with all links), ink footer. "Log in" goes to `/deals?login=1`, which opens the connect sheet (the URL loses `?login=1`); `/deals` itself is the Next 404 page until Task 10, and that is expected here.
- `/new`: app header with "Log in"; the sheet shows "No wallet in this browser" + "Install Phantom" in the in-app browser (no extension); the old form still works as before.
- `/dev/ui`: renders inside the app header and footer.
- Skip link: press Tab on any page: "Skip to content" appears and jumps to the main content.
- No console errors, no horizontal scroll at 375 px.
- Network: on `/`, no request for chunks containing `@solana` (Dev tools → Network, filter "solana"); check the production build too with `npm run build && npx next start` if in doubt.

- [ ] **Step 15: Commit**

```bash
git add -A web/src
git commit -m "feat(web): route groups, devnet ribbon, headers, footer and one connect sheet for log-in" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 16: Milestone M1: push and check the Vercel Preview**

1. `git push -u origin redesign`
2. Find the Preview URL. With the GitHub CLI: `gh api "repos/Guidoandre/keysfirst/deployments?ref=redesign&per_page=1" --jq ".[0].id"`, then `gh api repos/Guidoandre/keysfirst/deployments/<id>/statuses --jq ".[0].environment_url"`. Without it, ask the user to copy the Preview link from the Vercel dashboard or the commit's check on GitHub.
3. Check it (replace `<preview>`):
   - `curl -s -o /dev/null -w "%{http_code}\n" <preview>/` → `200`. A `401` means Vercel Authentication protects Previews: ask the user to turn it off for this project (Vercel → Settings → Deployment Protection → Vercel Authentication), because Phantom on a phone cannot log in to Vercel to reach `/api/handover`.
   - `curl -s <preview>/api/handover/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy` → JSON with `"label":"Keysfirst key handover"`.
   - If the Preview build failed with `NEXT_PUBLIC_MINT is not set`, ask the user to add `NEXT_PUBLIC_MINT`, `NEXT_PUBLIC_RPC_URL` and `FAUCET_SECRET_KEY` to the Preview environment in Vercel (same values as Production) and redeploy.
4. Report M1 to the user: works / doesn't / next, with the Preview link.

---

### Task 5: Deal logic: phases, next steps, timetable rows and the `useDeal` hook

**Files:**
- Create: `web/src/lib/deal-view.ts`, `web/src/lib/deal-view.test.ts`
- Create: `web/src/lib/deal-data.ts`, `web/src/lib/deal-data.test.ts`
- Create: `web/src/lib/use-deal.ts` (today's polling logic moved out of `DealClient`, unchanged, plus two flags)

**Interfaces:**
- Consumes: `availableActions`, `canFund`, `handoverOpensAt`, `isExpired`, `MAX_LOCK_DURATION`, `STATUS_LABEL`, `statusOf`, `timelineSteps`, `timelineTransactionCount`, types `Action`, `DealStatus`, `DealTimes`, `Role` from `@/lib/rules`; `formatShortDateTime` (Task 2); `getProgram`, `dealSignatures`, `type DealAccount` from `@/lib/program`.
- Produces (from `@/lib/deal-view`):
  - `interface DealData { landlord: string; tenant: string; title: string; amount: string; status: DealStatus; moveIn: number; deadline: number; createdAt: number; fundedAt: number; settledAt: number }`
  - `type Phase = "open" | "open-too-early" | "open-expired" | "funded-before" | "funded-window" | "funded-expired" | "released" | "refunded" | "cancelled"`
  - `dealPhase(status, times: DealTimes, now): Phase`
  - `interface CountdownInfo { label: string; at: number }`, `countdownFor(phase, times): CountdownInfo | null`
  - `ROLE_LINE: Record<Role, string>`, `statusLine(status, role): string`
  - `interface NextStepView { message: string; primary?: Action; secondary: Action[] }`, `nextStep({ status, role, times, now, amount, settledAt? }): NextStepView`
  - `actionLabel(action, role, amount): string`, `loginLabel(action): string`
  - `interface ConfirmCopy { title: string; body: string; confirm: string; danger: boolean }`, `confirmCopy(action, role, amount): ConfirmCopy | null`
  - `interface DealRow { key: string; time: string; title: string; detail?: string; state: "done" | "now" | "next" | "later"; tone?: "released" | "returned"; signature?: string }`, `dealRows({ status, times: DealTimes & { createdAt; fundedAt; settledAt }, signatures, now, amount }): DealRow[]`
- Produces: `toDealData(account: DealAccount): DealData` from `@/lib/deal-data`; `useDeal(id: string): { address: PublicKey | null; deal: DealAccount | null | undefined; signatures: string[]; loadError: string | null; statusChanged: boolean; justReleased: boolean; refresh: () => Promise<void> }` from `@/lib/use-deal`.

- [ ] **Step 1: Write the failing tests `web/src/lib/deal-view.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { actionLabel, confirmCopy, countdownFor, dealPhase, dealRows, loginLabel, nextStep, statusLine } from "./deal-view";
import { availableActions, type Action, type DealStatus, type DealTimes, type Role } from "./rules";

const DAY = 86_400;
const moveIn = Date.UTC(2026, 9, 1, 14, 0) / 1000; // Thu 1 Oct 2026, 14:00 (tests run in UTC)
const t: DealTimes = { moveIn, deadline: moveIn + 3 * DAY }; // deadline Sun 4 Oct, 14:00
const tooEarly = t.deadline - 181 * DAY;
const before = moveIn - 2 * DAY; // the handover window opens Wed 30 Sep, 14:00
const inWindow = moveIn;
const expired = t.deadline + 60;
const amount = "€600.00";

describe("dealPhase", () => {
  it("splits open and locked deals by the clock", () => {
    expect(dealPhase("open", t, before)).toBe("open");
    expect(dealPhase("open", t, tooEarly)).toBe("open-too-early");
    expect(dealPhase("open", t, expired)).toBe("open-expired");
    expect(dealPhase("funded", t, before)).toBe("funded-before");
    expect(dealPhase("funded", t, inWindow)).toBe("funded-window");
    expect(dealPhase("funded", t, t.deadline)).toBe("funded-window");
    expect(dealPhase("funded", t, expired)).toBe("funded-expired");
    expect(dealPhase("released", t, before)).toBe("released");
    expect(dealPhase("refunded", t, expired)).toBe("refunded");
    expect(dealPhase("cancelled", t, before)).toBe("cancelled");
  });
});

describe("nextStep", () => {
  const statuses: DealStatus[] = ["open", "funded", "released", "refunded", "cancelled"];
  const roles: Role[] = ["landlord", "tenant", "visitor"];
  const moments = [tooEarly, before, inWindow, t.deadline, expired];

  it("never offers an action the program would reject", () => {
    for (const status of statuses) {
      for (const role of roles) {
        for (const now of moments) {
          const view = nextStep({ status, role, times: t, now, amount, settledAt: moveIn });
          const allowed = availableActions(status, role, t, now);
          const offered = [view.primary, ...view.secondary].filter((a): a is Action => a !== undefined);
          for (const action of offered) expect(allowed).toContain(action);
        }
      }
    }
  });

  it("gives each role one clear next step", () => {
    expect(nextStep({ status: "open", role: "visitor", times: t, now: before, amount }).primary).toBe("fund");
    expect(nextStep({ status: "open", role: "landlord", times: t, now: before, amount })).toMatchObject({ primary: undefined, secondary: ["cancel"] });
    expect(nextStep({ status: "open", role: "landlord", times: t, now: expired, amount }).primary).toBe("cancel");
    expect(nextStep({ status: "funded", role: "landlord", times: t, now: before, amount })).toMatchObject({ primary: undefined, secondary: ["refund"] });
    expect(nextStep({ status: "funded", role: "landlord", times: t, now: inWindow, amount })).toMatchObject({ primary: "showQr", secondary: ["refund"] });
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: inWindow, amount })).toMatchObject({ primary: undefined, secondary: ["confirmInApp"] });
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: expired, amount }).primary).toBe("refund");
    expect(nextStep({ status: "funded", role: "visitor", times: t, now: expired, amount }).primary).toBe("refund");
    expect(nextStep({ status: "funded", role: "visitor", times: t, now: inWindow, amount })).toMatchObject({ primary: undefined, secondary: [] });
  });

  it("explains the state in plain words", () => {
    expect(nextStep({ status: "funded", role: "tenant", times: t, now: before, amount }).message).toBe(
      "Your deposit is locked. The handover opens Wed 30 Sep, 14:00. At the door, check the room, then scan the landlord's code.",
    );
    expect(nextStep({ status: "open", role: "visitor", times: t, now: before, amount }).message).toContain("Sun 4 Oct, 14:00");
    expect(nextStep({ status: "released", role: "landlord", times: t, now: expired, amount, settledAt: moveIn + 420 }).message).toBe(
      "The tenant confirmed the handover on Thu 1 Oct, 14:07. The deposit is in your wallet.",
    );
    expect(nextStep({ status: "cancelled", role: "visitor", times: t, now: before, amount }).message).toBe(
      "The landlord cancelled this deal before anyone paid.",
    );
  });
});

describe("countdownFor", () => {
  it("counts towards the next moment that matters", () => {
    expect(countdownFor("open", t)).toEqual({ label: "Payment closes in", at: t.deadline });
    expect(countdownFor("funded-before", t)).toEqual({ label: "Handover opens in", at: moveIn - DAY });
    expect(countdownFor("funded-window", t)).toEqual({ label: "Handover deadline in", at: t.deadline });
    expect(countdownFor("funded-expired", t)).toEqual({ label: "Deadline passed", at: t.deadline });
    expect(countdownFor("released", t)).toBeNull();
  });
});

describe("labels", () => {
  it("names each action for the viewer", () => {
    expect(actionLabel("fund", "visitor", amount)).toBe("Pay €600.00 into the lock");
    expect(actionLabel("showQr", "landlord", amount)).toBe("Start the handover");
    expect(actionLabel("confirmInApp", "tenant", amount)).toBe("I have the keys: release the deposit");
    expect(actionLabel("refund", "landlord", amount)).toBe("Give the deposit back to the tenant");
    expect(actionLabel("refund", "tenant", amount)).toBe("Take the deposit back");
    expect(actionLabel("refund", "visitor", amount)).toBe("Return the deposit to the tenant");
    expect(actionLabel("cancel", "landlord", amount)).toBe("Cancel this deal");
    expect(loginLabel("fund")).toBe("Log in to pay");
    expect(loginLabel("refund")).toBe("Log in to return it");
  });

  it("asks for confirmation only before irreversible steps", () => {
    expect(confirmCopy("confirmInApp", "tenant", amount)?.body).toContain("€600.00 goes to the landlord immediately");
    expect(confirmCopy("cancel", "landlord", amount)?.danger).toBe(true);
    expect(confirmCopy("refund", "landlord", amount)?.title).toBe("Give the deposit back?");
    expect(confirmCopy("refund", "tenant", amount)).toBeNull();
    expect(confirmCopy("fund", "visitor", amount)).toBeNull();
  });

  it("describes the status in one line", () => {
    expect(statusLine("open", "landlord")).toBe("Waiting for your tenant to pay.");
    expect(statusLine("funded", "tenant")).toBe("The money is in the lock.");
  });
});

describe("dealRows", () => {
  const times = { ...t, createdAt: moveIn - 4 * DAY, fundedAt: moveIn - 4 * DAY + 480, settledAt: 0 };

  it("shows the handover as the current row inside the window", () => {
    const rows = dealRows({ status: "funded", times, signatures: ["s1", "s2"], now: inWindow, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "done"],
      ["handover", "now"],
      ["fallback", "later"],
    ]);
    expect(rows[1].signature).toBe("s2");
  });

  it("marks the fallback row once the deadline passed", () => {
    const rows = dealRows({ status: "funded", times, signatures: [], now: expired, amount });
    expect(rows.find((r) => r.key === "fallback")?.state).toBe("now");
  });

  it("waits for the payment while open", () => {
    const rows = dealRows({ status: "open", times: { ...times, fundedAt: 0 }, signatures: ["s1"], now: before, amount });
    expect(rows.map((r) => [r.key, r.state])).toEqual([
      ["created", "done"],
      ["locked", "now"],
      ["handover", "later"],
      ["fallback", "later"],
    ]);
  });

  it("ends with the settlement row", () => {
    const released = dealRows({ status: "released", times: { ...times, settledAt: moveIn + 420 }, signatures: ["a", "b", "c"], now: expired, amount });
    expect(released.at(-1)).toMatchObject({ key: "settled", title: "Released to landlord", tone: "released", signature: "c", time: "Thu 1 Oct, 14:07" });
    const cancelled = dealRows({ status: "cancelled", times: { ...times, fundedAt: 0, settledAt: moveIn - DAY }, signatures: ["a", "b"], now: before, amount });
    expect(cancelled.map((r) => r.key)).toEqual(["created", "cancelled"]);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL with `Failed to resolve import "./deal-view"`.

- [ ] **Step 3: Write `web/src/lib/deal-view.ts`**

```ts
import { formatShortDateTime } from "./format";
import {
  availableActions,
  canFund,
  handoverOpensAt,
  isExpired,
  MAX_LOCK_DURATION,
  STATUS_LABEL,
  timelineSteps,
  type Action,
  type DealStatus,
  type DealTimes,
  type Role,
} from "./rules";

/** A deal as plain data (converted from the Anchor account by toDealData). */
export interface DealData {
  landlord: string;
  tenant: string;
  title: string;
  /** Base units (6 decimals) as a string. */
  amount: string;
  status: DealStatus;
  moveIn: number;
  deadline: number;
  createdAt: number;
  fundedAt: number;
  settledAt: number;
}

export type Phase =
  | "open"
  | "open-too-early"
  | "open-expired"
  | "funded-before"
  | "funded-window"
  | "funded-expired"
  | "released"
  | "refunded"
  | "cancelled";

/** Where a deal stands right now; the clock rules mirror rules.ts (and the program). */
export function dealPhase(status: DealStatus, t: DealTimes, now: number): Phase {
  switch (status) {
    case "open":
      if (isExpired(t, now)) return "open-expired";
      return canFund(t, now) ? "open" : "open-too-early";
    case "funded":
      if (isExpired(t, now)) return "funded-expired";
      return now >= handoverOpensAt(t) ? "funded-window" : "funded-before";
    default:
      return status;
  }
}

export interface CountdownInfo {
  label: string;
  at: number;
}

export function countdownFor(phase: Phase, t: DealTimes): CountdownInfo | null {
  switch (phase) {
    case "open":
      return { label: "Payment closes in", at: t.deadline };
    case "open-too-early":
      return { label: "Payment opens in", at: t.deadline - MAX_LOCK_DURATION };
    case "open-expired":
      return { label: "Payment closed", at: t.deadline };
    case "funded-before":
      return { label: "Handover opens in", at: handoverOpensAt(t) };
    case "funded-window":
      return { label: "Handover deadline in", at: t.deadline };
    case "funded-expired":
      return { label: "Deadline passed", at: t.deadline };
    default:
      return null;
  }
}

export const ROLE_LINE: Record<Role, string> = {
  landlord: "You're the landlord",
  tenant: "You're the tenant",
  visitor: "Deposit link",
};

export function statusLine(status: DealStatus, role: Role): string {
  switch (status) {
    case "open":
      return role === "landlord" ? "Waiting for your tenant to pay." : "Waiting for the deposit.";
    case "funded":
      return "The money is in the lock.";
    case "released":
      return "Paid to the landlord at the handover.";
    case "refunded":
      return "Back with the tenant.";
    case "cancelled":
      return "Closed before anyone paid.";
  }
}

export interface NextStepView {
  /** One sentence above the buttons. */
  message: string;
  /** The single primary action for this viewer right now, if any. */
  primary?: Action;
  /** Secondary actions (quiet buttons). */
  secondary: Action[];
}

/** The deal page's next-step matrix (spec §6.4). Only ever offers actions from availableActions(). */
export function nextStep(o: { status: DealStatus; role: Role; times: DealTimes; now: number; amount: string; settledAt?: number }): NextStepView {
  const { status, role, times: t, now, amount } = o;
  const allowed = availableActions(status, role, t, now);
  const pick = (primary: Action | undefined, secondary: Action[]) => ({
    primary: primary && allowed.includes(primary) ? primary : undefined,
    secondary: secondary.filter((a) => allowed.includes(a)),
  });
  const opens = formatShortDateTime(handoverOpensAt(t));
  const deadline = formatShortDateTime(t.deadline);
  const payFrom = formatShortDateTime(t.deadline - MAX_LOCK_DURATION);
  const settled = o.settledAt ? formatShortDateTime(o.settledAt) : "";

  switch (dealPhase(status, t, now)) {
    case "open":
      return role === "landlord"
        ? { message: "Send the link to your tenant. Once they pay, the deposit stays locked until the key handover.", ...pick(undefined, ["cancel"]) }
        : {
            message: `Pay ${amount} into the lock. The landlord gets it only when you scan their code at the door. If that doesn't happen by ${deadline}, it comes back to you.`,
            ...pick("fund", []),
          };
    case "open-too-early":
      return role === "landlord"
        ? { message: `Your tenant can pay from ${payFrom}, so the money is never locked for more than 180 days.`, ...pick(undefined, ["cancel"]) }
        : { message: `You can pay from ${payFrom}, so the money is never locked for more than 180 days.`, ...pick(undefined, []) };
    case "open-expired":
      return role === "landlord"
        ? { message: "Nobody paid before the deadline. Cancel the deal to close it.", ...pick("cancel", []) }
        : { message: "This link expired before anyone paid. Ask the landlord for a new one.", ...pick(undefined, []) };
    case "funded-before":
      if (role === "landlord") return { message: `The deposit is locked. Your handover opens ${opens}.`, ...pick(undefined, ["refund"]) };
      if (role === "tenant") {
        return {
          message: `Your deposit is locked. The handover opens ${opens}. At the door, check the room, then scan the landlord's code.`,
          ...pick(undefined, []),
        };
      }
      return { message: `The deposit is locked until the key handover or ${deadline}.`, ...pick(undefined, []) };
    case "funded-window":
      if (role === "landlord") {
        return {
          message: "When you meet, start the handover and show your code. Hand over the keys when your screen turns green.",
          ...pick("showQr", ["refund"]),
        };
      }
      if (role === "tenant") {
        return { message: "At the door, check the room first. Then scan the landlord's code with your phone camera.", ...pick(undefined, ["confirmInApp"]) };
      }
      return { message: `The deposit is locked until the key handover or ${deadline}.`, ...pick(undefined, []) };
    case "funded-expired":
      if (role === "landlord") return { message: "The deadline passed without a handover. The deposit can go back to the tenant now.", ...pick("refund", []) };
      if (role === "tenant") return { message: "The deadline passed without a handover. You can take your deposit back now.", ...pick("refund", []) };
      return { message: "The deadline passed without a handover. Anyone can now return the deposit to the tenant.", ...pick("refund", []) };
    case "released":
      if (role === "landlord") return { message: `The tenant confirmed the handover on ${settled}. The deposit is in your wallet.`, secondary: [] };
      if (role === "tenant") return { message: `You confirmed the handover on ${settled}. The deposit went to the landlord.`, secondary: [] };
      return { message: `The tenant confirmed the handover on ${settled}. The deposit went to the landlord.`, secondary: [] };
    case "refunded":
      return {
        message: role === "tenant" ? `Your deposit came back to you on ${settled}.` : `The deposit went back to the tenant on ${settled}.`,
        secondary: [],
      };
    case "cancelled":
      return {
        message: role === "landlord" ? "You cancelled this deal before anyone paid." : "The landlord cancelled this deal before anyone paid.",
        secondary: [],
      };
  }
}

export function actionLabel(action: Action, role: Role, amount: string): string {
  switch (action) {
    case "fund":
      return `Pay ${amount} into the lock`;
    case "showQr":
      return "Start the handover";
    case "confirmInApp":
      return "I have the keys: release the deposit";
    case "refund":
      if (role === "landlord") return "Give the deposit back to the tenant";
      return role === "tenant" ? "Take the deposit back" : "Return the deposit to the tenant";
    case "cancel":
      return "Cancel this deal";
  }
}

export function loginLabel(action: Action): string {
  if (action === "fund") return "Log in to pay";
  if (action === "refund") return "Log in to return it";
  return "Log in";
}

export interface ConfirmCopy {
  title: string;
  body: string;
  confirm: string;
  danger: boolean;
}

/** In-page confirmation before irreversible steps; null means "just ask the wallet". */
export function confirmCopy(action: Action, role: Role, amount: string): ConfirmCopy | null {
  if (action === "confirmInApp") {
    return {
      title: "Release the deposit?",
      body: `Only continue if you are holding the keys. ${amount} goes to the landlord immediately and can't be undone.`,
      confirm: "Yes, release it",
      danger: false,
    };
  }
  if (action === "cancel") {
    return { title: "Cancel this deal?", body: "The link stops working. Nobody has paid, so no money moves.", confirm: "Cancel the deal", danger: true };
  }
  if (action === "refund" && role === "landlord") {
    return { title: "Give the deposit back?", body: `${amount} goes back to the tenant and the deal ends.`, confirm: "Give it back", danger: true };
  }
  return null;
}

export interface DealRow {
  key: string;
  time: string;
  title: string;
  detail?: string;
  state: "done" | "now" | "next" | "later";
  tone?: "released" | "returned";
  signature?: string;
}

/** Timetable rows for the deal page, with receipts from the transaction list (oldest first). */
export function dealRows(o: {
  status: DealStatus;
  times: DealTimes & { createdAt: number; fundedAt: number; settledAt: number };
  signatures: string[];
  now: number;
  amount: string;
}): DealRow[] {
  const { status, times: t, signatures, now, amount } = o;
  const steps = timelineSteps(status, t, signatures);
  const created: DealRow = { key: "created", time: formatShortDateTime(t.createdAt), title: "Deal created", state: "done", signature: steps[0].signature };

  if (status === "cancelled") {
    return [
      created,
      {
        key: "cancelled",
        time: formatShortDateTime(t.settledAt),
        title: STATUS_LABEL.cancelled,
        detail: "The landlord withdrew the deal before anyone paid.",
        state: "done",
        signature: steps[1]?.signature,
      },
    ];
  }

  const locked: DealRow =
    status === "open"
      ? {
          key: "locked",
          time: `By ${formatShortDateTime(t.deadline)}`,
          title: "The tenant pays the deposit",
          detail: `${amount} goes into the lock.`,
          state: isExpired(t, now) ? "later" : "now",
        }
      : { key: "locked", time: formatShortDateTime(t.fundedAt), title: STATUS_LABEL.funded, detail: `${amount} is in the lock.`, state: "done", signature: steps[1]?.signature };

  if (status === "released" || status === "refunded") {
    const released = status === "released";
    return [
      created,
      locked,
      {
        key: "settled",
        time: formatShortDateTime(t.settledAt),
        title: STATUS_LABEL[status],
        detail: released ? `${amount} went to the landlord.` : `${amount} went back to the tenant.`,
        state: "done",
        tone: released ? "released" : "returned",
        signature: steps[2]?.signature,
      },
    ];
  }

  const opens = handoverOpensAt(t);
  const expired = isExpired(t, now);
  const inWindow = status === "funded" && now >= opens && !expired;
  return [
    created,
    locked,
    {
      key: "handover",
      time: formatShortDateTime(opens),
      title: "Key handover",
      detail: `Until ${formatShortDateTime(t.deadline)}. The tenant scans the landlord's code and ${amount} goes to the landlord.`,
      state: status === "open" || expired ? "later" : inWindow ? "now" : "next",
    },
    {
      key: "fallback",
      time: formatShortDateTime(t.deadline),
      title: "No handover by then?",
      detail: `${amount} goes back to the tenant. Anyone can trigger it.`,
      state: status === "funded" && expired ? "now" : "later",
    },
  ];
}
```

- [ ] **Step 4: Write the failing test `web/src/lib/deal-data.test.ts`**

```ts
import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { toDealData } from "./deal-data";
import type { DealAccount } from "./program";

describe("toDealData", () => {
  it("turns the Anchor account into plain data", () => {
    const landlord = PublicKey.unique();
    const tenant = PublicKey.unique();
    const account = {
      landlord,
      tenant,
      mint: PublicKey.unique(),
      dealId: new BN(7),
      amount: new BN("600000000"),
      moveIn: new BN(1_790_000_000),
      deadline: new BN(1_790_259_200),
      createdAt: new BN(1_789_000_000),
      fundedAt: new BN(1_789_000_480),
      settledAt: new BN(0),
      status: { funded: {} },
      bump: 254,
      title: "Room in Vallendar",
    } as unknown as DealAccount;
    expect(toDealData(account)).toEqual({
      landlord: landlord.toBase58(),
      tenant: tenant.toBase58(),
      title: "Room in Vallendar",
      amount: "600000000",
      status: "funded",
      moveIn: 1_790_000_000,
      deadline: 1_790_259_200,
      createdAt: 1_789_000_000,
      fundedAt: 1_789_000_480,
      settledAt: 0,
    });
  });
});
```

- [ ] **Step 5: Run it to see it fail**

Run: `npm test`
Expected: FAIL with `Failed to resolve import "./deal-data"` (the deal-view tests may pass already).

- [ ] **Step 6: Write `web/src/lib/deal-data.ts`**

```ts
import type { DealData } from "./deal-view";
import type { DealAccount } from "./program";
import { statusOf } from "./rules";

/** Anchor account (BN, PublicKey) → plain data for the views and the dashboard. */
export function toDealData(d: DealAccount): DealData {
  return {
    landlord: d.landlord.toBase58(),
    tenant: d.tenant.toBase58(),
    title: d.title,
    amount: d.amount.toString(),
    status: statusOf(d.status),
    moveIn: d.moveIn.toNumber(),
    deadline: d.deadline.toNumber(),
    createdAt: d.createdAt.toNumber(),
    fundedAt: d.fundedAt.toNumber(),
    settledAt: d.settledAt.toNumber(),
  };
}
```

- [ ] **Step 7: Run all tests to see them pass**

Run: `npm test`
Expected: PASS (all files).

- [ ] **Step 8: Write `web/src/lib/use-deal.ts`** (the polling logic from today's `DealClient`, unchanged, plus `statusChanged` / `justReleased`)

```ts
"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dealSignatures, getProgram, type DealAccount } from "./program";
import { statusOf, timelineTransactionCount, type DealStatus } from "./rules";

export interface DealState {
  address: PublicKey | null;
  /** undefined while loading, null when no deal exists at this address. */
  deal: DealAccount | null | undefined;
  signatures: string[];
  loadError: string | null;
  /** True once the status changed while this page was open (the status chip flips). */
  statusChanged: boolean;
  /** True when this page saw the deal go from locked to released (opens the landlord's Released screen). */
  justReleased: boolean;
  refresh: () => Promise<void>;
}

export function useDeal(id: string): DealState {
  const { connection } = useConnection();
  const program = useMemo(() => getProgram(connection), [connection]);
  const address = useMemo(() => {
    try {
      return new PublicKey(id);
    } catch {
      return null;
    }
  }, [id]);
  const [deal, setDeal] = useState<DealAccount | null | undefined>(undefined);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusChanged, setStatusChanged] = useState(false);
  const [justReleased, setJustReleased] = useState(false);
  const signatureCount = useRef(0);
  const lastStatus = useRef<DealStatus | null>(null);

  // The public devnet RPC rate-limits per network (a laptop and a phone on the same Wi-Fi share it),
  // so each poll reads only the deal and fetches the transaction list only while a timeline link is missing.
  const refresh = useCallback(async () => {
    if (!address) return;
    const data = await program.account.deal.fetchNullable(address);
    setDeal(data);
    if (!data) return;
    const status = statusOf(data.status);
    const previous = lastStatus.current;
    lastStatus.current = status;
    if (previous !== null && previous !== status) {
      setStatusChanged(true);
      if (previous === "funded" && status === "released") setJustReleased(true);
    }
    if (signatureCount.current < timelineTransactionCount(status)) {
      const sigs = await dealSignatures(connection, address);
      signatureCount.current = sigs.length;
      setSignatures(sigs);
    }
  }, [address, connection, program]);

  // Poll so the landlord's screen flips to "Released" seconds after the tenant signs.
  // Hidden tabs don't poll; they reload as soon as they are shown again.
  useEffect(() => {
    const load = () => {
      if (document.hidden) return;
      refresh().then(
        () => setLoadError(null),
        (e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)),
      );
    };
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 2_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [refresh]);

  return { address, deal, signatures, loadError, statusChanged, justReleased, refresh };
}
```

- [ ] **Step 9: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors (the hook is not used yet; Task 6 wires it in). `npm run build` → succeeds.

- [ ] **Step 10: Commit**

```bash
git add web/src/lib/deal-view.ts web/src/lib/deal-view.test.ts web/src/lib/deal-data.ts web/src/lib/deal-data.test.ts web/src/lib/use-deal.ts
git commit -m "feat(web): deal phases, next-step matrix, timetable rows and useDeal hook (tested)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The deal page

**Files:**
- Create: `web/src/components/deal/{DealHero,CountdownPanel,NextStep,ShareBox,DealTimetable,DealDetails,DealStates,DealView}.tsx`
- Modify (replace): `web/src/app/(app)/deal/[id]/DealClient.tsx`, `web/src/app/(app)/deal/[id]/page.tsx`
- Create: `web/src/app/(app)/deal/[id]/loading.tsx`
- Create: `web/src/app/(app)/dev/deal/page.tsx`, `web/src/app/(app)/dev/deal/DealGallery.tsx`
- Delete: `web/src/components/{DealActions,ShareLink,Timeline}.tsx` (`HandoverQR.tsx` stays until Task 7)

**Interfaces:**
- Consumes: Tasks 3–5; `LoginButton`, `OpenInPhantom`, `TestFundsButton` (Task 4); `fundIx`, `confirmHandoverIx`, `refundIx`, `cancelDealIx` from `@/lib/instructions`; `signAndSend`, `friendlyError` from `@/lib/send`; `useNow` from `@/lib/hooks`; `HandoverQR` from `@/components/HandoverQR` (temporary).
- Produces: `DealView(props: DealViewProps)` with `interface DealViewProps { id: string; origin: string; data: DealData; role: Role; now: number; connected: boolean; created: boolean; signatures: string[]; statusChanged: boolean; busy: Action | null; error: string | null; signature: string | null; onAction: (action: Action) => void }`; `DealClient({ id: string; origin: string; created: boolean })`; `DealLoading({ loadError })`, `DealMessage({ title, children?, action? })`.

- [ ] **Step 1: Write the deal components**

`web/src/components/deal/DealHero.tsx`:

```tsx
import { StatusChip } from "@/components/ui/StatusChip";
import { cx } from "@/lib/cx";
import { ROLE_LINE, statusLine } from "@/lib/deal-view";
import type { DealStatus, Role } from "@/lib/rules";

const BAND: Record<DealStatus, { band: string; sub: string }> = {
  open: { band: "bg-subtle text-fg", sub: "text-fg-muted" },
  funded: { band: "bg-inverse text-fg-inverse", sub: "text-fg-inverse-muted" },
  released: { band: "bg-released text-white", sub: "text-white" },
  refunded: { band: "bg-returned text-white", sub: "text-white" },
  cancelled: { band: "bg-subtle text-fg", sub: "text-fg-muted" },
};

/** Status band in the status colour (design system §6): room, amount, chip, one line. */
export function DealHero({ title, amount, status, role, animate }: { title: string; amount: string; status: DealStatus; role: Role; animate: boolean }) {
  const look = BAND[status];
  return (
    <section aria-labelledby="deal-title" className={cx("rounded-lg px-5 pt-5 pb-6", look.band)}>
      <p className={cx("label", look.sub)}>{ROLE_LINE[role]}</p>
      <h1 id="deal-title" className="mt-2 font-display text-card font-bold break-words">
        {title}
      </h1>
      <p className="mt-1 font-display text-amount font-bold tabular-nums">{amount}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={status} tone="onBand" animate={animate} />
        <p role="status" className={cx("text-sm", look.sub)}>
          {statusLine(status, role)}
        </p>
      </div>
    </section>
  );
}
```

`web/src/components/deal/CountdownPanel.tsx`:

```tsx
import { Icon } from "@/components/ui/Icon";
import type { CountdownInfo } from "@/lib/deal-view";
import { formatCountdown, formatShortDateTime } from "@/lib/format";

/** Counts down to the next moment that matters. Not a live region: it would announce every second. */
export function CountdownPanel({ info, now }: { info: CountdownInfo | null; now: number }) {
  if (!info) return null;
  const left = info.at - now;
  const future = left > 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border-2 border-fg px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon name="clock" size={22} className="shrink-0" />
        <div>
          <p className="text-sm text-fg-muted">{info.label}</p>
          <p className="font-display text-[1.5rem] leading-tight font-bold tabular-nums">
            {future ? formatCountdown(left) : formatShortDateTime(info.at)}
          </p>
        </div>
      </div>
      {future && <p className="text-right text-sm text-fg-muted tabular-nums">{formatShortDateTime(info.at)}</p>}
    </div>
  );
}
```

`web/src/components/deal/NextStep.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { actionLabel, loginLabel, type NextStepView } from "@/lib/deal-view";
import { explorerTx } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";

/** One primary action for this viewer right now; secondary actions below; errors and receipts inline. */
export function NextStep({
  view,
  role,
  amount,
  connected,
  busy,
  error,
  signature,
  onAction,
}: {
  view: NextStepView;
  role: Role;
  amount: string;
  connected: boolean;
  busy: Action | null;
  error: string | null;
  signature: string | null;
  onAction: (action: Action) => void;
}) {
  const { primary, secondary } = view;
  return (
    <section aria-labelledby="next-step" className="space-y-4 rounded-lg bg-subtle p-5">
      <h2 id="next-step" className="label text-fg-muted">
        {role === "visitor" ? "What happens next" : "Your next step"}
      </h2>
      <p className="text-body">{view.message}</p>

      {primary &&
        (connected ? (
          <Button
            size="lg"
            fullWidth
            loading={busy === primary}
            loadingText="Waiting for your wallet…"
            disabled={busy !== null}
            onClick={() => onAction(primary)}
          >
            {actionLabel(primary, role, amount)}
          </Button>
        ) : (
          <div className="space-y-3">
            <LoginButton label={loginLabel(primary)} variant="primary" size="lg" fullWidth />
            <OpenInPhantom />
          </div>
        ))}

      {primary === "fund" && connected && <TestFundsButton />}

      {secondary.length > 0 && (
        <div className="grid gap-2">
          {secondary.map((action) => (
            <Button
              key={action}
              variant={action === "cancel" ? "danger" : "secondary"}
              fullWidth
              loading={busy === action}
              loadingText="Waiting for your wallet…"
              disabled={busy !== null}
              onClick={() => onAction(action)}
            >
              {actionLabel(action, role, amount)}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      )}
      {signature && (
        <Callout tone="success" role="status">
          Done.{" "}
          <a href={explorerTx(signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            View the receipt on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Callout>
      )}
    </section>
  );
}
```

`web/src/components/deal/ShareBox.tsx`:

```tsx
"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Icon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

export function ShareBox({ url, text }: { url: string; text: string }) {
  const mounted = useMounted();
  const canShare = mounted && typeof navigator.share === "function";
  return (
    <section aria-labelledby="share-title" className="space-y-4 rounded-lg border-2 border-fg p-5">
      <h2 id="share-title" className="font-display text-card font-bold">
        Send this link to your tenant
      </h2>
      <CopyField label="Deposit link" value={url} />
      <div className="grid gap-2 sm:grid-cols-2">
        <ButtonLink href={whatsappUrl(`${text} ${url}`)} external variant="secondary" fullWidth>
          Share on WhatsApp
        </ButtonLink>
        {canShare && (
          <Button variant="secondary" fullWidth onClick={() => void navigator.share({ text, url }).catch(() => undefined)}>
            <Icon name="share" size={18} />
            More ways to share
          </Button>
        )}
      </div>
    </section>
  );
}
```

`web/src/components/deal/DealTimetable.tsx`:

```tsx
import { Icon } from "@/components/ui/Icon";
import { Timetable } from "@/components/ui/Timetable";
import type { DealRow } from "@/lib/deal-view";
import { explorerTx } from "@/lib/format";

export function DealTimetable({ rows, title }: { rows: DealRow[]; title: string }) {
  return (
    <Timetable
      title="Timeline"
      aside={title}
      rows={rows.map((row) => ({
        key: row.key,
        time: row.time,
        title: row.title,
        state: row.state,
        tone: row.tone,
        detail:
          row.detail || row.signature ? (
            <>
              {row.detail}
              {row.signature && (
                <>
                  {row.detail ? " " : ""}
                  <a
                    href={explorerTx(row.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2"
                  >
                    Receipt
                    <Icon name="external" size={13} />
                    <span className="sr-only"> on Solana Explorer (opens in a new tab)</span>
                  </a>
                </>
              )}
            </>
          ) : undefined,
      }))}
    />
  );
}
```

`web/src/components/deal/DealDetails.tsx`:

```tsx
import { Icon } from "@/components/ui/Icon";
import { explorerAddress, formatShortDateTime, shortAddress } from "@/lib/format";
import { handoverOpensAt, type DealTimes } from "@/lib/rules";

export function DealDetails({ id, times }: { id: string; times: DealTimes }) {
  const rows: Array<[string, string]> = [
    ["Move-in", formatShortDateTime(times.moveIn)],
    ["Handover opens", formatShortDateTime(handoverOpensAt(times))],
    ["Handover deadline", formatShortDateTime(times.deadline)],
  ];
  return (
    <section aria-labelledby="details-title" className="rounded-lg border-[1.5px] border-rule p-5">
      <h2 id="details-title" className="label text-fg-muted">
        Details
      </h2>
      <dl className="mt-3 divide-y divide-rule text-sm">
        {rows.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4 py-2.5">
            <dt className="text-fg-muted">{term}</dt>
            <dd className="text-right font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-fg-muted">This deal on Solana</dt>
          <dd>
            <a href={explorerAddress(id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              {shortAddress(id)}
              <Icon name="external" size={13} />
              <span className="sr-only"> (opens Solana Explorer in a new tab)</span>
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}
```

`web/src/components/deal/DealStates.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

/** Loading skeleton; after 3 s (or on an error) it says what's happening, since phones have no dev tools. */
export function DealLoading({ loadError }: { loadError: string | null }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-8" aria-busy="true">
      <p role="status" className="sr-only">
        Loading the deal…
      </p>
      <Skeleton className="h-52" />
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      {(slow || loadError) && (
        <Callout tone="neutral" role="status" title="Still connecting to Solana devnet…">
          {loadError ? `Retrying. Details: ${loadError}` : "This can take a few seconds on a busy network."}
        </Callout>
      )}
      <Skeleton className="h-64" />
    </div>
  );
}

export function DealMessage({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-app px-4 py-12">
      <EmptyState pictogram="fake-listing" title={title} action={action}>
        {children}
      </EmptyState>
    </div>
  );
}
```

`web/src/components/deal/DealView.tsx`:

```tsx
"use client";

import { Callout } from "@/components/ui/Callout";
import { countdownFor, dealPhase, dealRows, nextStep, type DealData } from "@/lib/deal-view";
import { formatEur } from "@/lib/format";
import type { Action, Role } from "@/lib/rules";
import { CountdownPanel } from "./CountdownPanel";
import { DealDetails } from "./DealDetails";
import { DealHero } from "./DealHero";
import { DealTimetable } from "./DealTimetable";
import { NextStep } from "./NextStep";
import { ShareBox } from "./ShareBox";

export interface DealViewProps {
  id: string;
  origin: string;
  data: DealData;
  role: Role;
  now: number;
  connected: boolean;
  created: boolean;
  signatures: string[];
  statusChanged: boolean;
  busy: Action | null;
  error: string | null;
  signature: string | null;
  onAction: (action: Action) => void;
}

/** The deal page's layout, from plain data (the dev gallery renders it with sample deals). */
export function DealView(p: DealViewProps) {
  const { data, role, now } = p;
  const times = { moveIn: data.moveIn, deadline: data.deadline };
  const amount = formatEur(data.amount);
  const phase = dealPhase(data.status, times, now);
  const view = nextStep({ status: data.status, role, times, now, amount, settledAt: data.settledAt });
  const rows = dealRows({
    status: data.status,
    times: { ...times, createdAt: data.createdAt, fundedAt: data.fundedAt, settledAt: data.settledAt },
    signatures: p.signatures,
    now,
    amount,
  });

  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-6 sm:py-10">
      {p.created && role === "landlord" && data.status === "open" && (
        <Callout tone="success" role="status" title="Your deposit link is ready">
          Send it to your tenant. This page shows it as soon as they pay.
        </Callout>
      )}
      <DealHero title={data.title} amount={amount} status={data.status} role={role} animate={p.statusChanged} />
      <CountdownPanel info={countdownFor(phase, times)} now={now} />
      <NextStep
        view={view}
        role={role}
        amount={amount}
        connected={p.connected}
        busy={p.busy}
        error={p.error}
        signature={p.signature}
        onAction={p.onAction}
      />
      {role === "landlord" && phase === "open" && (
        <ShareBox url={`${p.origin}/deal/${p.id}`} text={`Pay the ${amount} deposit for "${data.title}" safely with Keysfirst:`} />
      )}
      <DealTimetable rows={rows} title={data.title} />
      <DealDetails id={p.id} times={times} />
    </div>
  );
}
```

- [ ] **Step 2: Replace `web/src/app/(app)/deal/[id]/DealClient.tsx`**

```tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import { DealLoading, DealMessage } from "@/components/deal/DealStates";
import { DealView } from "@/components/deal/DealView";
import { HandoverQR } from "@/components/HandoverQR";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toDealData } from "@/lib/deal-data";
import { confirmCopy } from "@/lib/deal-view";
import { formatEur } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cancelDealIx, confirmHandoverIx, fundIx, refundIx } from "@/lib/instructions";
import { getProgram } from "@/lib/program";
import { roleOf, STATUS_LABEL, statusOf, type Action, type DealStatus } from "@/lib/rules";
import { friendlyError, signAndSend } from "@/lib/send";
import { useDeal } from "@/lib/use-deal";

type WalletAction = Exclude<Action, "showQr">;

// The status each action needs; checked against the live deal right before the wallet signs.
const REQUIRED_STATUS: Record<WalletAction, DealStatus> = { fund: "open", confirmInApp: "funded", refund: "funded", cancel: "open" };

export function DealClient({ id, origin, created }: { id: string; origin: string; created: boolean }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useMemo(() => getProgram(connection), [connection]);
  const { address, deal, signatures, loadError, statusChanged, refresh } = useDeal(id);
  const now = useNow();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<WalletAction | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);

  if (!address) {
    return <DealMessage title="This isn't a valid deal link">Check that you copied the whole link.</DealMessage>;
  }
  if (deal === undefined || now === 0) return <DealLoading loadError={loadError} />;
  if (deal === null) {
    return (
      <DealMessage
        title="We can't find this deal"
        action={
          <Button variant="secondary" onClick={() => void refresh()}>
            Try again
          </Button>
        }
      >
        If it was just created, wait a few seconds and try again.
      </DealMessage>
    );
  }

  const data = toDealData(deal);
  const me = wallet.publicKey;
  const role = roleOf(data.landlord, data.tenant, me?.toBase58());
  const amount = formatEur(data.amount);

  async function execute(action: WalletAction) {
    if (!me || !address) return;
    setBusy(action);
    setError(null);
    setSignature(null);
    try {
      // A page that sat in the background (e.g. while the tenant scanned the QR) can show a button
      // the deal no longer allows; check the live status before asking the wallet to sign.
      const live = await program.account.deal.fetch(address);
      const liveStatus = statusOf(live.status);
      if (liveStatus !== REQUIRED_STATUS[action]) {
        await refresh();
        setError(`This deal is already “${STATUS_LABEL[liveStatus]}”. The page has been updated.`);
        return;
      }
      const build = {
        fund: () => fundIx(program, address, me, live),
        confirmInApp: () => confirmHandoverIx(program, address, live),
        refund: () => refundIx(program, address, live, me),
        cancel: () => cancelDealIx(program, address, live),
      };
      setSignature(await signAndSend(connection, wallet, [await build[action]()]));
      await refresh();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  function onAction(action: Action) {
    if (action === "showQr") {
      setHandoverOpen(true);
      return;
    }
    if (confirmCopy(action, role, amount)) {
      setConfirming(action);
      return;
    }
    void execute(action);
  }

  const copy = confirming ? confirmCopy(confirming, role, amount) : null;

  return (
    <>
      <DealView
        id={id}
        origin={origin}
        data={data}
        role={role}
        now={now}
        connected={me !== null}
        created={created}
        signatures={signatures}
        statusChanged={statusChanged}
        busy={busy}
        error={error}
        signature={signature}
        onAction={onAction}
      />
      {handoverOpen && data.status === "funded" && (
        <div className="mx-auto max-w-app px-4 pb-10">
          <HandoverQR dealId={id} origin={origin} />
        </div>
      )}
      <ConfirmDialog
        open={copy !== null}
        title={copy?.title ?? ""}
        body={copy?.body ?? ""}
        confirmLabel={copy?.confirm ?? ""}
        danger={copy?.danger}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const action = confirming;
          setConfirming(null);
          if (action) void execute(action);
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Replace `web/src/app/(app)/deal/[id]/page.tsx`** (passes `?created=1`; the preview image moves to a file in Task 14)

```tsx
import type { Metadata } from "next";
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { DealClient } from "./DealClient";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

const DESCRIPTION =
  "Protected by Keysfirst: the landlord gets the deposit only when you scan their QR code at the key handover.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const deal = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id));
    if (!deal) return { title: "Deal not found", robots: { index: false } };
    const title = `${formatEur(deal.amount.toString())} deposit · ${deal.title}`;
    // Next merges metadata shallowly: setting openGraph here drops the root's image unless we repeat it (Task 14 replaces this with a file).
    const images = [{ url: "/opengraph-image", width: 1200, height: 630 }];
    return { title, description: DESCRIPTION, robots: { index: false }, openGraph: { title, description: DESCRIPTION, images } };
  } catch {
    return { title: "Deal", robots: { index: false } };
  }
}

export default async function DealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  return <DealClient id={id} origin={await getOrigin()} created={created === "1"} />;
}
```

- [ ] **Step 4: Write `web/src/app/(app)/deal/[id]/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function LoadingDeal() {
  return (
    <div className="mx-auto max-w-app space-y-5 px-4 py-8" aria-busy="true">
      <p role="status" className="sr-only">
        Loading the deal…
      </p>
      <Skeleton className="h-52" />
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
```

- [ ] **Step 5: Write the deal gallery** (every phase × role without a wallet)

`web/src/app/(app)/dev/deal/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealGallery } from "./DealGallery";

export const metadata: Metadata = { title: "Deal gallery (development)", robots: { index: false } };

export default function DealGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DealGallery />;
}
```

`web/src/app/(app)/dev/deal/DealGallery.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DealView } from "@/components/deal/DealView";
import { Segmented } from "@/components/ui/Segmented";
import type { DealData, Phase } from "@/lib/deal-view";
import type { Role } from "@/lib/rules";

const at = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour, minute) / 1000;
const LANDLORD = "LandLord111111111111111111111111111111111111";
const TENANT = "TenAnt11111111111111111111111111111111111111";
const OTHER = "0therWa11et1111111111111111111111111111111111";
const BASE: DealData = {
  landlord: LANDLORD,
  tenant: "11111111111111111111111111111111",
  title: "Room in Vallendar",
  amount: "600000000",
  status: "open",
  moveIn: at(10, 1, 14),
  deadline: at(10, 4, 14),
  createdAt: at(9, 27, 10, 12),
  fundedAt: 0,
  settledAt: 0,
};
const FUNDED: DealData = { ...BASE, status: "funded", tenant: TENANT, fundedAt: at(9, 27, 10, 20) };

const SCENARIOS: Record<Phase, { data: DealData; now: number }> = {
  open: { data: BASE, now: at(9, 28, 9) },
  "open-too-early": { data: { ...BASE, moveIn: at(12, 1, 14), deadline: at(12, 4, 14) }, now: at(6, 1, 9) },
  "open-expired": { data: BASE, now: at(10, 5, 9) },
  "funded-before": { data: FUNDED, now: at(9, 29, 19, 18) },
  "funded-window": { data: FUNDED, now: at(10, 1, 13, 55) },
  "funded-expired": { data: FUNDED, now: at(10, 4, 15) },
  released: { data: { ...FUNDED, status: "released", settledAt: at(10, 1, 14, 7) }, now: at(10, 1, 14, 8) },
  refunded: { data: { ...FUNDED, status: "refunded", settledAt: at(10, 4, 15, 2) }, now: at(10, 4, 15, 3) },
  cancelled: { data: { ...BASE, status: "cancelled", settledAt: at(9, 27, 11) }, now: at(9, 27, 12) },
};
const ME: Record<Role, string> = { landlord: LANDLORD, tenant: TENANT, visitor: OTHER };

export function DealGallery() {
  const [phase, setPhase] = useState<Phase>("funded-window");
  const [role, setRole] = useState<Role>("landlord");
  const [connected, setConnected] = useState<"yes" | "no">("yes");
  const { data, now } = SCENARIOS[phase];
  const effectiveRole: Role = connected === "yes" ? (ME[role] === data.landlord ? "landlord" : ME[role] === data.tenant ? "tenant" : "visitor") : "visitor";

  return (
    <div className="space-y-6 py-6">
      <div className="mx-auto max-w-page space-y-4 px-4 sm:px-6 lg:px-10">
        <h1 className="font-display text-section font-bold">Deal gallery</h1>
        <Segmented
          name="phase"
          legend="Phase"
          value={phase}
          onChange={setPhase}
          options={(Object.keys(SCENARIOS) as Phase[]).map((value) => ({ value, label: value }))}
        />
        <Segmented
          name="role"
          legend="Viewer"
          value={role}
          onChange={setRole}
          options={[
            { value: "landlord", label: "Landlord" },
            { value: "tenant", label: "Tenant" },
            { value: "visitor", label: "Someone else" },
          ]}
        />
        <Segmented
          name="connected"
          legend="Wallet"
          value={connected}
          onChange={setConnected}
          options={[
            { value: "yes", label: "Logged in" },
            { value: "no", label: "Logged out" },
          ]}
        />
      </div>
      <DealView
        id="8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy"
        origin="https://keysfirst.vercel.app"
        data={data}
        role={effectiveRole}
        now={now}
        connected={connected === "yes"}
        created={phase === "open"}
        signatures={["demoCreate", "demoFund", "demoSettle"]}
        statusChanged={false}
        busy={null}
        error={null}
        signature={null}
        onAction={() => undefined}
      />
    </div>
  );
}
```

- [ ] **Step 6: Delete the replaced components**

Run: `git rm web/src/components/DealActions.tsx web/src/components/ShareLink.tsx web/src/components/Timeline.tsx`

- [ ] **Step 7: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → succeeds (`/deal/[id]` dynamic).
Browser, `http://localhost:3000/dev/deal` at 375 and 1280 px: step through every phase with each viewer and "Logged out":
- Band colours: open/cancelled mist, funded ink, released green, refunded blue; the chip on the band is white and readable.
- Exactly one large primary button, or none: landlord in the window → "Start the handover" + "Give the deposit back to the tenant"; tenant in the window → no primary, "I have the keys: release the deposit"; open + someone else → "Pay €600.00 into the lock" (logged out: "Log in to pay" + Open in Phantom callout on a phone-sized viewport without a wallet); expired → the refund label for each viewer.
- The landlord's open deal shows the share box; the WhatsApp button opens `wa.me` with the text and link.
- Timetable rows and states match; receipt links point to `explorer.solana.com/tx/…?cluster=devnet`.
- No horizontal scroll at 375 px; no console errors.
Then a real deal: `http://localhost:3000/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy` (released on 2026-09-27) shows the green band, three receipts and no action buttons; `/deal/not-a-key` shows "This isn't a valid deal link"; a valid but unused address (e.g. `/deal/11111111111111111111111111111112`) shows "We can't find this deal". Network tab: the deal page polls about every 2 s and stops while the tab is hidden.
Confirmation dialogs: the gallery's buttons do nothing on purpose; the dialog itself was checked in Task 3's UI gallery, and the real release, cancel and refund flows are part of Task 20's Phantom regression.

- [ ] **Step 8: Commit**

```bash
git add -A web/src
git commit -m "feat(web): deal page with status band, countdown, one next step per role, share box and receipts" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Landlord handover mode and the Released screen

**Files:**
- Modify: `web/src/lib/hooks.ts` (append `useWakeLock`)
- Create: `web/src/components/deal/HandoverMode.tsx`, `web/src/components/deal/ReleasedScreen.tsx`
- Modify: `web/src/app/(app)/deal/[id]/DealClient.tsx` (replace the temporary QR block)
- Modify (replace): `web/src/app/(app)/dev/deal/DealGallery.tsx` (buttons to open both screens)
- Delete: `web/src/components/HandoverQR.tsx`

**Interfaces:**
- Consumes: `Sheet` (Task 3), `LogoMark` (Task 2), `formatCountdown`, `formatShortDateTime`, `explorerTx` from `@/lib/format`, `QRCodeSVG` from `qrcode.react`, `useDeal().justReleased` (Task 5).
- Produces: `useWakeLock(active: boolean): void` from `@/lib/hooks`; `HandoverMode({ open, onClose, dealId, origin, title, amount, deadline, now })`; `ReleasedScreen({ open, onClose, title, amount, settledAt, receipt? })`.

- [ ] **Step 1: Append `useWakeLock` to `web/src/lib/hooks.ts`**

```ts
/** Keeps the screen on while `active` (the landlord's handover code). Ignored where the browser can't. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let stopped = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(
        (lock) => {
          if (stopped) void lock.release();
          else sentinel = lock;
        },
        () => undefined,
      );
    };
    request();
    // The browser drops the lock when the tab is hidden; ask again when it comes back.
    document.addEventListener("visibilitychange", request);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", request);
      void sentinel?.release();
    };
  }, [active]);
}
```

(`useEffect` is already imported at the top of `hooks.ts`.)

- [ ] **Step 2: Write `web/src/components/deal/HandoverMode.tsx`**

```tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { formatCountdown } from "@/lib/format";
import { useWakeLock } from "@/lib/hooks";

const STEPS = [
  "Let the tenant check the room.",
  "They scan this code with their phone camera and approve in Phantom.",
  "Hand over the keys when this screen turns green.",
];

/**
 * The landlord's full-screen handover. The QR encodes a plain https page because the iPhone Camera cannot open
 * `solana:` codes (docs/spike.md); that page hands the request to Phantom.
 */
export function HandoverMode({
  open,
  onClose,
  dealId,
  origin,
  title,
  amount,
  deadline,
  now,
}: {
  open: boolean;
  onClose: () => void;
  dealId: string;
  origin: string;
  title: string;
  amount: string;
  deadline: number;
  now: number;
}) {
  useWakeLock(open);
  const url = `${origin}/deal/${dealId}/handover`;
  return (
    <Sheet open={open} onClose={onClose} title="Key handover" variant="full">
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 bg-inverse px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-fg-inverse">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark size={32} />
            <div className="min-w-0">
              <p className="label text-fg-inverse-muted">Key handover</p>
              <p className="truncate font-display text-lg leading-tight font-bold">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the handover"
            className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="mx-auto flex w-full max-w-app flex-1 flex-col items-center gap-5 px-4 py-6 text-center">
          <p className="font-display text-section font-bold tabular-nums">{amount}</p>
          <div className="rounded-lg border-2 border-fg bg-white p-3">
            <QRCodeSVG
              value={url}
              size={320}
              marginSize={2}
              title="Handover code for the tenant"
              style={{ width: "var(--qr-size)", height: "var(--qr-size)" }}
            />
          </div>
          <ol className="w-full max-w-sm space-y-2.5 text-left">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent font-display font-bold">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p role="status" className="inline-flex items-center gap-2 font-semibold">
            <span aria-hidden="true" className="size-2.5 animate-pulse-dot rounded-full bg-accent ring-2 ring-fg" />
            Waiting for the tenant to approve…
          </p>
          <p className="text-sm text-fg-muted tabular-nums">Handover deadline in {formatCountdown(deadline - now)}</p>
        </div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 3: Write `web/src/components/deal/ReleasedScreen.tsx`**

```tsx
"use client";

import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { explorerTx, formatShortDateTime } from "@/lib/format";

/** "Released: hand over the keys." Enters once (animate-released), then stays still. */
export function ReleasedScreen({
  open,
  onClose,
  title,
  amount,
  settledAt,
  receipt,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: string;
  settledAt: number;
  receipt?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Released: hand over the keys" variant="full" className="bg-released">
      <div
        role="status"
        className="flex min-h-dvh animate-released flex-col justify-between bg-released px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
      >
        <div className="mx-auto w-full max-w-app">
          <p className="label">
            {title}
            {settledAt ? ` · ${formatShortDateTime(settledAt)}` : ""}
          </p>
          <p className="mt-8 font-display text-[clamp(3rem,13vw,4.75rem)] leading-[0.92] font-bold">
            Released:
            <br />
            hand over the keys.
          </p>
          <p className="mt-8 font-display text-amount font-bold tabular-nums">{amount}</p>
          <p className="text-lg">is in your wallet now.</p>
        </div>
        <div className="mx-auto w-full max-w-app space-y-4">
          {receipt && (
            <a href={explorerTx(receipt)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
              View the receipt on Solana Explorer
              <Icon name="external" size={16} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-(--btn-h) w-full rounded-md border-2 border-white px-5 font-semibold hover:bg-white/10"
          >
            Back to the deal
          </button>
        </div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 4: Wire them into `web/src/app/(app)/deal/[id]/DealClient.tsx`**

1. Replace the import `import { HandoverQR } from "@/components/HandoverQR";` with the lines below, and put the `const HandoverMode = …` line directly under the last import (module level, outside the component):

```tsx
import dynamic from "next/dynamic";
import { ReleasedScreen } from "@/components/deal/ReleasedScreen";
```

```tsx
// The QR library loads only when the landlord first opens handover mode (spec §10).
const HandoverMode = dynamic(() => import("@/components/deal/HandoverMode").then((m) => m.HandoverMode), { ssr: false });
```

2. Replace `const { address, deal, signatures, loadError, statusChanged, refresh } = useDeal(id);` with:

```tsx
  const { address, deal, signatures, loadError, statusChanged, justReleased, refresh } = useDeal(id);
```

3. Below `const [handoverOpen, setHandoverOpen] = useState(false);` add:

```tsx
  const [handoverUsed, setHandoverUsed] = useState(false);
  const [releasedClosed, setReleasedClosed] = useState(false);
```

   and in `onAction`, replace

```tsx
    if (action === "showQr") {
      setHandoverOpen(true);
      return;
    }
```

   with

```tsx
    if (action === "showQr") {
      setHandoverUsed(true); // mounts HandoverMode (and loads its chunk) the first time; it stays mounted so closing restores focus
      setHandoverOpen(true);
      return;
    }
```

4. Below `const copy = confirming ? confirmCopy(confirming, role, amount) : null;` add:

```tsx
  // The landlord sees the Released screen when the tenant approves during handover mode, or while this page is open.
  const showReleased = role === "landlord" && data.status === "released" && !releasedClosed && (handoverOpen || justReleased);
```

5. Replace the temporary block

```tsx
      {handoverOpen && data.status === "funded" && (
        <div className="mx-auto max-w-app px-4 pb-10">
          <HandoverQR dealId={id} origin={origin} />
        </div>
      )}
```

with:

```tsx
      {handoverUsed && (
        <HandoverMode
          open={handoverOpen && data.status === "funded"}
          onClose={() => setHandoverOpen(false)}
          dealId={id}
          origin={origin}
          title={data.title}
          amount={amount}
          deadline={data.deadline}
          now={now}
        />
      )}
      <ReleasedScreen
        open={showReleased}
        onClose={() => {
          setHandoverOpen(false);
          setReleasedClosed(true);
        }}
        title={data.title}
        amount={amount}
        settledAt={data.settledAt}
        receipt={signatures[2]}
      />
```

6. Delete the old component: `git rm web/src/components/HandoverQR.tsx`

- [ ] **Step 5: Replace `web/src/app/(app)/dev/deal/DealGallery.tsx`** (same as Task 6 plus two buttons)

```tsx
"use client";

import { useState } from "react";
import { DealView } from "@/components/deal/DealView";
import { HandoverMode } from "@/components/deal/HandoverMode";
import { ReleasedScreen } from "@/components/deal/ReleasedScreen";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import type { DealData, Phase } from "@/lib/deal-view";
import type { Role } from "@/lib/rules";

const at = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour, minute) / 1000;
const LANDLORD = "LandLord111111111111111111111111111111111111";
const TENANT = "TenAnt11111111111111111111111111111111111111";
const OTHER = "0therWa11et1111111111111111111111111111111111";
const BASE: DealData = {
  landlord: LANDLORD,
  tenant: "11111111111111111111111111111111",
  title: "Room in Vallendar",
  amount: "600000000",
  status: "open",
  moveIn: at(10, 1, 14),
  deadline: at(10, 4, 14),
  createdAt: at(9, 27, 10, 12),
  fundedAt: 0,
  settledAt: 0,
};
const FUNDED: DealData = { ...BASE, status: "funded", tenant: TENANT, fundedAt: at(9, 27, 10, 20) };

const SCENARIOS: Record<Phase, { data: DealData; now: number }> = {
  open: { data: BASE, now: at(9, 28, 9) },
  "open-too-early": { data: { ...BASE, moveIn: at(12, 1, 14), deadline: at(12, 4, 14) }, now: at(6, 1, 9) },
  "open-expired": { data: BASE, now: at(10, 5, 9) },
  "funded-before": { data: FUNDED, now: at(9, 29, 19, 18) },
  "funded-window": { data: FUNDED, now: at(10, 1, 13, 55) },
  "funded-expired": { data: FUNDED, now: at(10, 4, 15) },
  released: { data: { ...FUNDED, status: "released", settledAt: at(10, 1, 14, 7) }, now: at(10, 1, 14, 8) },
  refunded: { data: { ...FUNDED, status: "refunded", settledAt: at(10, 4, 15, 2) }, now: at(10, 4, 15, 3) },
  cancelled: { data: { ...BASE, status: "cancelled", settledAt: at(9, 27, 11) }, now: at(9, 27, 12) },
};
const ME: Record<Role, string> = { landlord: LANDLORD, tenant: TENANT, visitor: OTHER };

export function DealGallery() {
  const [phase, setPhase] = useState<Phase>("funded-window");
  const [role, setRole] = useState<Role>("landlord");
  const [connected, setConnected] = useState<"yes" | "no">("yes");
  const [screen, setScreen] = useState<"none" | "handover" | "released">("none");
  const { data, now } = SCENARIOS[phase];
  const effectiveRole: Role =
    connected === "yes" ? (ME[role] === data.landlord ? "landlord" : ME[role] === data.tenant ? "tenant" : "visitor") : "visitor";

  return (
    <div className="space-y-6 py-6">
      <div className="mx-auto max-w-page space-y-4 px-4 sm:px-6 lg:px-10">
        <h1 className="font-display text-section font-bold">Deal gallery</h1>
        <Segmented
          name="phase"
          legend="Phase"
          value={phase}
          onChange={setPhase}
          options={(Object.keys(SCENARIOS) as Phase[]).map((value) => ({ value, label: value }))}
        />
        <Segmented
          name="role"
          legend="Viewer"
          value={role}
          onChange={setRole}
          options={[
            { value: "landlord", label: "Landlord" },
            { value: "tenant", label: "Tenant" },
            { value: "visitor", label: "Someone else" },
          ]}
        />
        <Segmented
          name="connected"
          legend="Wallet"
          value={connected}
          onChange={setConnected}
          options={[
            { value: "yes", label: "Logged in" },
            { value: "no", label: "Logged out" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setScreen("handover")}>
            Open handover mode
          </Button>
          <Button variant="secondary" onClick={() => setScreen("released")}>
            Open Released screen
          </Button>
        </div>
      </div>
      <DealView
        id="8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy"
        origin="https://keysfirst.vercel.app"
        data={data}
        role={effectiveRole}
        now={now}
        connected={connected === "yes"}
        created={phase === "open"}
        signatures={["demoCreate", "demoFund", "demoSettle"]}
        statusChanged={false}
        busy={null}
        error={null}
        signature={null}
        onAction={(action) => {
          if (action === "showQr") setScreen("handover");
        }}
      />
      <HandoverMode
        open={screen === "handover"}
        onClose={() => setScreen("none")}
        dealId="8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy"
        origin="https://keysfirst.vercel.app"
        title="Room in Vallendar"
        amount="€600.00"
        deadline={at(10, 4, 14)}
        now={at(10, 1, 13, 55)}
      />
      <ReleasedScreen
        open={screen === "released"}
        onClose={() => setScreen("none")}
        title="Room in Vallendar"
        amount="€600.00"
        settledAt={at(10, 1, 14, 7)}
        receipt="demoSettle"
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → succeeds.
Browser, `/dev/deal` at 375 × 812 and 1280 × 800:
- "Open handover mode": full screen with the ink header, the amount, a large QR that fits the screen at 375 px without scrolling the code off screen, three numbered steps, the pulsing "Waiting…" line (static with reduced motion; toggle in dev tools → Rendering → prefers-reduced-motion) and the deadline countdown. Esc and the close button close it.
- Scan the QR on screen with a phone camera (or decode it): it reads `https://keysfirst.vercel.app/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy/handover`.
- "Open Released screen": green full screen, "Released: hand over the keys.", €600.00, receipt link, "Back to the deal"; it swings in once.
- Landlord + funded-window: "Start the handover" opens handover mode.
- No console errors.

- [ ] **Step 7: Commit**

```bash
git add -A web/src
git commit -m "feat(web): full-screen landlord handover with wake lock and the Released: hand over the keys screen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Tenant hand-off page (the QR target)

**Files:**
- Modify (replace): `web/src/app/(app)/deal/[id]/handover/page.tsx`

**Interfaces:**
- Consumes: `getOrigin` (unchanged), `getProgram`, `RPC_URL`, `toDealData` (Task 5), `handoverOpensAt`, `formatEur`, `formatShortDateTime(…, "Europe/Berlin")`, `buttonClass`, `Callout`, `Icon`, `cx`.
- Produces: the same URL, `/deal/<id>/handover`, still linking to `solana:<origin>/api/handover/<id>` (constraint 1).

- [ ] **Step 1: Replace `web/src/app/(app)/deal/[id]/handover/page.tsx`**

```tsx
import { Connection, PublicKey } from "@solana/web3.js";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Icon } from "@/components/ui/Icon";
import { RPC_URL } from "@/lib/config";
import { cx } from "@/lib/cx";
import { toDealData } from "@/lib/deal-data";
import type { DealData } from "@/lib/deal-view";
import { formatEur, formatShortDateTime } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { getProgram } from "@/lib/program";
import { handoverOpensAt } from "@/lib/rules";

export const metadata: Metadata = { title: "Confirm the key handover", robots: { index: false } };

// Rendered on the server, where the clock is UTC; the handover happens at a door in Germany.
const GERMAN_TIME = "Europe/Berlin";
const at = (unixSeconds: number) => `${formatShortDateTime(unixSeconds, GERMAN_TIME)} (German time)`;

const CHECKLIST = ["You are inside the room.", "You have the keys, or they are in front of you.", "Phantom is on the wallet that paid the deposit."];

/** `data` is undefined when devnet couldn't be reached: the page then works exactly as before (checklist + button). */
async function loadDeal(id: string): Promise<{ data: DealData | null | undefined; now: number }> {
  const now = Math.floor(Date.now() / 1000);
  try {
    const deal = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id));
    return { data: deal ? toDealData(deal) : null, now };
  } catch {
    return { data: undefined, now };
  }
}

/** Why this deal can't be released from here right now; null when the tenant may approve. */
function blocker(d: DealData, now: number): string | null {
  switch (d.status) {
    case "funded":
      if (now < handoverOpensAt(d)) return `The handover opens ${at(handoverOpensAt(d))}. Come back then, standing in the room.`;
      if (now > d.deadline) return "The handover deadline has passed, so the deposit goes back to the tenant.";
      return null;
    case "open":
      return "Nobody has paid this deposit yet, so there is nothing to release.";
    case "released":
      return `This deposit was already released to the landlord on ${at(d.settledAt)}.`;
    case "refunded":
      return `This deposit already went back to the tenant on ${at(d.settledAt)}.`;
    case "cancelled":
      return "The landlord cancelled this deal.";
  }
}

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const solanaPayUrl = `solana:${await getOrigin()}/api/handover/${id}`;
  const { data, now } = await loadDeal(id);
  const blocked = data === null ? "We can't find this deal. Ask the landlord for the deal link." : data ? blocker(data, now) : null;

  return (
    <div className="mx-auto max-w-app px-4 py-8 sm:py-12">
      <p className="label text-fg-muted">Key handover</p>
      <h1 className="mt-2 font-display text-title font-bold">Confirm the key handover</h1>
      {data && (
        <p className="mt-3 text-lead text-fg-muted">
          <span className="font-semibold text-fg tabular-nums">{formatEur(data.amount)}</span> · {data.title}
        </p>
      )}

      {blocked ? (
        <div className="mt-6 space-y-4">
          <Callout tone="neutral" role="status">
            {blocked}
          </Callout>
          <Link href={`/deal/${id}`} className={buttonClass({ variant: "secondary", fullWidth: true })}>
            Open the deal page
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-3">
                <Icon name="check" size={20} className="mt-0.5 shrink-0 text-released" />
                <span className="text-body">{item}</span>
              </li>
            ))}
          </ul>
          <a href={solanaPayUrl} className={cx(buttonClass({ size: "lg", fullWidth: true }), "mt-8")}>
            Approve in Phantom
          </a>
          <p className="mt-3 text-center text-sm text-fg-muted">Approving pays the landlord immediately. Only continue with the keys in hand.</p>
          <Callout tone="info" className="mt-6" title="Use the wallet that paid">
            Phantom must be on the wallet that paid the deposit. With any other wallet, Phantom only says it could not load the request: switch
            wallets in Phantom and tap the button again.
          </Callout>
          <p className="mt-4 text-sm text-fg-muted">
            Approve within a minute: the request expires quickly. If it does, tap the button again for a fresh one.
          </p>
          <p className="mt-6">
            <Link href={`/deal/${id}`} className={buttonClass({ variant: "quiet" })}>
              Open the deal page instead
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`, `npm run build` → succeed (the route stays dynamic).
Browser at 375 px:
- `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy/handover` (released on 2026-09-27): "€600.00 · …", the callout "This deposit was already released to the landlord on … (German time)" and "Open the deal page".
- `/deal/11111111111111111111111111111112/handover`: "We can't find this deal…".
- `/deal/not-a-key/handover`: the deal can't be read, so the page falls back to the checklist and the "Approve in Phantom" button, whose `href` (inspect it) is `solana:http://localhost:3000/api/handover/not-a-key`: the same link format as before.
- A locked deal inside its window (the normal case) is checked on the phone in Task 20's regression.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add "web/src/app/(app)/deal/[id]/handover/page.tsx"
git commit -m "feat(web): tenant hand-off page with the deal summary, a checklist and clear blocked states" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Milestone M2: push and ask for a quick phone check**

1. `git push` and wait for the Preview deployment (the `/dev/*` galleries return 404 there by design).
2. Ask the user for a 5-minute phone check on the Preview (their iPhone, inside Phantom's browser): log in via the connect sheet, open one of their deals, and if one is locked in its window, try "Start the handover" on the laptop and scan it with the iPhone Camera. Report what they see (the full regression comes in Task 20).
3. Report M2: works / doesn't / next.

---

### Task 9: Create a deposit link in three steps

**Files:**
- Create: `web/src/lib/new-deal.ts`, `web/src/lib/new-deal.test.ts`
- Create: `web/src/app/(app)/new/CreateDealFlow.tsx`
- Modify (replace): `web/src/app/(app)/new/page.tsx` (server wrapper that exports metadata)

**Interfaces:**
- Consumes: `parseEur`, `formatEur`, `formatShortDateTime`, `toLocalInputValue` from `@/lib/format`; `HANDOVER_OPENS_BEFORE_MOVE_IN`, `MAX_HANDOVER_WINDOW` from `@/lib/rules`; `createDealIx`, `randomDealId` from `@/lib/instructions`; `signAndSend`, `friendlyError`; UI primitives; `LoginButton`, `OpenInPhantom`.
- Produces (from `@/lib/new-deal`): `WINDOW_CHOICES` (`{ value: "1d" | "3d" | "7d" | "14d"; label; seconds }[]`), `type WindowChoice`, `DEFAULT_WINDOW = "3d"`, `DEMO_WINDOW_SECONDS = 300`, `DEMO_VALUES = { title: "Room in Vallendar", amount: "600" }`, `TITLE_MAX_BYTES = 64`, `STEP_FIELDS`, `titleBytes(title)`, `windowSeconds({ window, demo })`, `handoverWindow(moveIn, seconds): { opens; deadline }`, `interface NewDealForm { title; amount; moveIn: number; window: WindowChoice; demo: boolean }`, `validateNewDeal(form, now): { values: { title; amount: bigint; moveIn; deadline } | null; errors: Partial<Record<"title" | "amount" | "moveIn", string>> }`. `/new` redirects to `/deal/<id>?created=1` after creation.

- [ ] **Step 1: Write the failing tests `web/src/lib/new-deal.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { DEMO_WINDOW_SECONDS, handoverWindow, titleBytes, validateNewDeal, windowSeconds, type NewDealForm } from "./new-deal";

const DAY = 86_400;
const now = 1_790_000_000;
const good: NewDealForm = { title: "Room in Vallendar", amount: "600", moveIn: now + DAY, window: "3d", demo: false };

describe("validateNewDeal", () => {
  it("accepts a complete deal and computes the deadline", () => {
    const { values, errors } = validateNewDeal(good, now);
    expect(errors).toEqual({});
    expect(values).toEqual({ title: "Room in Vallendar", amount: 600_000_000n, moveIn: now + DAY, deadline: now + DAY + 3 * DAY });
  });

  it("trims the title and checks its length in bytes, like the program", () => {
    expect(validateNewDeal({ ...good, title: "  Room  " }, now).values?.title).toBe("Room");
    expect(validateNewDeal({ ...good, title: "   " }, now).errors.title).toMatch(/Describe the room/);
    expect(validateNewDeal({ ...good, title: "x".repeat(64) }, now).errors.title).toBeUndefined();
    expect(validateNewDeal({ ...good, title: "x".repeat(65) }, now).errors.title).toMatch(/64/);
    expect(validateNewDeal({ ...good, title: "ü".repeat(33) }, now).errors.title).toMatch(/64/); // 66 bytes
    expect(titleBytes("ü")).toBe(2);
  });

  it("rejects missing amounts and move-in times", () => {
    expect(validateNewDeal({ ...good, amount: "0" }, now).errors.amount).toMatch(/euros/);
    expect(validateNewDeal({ ...good, amount: "abc" }, now).values).toBeNull();
    expect(validateNewDeal({ ...good, moveIn: Number.NaN }, now).errors.moveIn).toMatch(/move-in/);
  });

  it("rejects a deadline that is already in the past", () => {
    expect(validateNewDeal({ ...good, moveIn: now - 5 * DAY }, now).errors.moveIn).toMatch(/already in the past/);
  });

  it("uses the 5-minute window in demo mode", () => {
    expect(windowSeconds({ window: "14d", demo: true })).toBe(DEMO_WINDOW_SECONDS);
    expect(windowSeconds({ window: "7d", demo: false })).toBe(7 * DAY);
    expect(validateNewDeal({ ...good, moveIn: now, demo: true }, now).values?.deadline).toBe(now + 300);
  });

  it("describes the handover window", () => {
    expect(handoverWindow(now, 3 * DAY)).toEqual({ opens: now - DAY, deadline: now + 3 * DAY });
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL with `Failed to resolve import "./new-deal"`.

- [ ] **Step 3: Write `web/src/lib/new-deal.ts`**

```ts
import { parseEur } from "./format";
import { HANDOVER_OPENS_BEFORE_MOVE_IN, MAX_HANDOVER_WINDOW } from "./rules";

export const WINDOW_CHOICES = [
  { value: "1d", label: "1 day", seconds: 86_400 },
  { value: "3d", label: "3 days", seconds: 3 * 86_400 },
  { value: "7d", label: "7 days", seconds: 7 * 86_400 },
  { value: "14d", label: "14 days", seconds: MAX_HANDOVER_WINDOW },
] as const;
export type WindowChoice = (typeof WINDOW_CHOICES)[number]["value"];

export const DEFAULT_WINDOW: WindowChoice = "3d";
export const DEMO_WINDOW_SECONDS = 300;
export const DEMO_VALUES = { title: "Room in Vallendar", amount: "600" };
export const TITLE_MAX_BYTES = 64;

export interface NewDealForm {
  title: string;
  amount: string;
  /** Unix seconds; NaN until chosen. */
  moveIn: number;
  window: WindowChoice;
  demo: boolean;
}

export interface NewDealValues {
  title: string;
  amount: bigint;
  moveIn: number;
  deadline: number;
}

export type NewDealField = "title" | "amount" | "moveIn";
export type NewDealErrors = Partial<Record<NewDealField, string>>;

/** The fields checked before leaving each step. */
export const STEP_FIELDS: Record<1 | 2, NewDealField[]> = { 1: ["title", "amount"], 2: ["moveIn"] };

export const titleBytes = (title: string) => new TextEncoder().encode(title.trim()).length;

export function windowSeconds(form: Pick<NewDealForm, "window" | "demo">): number {
  if (form.demo) return DEMO_WINDOW_SECONDS;
  return WINDOW_CHOICES.find((choice) => choice.value === form.window)?.seconds ?? WINDOW_CHOICES[1].seconds;
}

export function handoverWindow(moveIn: number, seconds: number): { opens: number; deadline: number } {
  return { opens: moveIn - HANDOVER_OPENS_BEFORE_MOVE_IN, deadline: moveIn + seconds };
}

/** Mirrors create_deal's checks (title ≤ 64 bytes, amount > 0, deadline in the future), so the wallet never signs a deal the program rejects. */
export function validateNewDeal(form: NewDealForm, now: number): { values: NewDealValues | null; errors: NewDealErrors } {
  const errors: NewDealErrors = {};
  const title = form.title.trim();
  const bytes = titleBytes(title);
  if (bytes === 0) errors.title = "Describe the room, for example “Room in Vallendar”.";
  else if (bytes > TITLE_MAX_BYTES) errors.title = "That's too long: keep it under 64 characters.";

  const amount = parseEur(form.amount);
  if (amount === null) errors.amount = "Enter the deposit in euros, for example 600 or 600.50.";

  let deadline = Number.NaN;
  if (!Number.isFinite(form.moveIn)) {
    errors.moveIn = "Pick the move-in date and time.";
  } else {
    deadline = form.moveIn + windowSeconds(form);
    if (deadline <= now) errors.moveIn = "That handover deadline is already in the past. Pick a later move-in or a longer window.";
  }

  if (errors.title || errors.amount || errors.moveIn || amount === null) return { values: null, errors };
  return { values: { title, amount, moveIn: form.moveIn, deadline }, errors };
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write `web/src/app/(app)/new/CreateDealFlow.tsx`**

```tsx
"use client";

import { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Timetable } from "@/components/ui/Timetable";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { cx } from "@/lib/cx";
import { formatEur, formatShortDateTime, toLocalInputValue } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { createDealIx, randomDealId } from "@/lib/instructions";
import {
  DEFAULT_WINDOW,
  DEMO_VALUES,
  handoverWindow,
  STEP_FIELDS,
  TITLE_MAX_BYTES,
  titleBytes,
  validateNewDeal,
  WINDOW_CHOICES,
  windowSeconds,
  type NewDealField,
  type WindowChoice,
} from "@/lib/new-deal";
import { getProgram } from "@/lib/program";
import { friendlyError, signAndSend } from "@/lib/send";

type Step = 1 | 2 | 3;
const STEP_TITLES: Record<Step, string> = { 1: "The room", 2: "The handover", 3: "Check and create" };
const ALL_FIELDS: NewDealField[] = ["title", "amount", "moveIn"];

export function CreateDealFlow() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const program = useMemo(() => getProgram(connection), [connection]);
  const now = useNow();
  const [step, setStep] = useState<Step>(1);
  const [checked, setChecked] = useState<NewDealField[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [moveInText, setMoveInText] = useState("");
  const [windowChoice, setWindowChoice] = useState<WindowChoice>(DEFAULT_WINDOW);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // datetime-local values have no zone, so Date.parse reads them in the viewer's time zone.
  const moveIn = moveInText ? Math.floor(Date.parse(moveInText) / 1000) : Number.NaN;
  const form = { title, amount, moveIn, window: windowChoice, demo };
  const { values, errors } = validateNewDeal(form, now);
  const shown = (field: NewDealField) => (checked.includes(field) ? errors[field] : undefined);
  const handover = Number.isFinite(moveIn) ? handoverWindow(moveIn, windowSeconds(form)) : null;
  const remaining = TITLE_MAX_BYTES - titleBytes(title);

  function goNext() {
    if (step === 3) return;
    const fields = STEP_FIELDS[step];
    setChecked((previous) => [...new Set([...previous, ...fields])]);
    if (fields.some((field) => errors[field])) return;
    setStep(step === 1 ? 2 : 3);
  }

  function fillDemoValues() {
    setTitle(DEMO_VALUES.title);
    setAmount(DEMO_VALUES.amount);
    setMoveInText(toLocalInputValue(new Date()));
    setDemo(true);
    setChecked(ALL_FIELDS);
    setStep(3);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    setChecked(ALL_FIELDS);
    if (!values || !wallet.publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const { ix, address } = await createDealIx(program, wallet.publicKey, {
        dealId: randomDealId(),
        amount: new BN(values.amount.toString()),
        moveIn: new BN(values.moveIn),
        deadline: new BN(values.deadline),
        title: values.title,
      });
      await signAndSend(connection, wallet, [ix]);
      router.push(`/deal/${address.toBase58()}?created=1`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-app px-4 py-8 sm:py-12">
      <p className="label text-fg-muted">Create a deposit link · Step {step} of 3</p>
      <div aria-hidden="true" className="mt-3 grid grid-cols-3 gap-1.5">
        {([1, 2, 3] as Step[]).map((n) => (
          <span key={n} className={cx("h-1.5 rounded-full", n <= step ? "bg-inverse" : "bg-rule")} />
        ))}
      </div>
      <h1 className="mt-6 font-display text-title font-bold">{STEP_TITLES[step]}</h1>

      <form onSubmit={submit} noValidate className="mt-6 space-y-6">
        {step === 1 && (
          <>
            <p className="text-body text-fg-muted">
              For landlords. Your tenant pays into a lock; you receive the money when they scan your code at the key handover.
            </p>
            <TextField
              id="title"
              label="Room"
              hint="Your tenant sees this, for example “Room in Vallendar, 14 m²”."
              counter={`${Math.max(remaining, 0)} left`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={shown("title")}
              autoComplete="off"
            />
            <TextField
              id="amount"
              label="Deposit in euros"
              hint="The exact amount your tenant pays into the lock."
              inputMode="decimal"
              placeholder="600"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              error={shown("amount")}
              autoComplete="off"
            />
            <Callout tone="neutral">
              Just trying Keysfirst?{" "}
              <button type="button" onClick={fillDemoValues} className="font-semibold underline underline-offset-2">
                Use demo values
              </button>{" "}
              (Room in Vallendar, €600, move-in now, 5-minute window).
            </Callout>
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              id="move-in"
              type="datetime-local"
              label="Move-in"
              hint="When your tenant gets the keys, in your time zone."
              value={moveInText}
              onChange={(event) => setMoveInText(event.target.value)}
              error={shown("moveIn")}
              trailing={
                <Button variant="secondary" onClick={() => setMoveInText(toLocalInputValue(new Date()))}>
                  Now
                </Button>
              }
            />
            <Segmented
              name="window"
              legend="Latest handover (after move-in)"
              value={windowChoice}
              onChange={setWindowChoice}
              disabled={demo}
              options={WINDOW_CHOICES.map((choice) => ({
                value: choice.value,
                label: choice.label,
                hint: choice.value === DEFAULT_WINDOW ? "Recommended" : undefined,
              }))}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-dashed border-field p-4">
              <input
                type="checkbox"
                checked={demo}
                onChange={(event) => setDemo(event.target.checked)}
                className="mt-1 size-5 shrink-0 accent-[var(--k-ink)]"
              />
              <span>
                <span className="font-semibold">Demo: 5-minute window</span>{" "}
                <span className="ml-1 rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold">For trying it out</span>
                <span className="mt-1 block text-sm text-fg-muted">
                  The deposit goes back to the tenant 5 minutes after move-in if there&apos;s no handover. Not for a real room.
                </span>
              </span>
            </label>
            {handover && (
              <Callout tone="info" title="Handover window">
                From {formatShortDateTime(handover.opens)} (24 hours before move-in) until {formatShortDateTime(handover.deadline)}. If
                there&apos;s no handover by then, the deposit goes back to the tenant.
              </Callout>
            )}
          </>
        )}

        {step === 3 && (
          <>
            {values && handover ? (
              <Timetable
                title="Your tenant will see"
                aside={values.title}
                footer="Creating the link costs a tiny network fee in test SOL."
                rows={[
                  {
                    key: "pay",
                    time: `By ${formatShortDateTime(handover.deadline)}`,
                    title: `Pay ${formatEur(values.amount)} into the lock`,
                    detail: "The exact amount, from the tenant's own wallet.",
                    state: "now",
                  },
                  {
                    key: "handover",
                    time: formatShortDateTime(handover.opens),
                    title: "Key handover",
                    detail: `Until ${formatShortDateTime(handover.deadline)}. Your tenant scans your code and the money goes to you.`,
                    state: "next",
                  },
                  {
                    key: "back",
                    time: formatShortDateTime(handover.deadline),
                    title: "No handover by then?",
                    detail: "The deposit goes back to the tenant.",
                    state: "later",
                  },
                ]}
              />
            ) : (
              <Callout tone="danger" role="alert" title="Something needs fixing">
                {Object.values(errors).join(" ")} Use Back to correct it.
              </Callout>
            )}
            {error && (
              <Callout tone="danger" role="alert">
                {error}
              </Callout>
            )}
          </>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:items-start sm:justify-between">
          {step > 1 ? (
            <Button variant="secondary" disabled={busy} onClick={() => setStep(step === 3 ? 2 : 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="submit">Next</Button>
          ) : wallet.publicKey ? (
            <Button type="submit" size="lg" loading={busy} loadingText="Waiting for your wallet…" disabled={!values}>
              Create deposit link
            </Button>
          ) : (
            <div className="space-y-3 sm:w-80">
              <LoginButton label="Log in to create" variant="primary" size="lg" fullWidth />
              <OpenInPhantom />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Replace `web/src/app/(app)/new/page.tsx`**

```tsx
import type { Metadata } from "next";
import { CreateDealFlow } from "./CreateDealFlow";

export const metadata: Metadata = {
  title: "Create a deposit link",
  description: "Lock your tenant's deposit until the key handover. You're paid the moment they scan your code at the door.",
};

export default function NewDealPage() {
  return <CreateDealFlow />;
}
```

- [ ] **Step 7: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → `/new` is `○ (Static)`.
Browser at 375 and 1280 px (logged out is fine for steps 1–2):
- Step 1 → Next with empty fields shows both field errors (red border, message, alert icon) and stays; valid values move to step 2. The counter counts down; pressing Enter in a field acts like Next.
- Step 2: "Now" fills the move-in; the window choice updates the "Handover window" callout; ticking "Demo" disables the choice and shows a 5-minute window.
- Step 3: the timetable preview; logged out, "Log in to create" opens the connect sheet.
- "Use demo values" jumps to step 3 with Room in Vallendar, €600.00 and a 5-minute window.
- No console errors, no horizontal scroll.
Creating a real deal needs Phantom: done in Task 20's regression (it must land on `/deal/<id>?created=1` with the "link is ready" callout and the share box).

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/new-deal.ts web/src/lib/new-deal.test.ts "web/src/app/(app)/new"
git commit -m "feat(web): three-step create flow with preview, demo values and program-matching validation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: My deals (on-chain only)

**Files:**
- Create: `web/src/lib/dashboard.ts`, `web/src/lib/dashboard.test.ts`
- Create: `web/src/lib/use-my-deals.ts`
- Create: `web/src/components/deal/DealCard.tsx`
- Create: `web/src/app/(app)/deals/page.tsx`, `web/src/app/(app)/deals/MyDeals.tsx`
- Create: `web/src/app/(app)/dev/deals/page.tsx`, `web/src/app/(app)/dev/deals/DealsGallery.tsx`

**Interfaces:**
- Consumes: `DealData`, `dealPhase` (Task 5), `toDealData` (Task 5), `getProgram`, `friendlyError`, `formatCountdown`, `formatShortDateTime`, `formatEur`, `handoverOpensAt`, `MAX_LOCK_DURATION`, UI primitives, `LoginButton`, `OpenInPhantom`.
- Produces (from `@/lib/dashboard`): `type DealRole = "landlord" | "tenant"`, `interface DealSummary extends DealData { address: string; role: DealRole }`, `type DealFilter = "all" | "letting" | "renting"`, `type Urgency = "now" | "waiting" | "done"`, `toSummary(address, data, wallet): DealSummary | null`, `mergeDeals(...lists: DealSummary[][]): DealSummary[]`, `urgencyOf(deal, now): Urgency`, `nextActionText(deal, now): string`, `countdownLine(deal, now): string`, `sortDeals(deals, now)`, `filterDeals(deals, filter)`, `countByFilter(deals): Record<DealFilter, number>`. From `@/lib/use-my-deals`: `useMyDeals(): { state: MyDealsState; refresh: () => void; wallet: string | null }` with `type MyDealsState = { status: "idle" } | { status: "loading" } | { status: "ready"; deals: DealSummary[] } | { status: "error"; message: string }`. `DealCard({ deal: DealSummary; now: number })`.

- [ ] **Step 1: Write the failing tests `web/src/lib/dashboard.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  countByFilter,
  countdownLine,
  filterDeals,
  mergeDeals,
  nextActionText,
  sortDeals,
  toSummary,
  urgencyOf,
  type DealSummary,
} from "./dashboard";
import type { DealData } from "./deal-view";

const DAY = 86_400;
const now = Date.UTC(2026, 8, 29, 12, 0) / 1000; // Tue 29 Sep, 12:00 (tests run in UTC)
const ME = "Me111111111111111111111111111111111111111111";
const OTHER = "0ther1111111111111111111111111111111111111111";
const EMPTY = "11111111111111111111111111111111";

function deal(overrides: Partial<DealData>): DealData {
  return {
    landlord: ME,
    tenant: EMPTY,
    title: "Room",
    amount: "600000000",
    status: "open",
    moveIn: now + 5 * DAY,
    deadline: now + 8 * DAY,
    createdAt: now - DAY,
    fundedAt: 0,
    settledAt: 0,
    ...overrides,
  };
}

function summary(address: string, overrides: Partial<DealData>): DealSummary {
  const s = toSummary(address, deal(overrides), ME);
  if (!s) throw new Error("not my deal");
  return s;
}

const renting = (overrides: Partial<DealData>) =>
  summary("R", { landlord: OTHER, tenant: ME, status: "funded", fundedAt: now - DAY, ...overrides });

describe("toSummary", () => {
  it("detects my role from the wallet", () => {
    expect(toSummary("A", deal({}), ME)?.role).toBe("landlord");
    expect(toSummary("B", deal({ landlord: OTHER, tenant: ME, status: "funded" }), ME)?.role).toBe("tenant");
    expect(toSummary("C", deal({ landlord: OTHER }), ME)).toBeNull();
  });
});

describe("urgency, next action and countdown", () => {
  it("puts open handover windows, expired deposits and dead links first", () => {
    expect(urgencyOf(renting({ moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe("now");
    expect(urgencyOf(renting({ moveIn: now - 5 * DAY, deadline: now - DAY }), now)).toBe("now");
    expect(urgencyOf(summary("X", { moveIn: now - DAY, deadline: now - 60 }), now)).toBe("now");
    expect(urgencyOf(summary("O", {}), now)).toBe("waiting");
    expect(urgencyOf(renting({ status: "released", settledAt: now - DAY }), now)).toBe("done");
  });

  it("says what to do next, per role", () => {
    expect(nextActionText(renting({ moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe("At the door: scan the landlord's code");
    expect(nextActionText(summary("L", { status: "funded", tenant: OTHER, moveIn: now + 3600, deadline: now + 3 * DAY }), now)).toBe(
      "Start the handover when you meet",
    );
    expect(nextActionText(renting({ moveIn: now - 5 * DAY, deadline: now - DAY }), now)).toBe("Take the deposit back");
    expect(nextActionText(summary("O", {}), now)).toBe("Waiting for the tenant to pay");
  });

  it("counts down to the next moment", () => {
    expect(countdownLine(renting({ moveIn: now + 2 * DAY, deadline: now + 5 * DAY }), now)).toBe("Handover opens in 1 day");
    expect(countdownLine(summary("O", {}), now)).toBe("Payment closes in 8 days");
    expect(countdownLine(renting({ status: "released", settledAt: Date.UTC(2026, 9, 1, 14, 7) / 1000 }), now)).toBe("Released Thu 1 Oct, 14:07");
  });
});

describe("sorting and filtering", () => {
  const list = [
    summary("done", { status: "cancelled", settledAt: now - 3 * DAY }),
    summary("waitLater", { moveIn: now + 7 * DAY, deadline: now + 10 * DAY }),
    summary("act", { status: "funded", tenant: OTHER, moveIn: now + 3600, deadline: now + 3 * DAY }),
    summary("waitSoon", { moveIn: now + DAY, deadline: now + 2 * DAY }),
    summary("renting", { landlord: OTHER, tenant: ME, status: "released", settledAt: now - DAY }),
  ];

  it("orders by what needs me now, then the soonest milestone, then the newest settled", () => {
    expect(sortDeals(list, now).map((d) => d.address)).toEqual(["act", "waitSoon", "waitLater", "renting", "done"]);
  });

  it("filters and counts by role", () => {
    expect(filterDeals(list, "renting").map((d) => d.address)).toEqual(["renting"]);
    expect(filterDeals(list, "letting")).toHaveLength(4);
    expect(countByFilter(list)).toEqual({ all: 5, letting: 4, renting: 1 });
  });

  it("merges both lookups without duplicates", () => {
    expect(mergeDeals([list[0], list[1]], [list[1], list[4]]).map((d) => d.address)).toEqual(["done", "waitLater", "renting"]);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL with `Failed to resolve import "./dashboard"`.

- [ ] **Step 3: Write `web/src/lib/dashboard.ts`**

```ts
import { dealPhase, type DealData } from "./deal-view";
import { formatCountdown, formatShortDateTime } from "./format";
import { handoverOpensAt, MAX_LOCK_DURATION } from "./rules";

export type DealRole = "landlord" | "tenant";
export interface DealSummary extends DealData {
  address: string;
  role: DealRole;
}
export type DealFilter = "all" | "letting" | "renting";
export type Urgency = "now" | "waiting" | "done";

export function toSummary(address: string, data: DealData, wallet: string): DealSummary | null {
  if (data.landlord === wallet) return { ...data, address, role: "landlord" };
  if (data.tenant === wallet) return { ...data, address, role: "tenant" };
  return null;
}

/** The landlord and tenant lookups can overlap only in theory; keep the first copy of each deal. */
export function mergeDeals(...lists: DealSummary[][]): DealSummary[] {
  const byAddress = new Map<string, DealSummary>();
  for (const d of lists.flat()) if (!byAddress.has(d.address)) byAddress.set(d.address, d);
  return [...byAddress.values()];
}

const phaseOf = (d: DealSummary, now: number) => dealPhase(d.status, { moveIn: d.moveIn, deadline: d.deadline }, now);

export function urgencyOf(d: DealSummary, now: number): Urgency {
  switch (phaseOf(d, now)) {
    case "funded-window":
    case "funded-expired":
      return "now";
    case "open-expired":
      return d.role === "landlord" ? "now" : "done";
    case "open":
    case "open-too-early":
    case "funded-before":
      return "waiting";
    default:
      return "done";
  }
}

export function nextActionText(d: DealSummary, now: number): string {
  const landlord = d.role === "landlord";
  switch (phaseOf(d, now)) {
    case "open":
      return "Waiting for the tenant to pay";
    case "open-too-early":
      return "Waiting until the tenant can pay";
    case "open-expired":
      return "Nobody paid: cancel the deal";
    case "funded-before":
      return landlord ? "Waiting for the handover" : "Get ready for the handover";
    case "funded-window":
      return landlord ? "Start the handover when you meet" : "At the door: scan the landlord's code";
    case "funded-expired":
      return landlord ? "Give the deposit back" : "Take the deposit back";
    case "released":
      return landlord ? "Deposit received" : "Deposit paid to the landlord";
    case "refunded":
      return landlord ? "Deposit returned to the tenant" : "Deposit back with you";
    case "cancelled":
      return "Deal cancelled";
  }
}

export function countdownLine(d: DealSummary, now: number): string {
  switch (phaseOf(d, now)) {
    case "open":
      return `Payment closes in ${formatCountdown(d.deadline - now)}`;
    case "open-too-early":
      return `Payment opens ${formatShortDateTime(d.deadline - MAX_LOCK_DURATION)}`;
    case "open-expired":
      return `Payment closed ${formatShortDateTime(d.deadline)}`;
    case "funded-before":
      return `Handover opens in ${formatCountdown(handoverOpensAt(d) - now)}`;
    case "funded-window":
      return `Handover deadline in ${formatCountdown(d.deadline - now)}`;
    case "funded-expired":
      return `Deadline passed ${formatShortDateTime(d.deadline)}`;
    case "released":
      return `Released ${formatShortDateTime(d.settledAt)}`;
    case "refunded":
      return `Returned ${formatShortDateTime(d.settledAt)}`;
    case "cancelled":
      return `Cancelled ${formatShortDateTime(d.settledAt)}`;
  }
}

const URGENCY_ORDER: Record<Urgency, number> = { now: 0, waiting: 1, done: 2 };

function nextMilestone(d: DealSummary, now: number): number {
  const phase = phaseOf(d, now);
  if (phase === "funded-before") return handoverOpensAt(d);
  if (phase === "open-too-early") return d.deadline - MAX_LOCK_DURATION;
  return d.deadline;
}

/** Needs you now (soonest deadline first), then waiting (soonest milestone first), then done (newest first). */
export function sortDeals(deals: DealSummary[], now: number): DealSummary[] {
  return [...deals].sort((a, b) => {
    const ua = urgencyOf(a, now);
    const ub = urgencyOf(b, now);
    if (ua !== ub) return URGENCY_ORDER[ua] - URGENCY_ORDER[ub];
    if (ua === "done") return (b.settledAt || b.createdAt) - (a.settledAt || a.createdAt);
    return nextMilestone(a, now) - nextMilestone(b, now);
  });
}

export function filterDeals(deals: DealSummary[], filter: DealFilter): DealSummary[] {
  if (filter === "all") return deals;
  const role: DealRole = filter === "letting" ? "landlord" : "tenant";
  return deals.filter((d) => d.role === role);
}

export function countByFilter(deals: DealSummary[]): Record<DealFilter, number> {
  const letting = deals.filter((d) => d.role === "landlord").length;
  return { all: deals.length, letting, renting: deals.length - letting };
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write `web/src/lib/use-my-deals.ts`**

```ts
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeDeals, toSummary, type DealSummary } from "./dashboard";
import { toDealData } from "./deal-data";
import { getProgram } from "./program";
import { friendlyError } from "./send";

// Deal account layout: 8-byte discriminator, then landlord (32 bytes), then tenant (32 bytes).
const LANDLORD_OFFSET = 8;
const TENANT_OFFSET = 40;
// Two account lookups per refresh are heavier than the deal page's poll: refresh on demand, never on a timer.
const MIN_REFRESH_GAP_MS = 15_000;

export type MyDealsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; deals: DealSummary[] }
  | { status: "error"; message: string };

type Stored = MyDealsState & { wallet: string | null };

/** The connected wallet's deals as landlord and as tenant, read straight from Solana (no database). */
export function useMyDeals(): { state: MyDealsState; refresh: () => void; wallet: string | null } {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useMemo(() => getProgram(connection), [connection]);
  const wallet = publicKey?.toBase58() ?? null;
  const [stored, setStored] = useState<Stored>({ status: "idle", wallet: null });
  const lastFetch = useRef(0);

  const load = useCallback(async () => {
    if (!wallet) return;
    lastFetch.current = Date.now();
    setStored((previous) => (previous.status === "ready" && previous.wallet === wallet ? previous : { status: "loading", wallet }));
    try {
      const [asLandlord, asTenant] = await Promise.all([
        program.account.deal.all([{ memcmp: { offset: LANDLORD_OFFSET, bytes: wallet } }]),
        program.account.deal.all([{ memcmp: { offset: TENANT_OFFSET, bytes: wallet } }]),
      ]);
      const summaries = [...asLandlord, ...asTenant]
        .map((item) => toSummary(item.publicKey.toBase58(), toDealData(item.account), wallet))
        .filter((d): d is DealSummary => d !== null);
      setStored({ status: "ready", deals: mergeDeals(summaries), wallet });
    } catch (e) {
      setStored({ status: "error", message: friendlyError(e), wallet });
    }
  }, [program, wallet]);

  useEffect(() => {
    if (!wallet) return;
    const first = setTimeout(() => void load(), 0);
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastFetch.current > MIN_REFRESH_GAP_MS) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, wallet]);

  const state: MyDealsState = !wallet ? { status: "idle" } : stored.wallet === wallet ? stored : { status: "loading" };
  return { state, refresh: () => void load(), wallet };
}
```

- [ ] **Step 6: Write `web/src/components/deal/DealCard.tsx`**

```tsx
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { countdownLine, nextActionText, type DealSummary } from "@/lib/dashboard";
import { formatEur } from "@/lib/format";

/** One deal on My deals. The whole card is one link. */
export function DealCard({ deal, now }: { deal: DealSummary; now: number }) {
  return (
    <Link
      href={`/deal/${deal.address}`}
      className="group block rounded-lg border-[1.5px] border-rule bg-canvas p-4 transition-colors duration-150 hover:border-fg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-fg-muted">{deal.role === "landlord" ? "You're letting" : "You're renting"}</p>
          <p className="mt-1.5 truncate font-display text-card font-bold">{deal.title}</p>
        </div>
        <p className="shrink-0 font-display text-card font-bold tabular-nums">{formatEur(deal.amount)}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={deal.status} size="sm" />
        <span className="text-sm text-fg-muted tabular-nums">{countdownLine(deal, now)}</span>
      </div>
      <p className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3 font-semibold">
        {nextActionText(deal, now)}
        <Icon name="arrow-right" size={18} className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
```

- [ ] **Step 7: Write the page**

`web/src/app/(app)/deals/page.tsx`:

```tsx
import type { Metadata } from "next";
import { MyDeals } from "./MyDeals";

export const metadata: Metadata = {
  title: "My deals",
  description: "Your deposit links as landlord and as tenant, read straight from Solana.",
  robots: { index: false },
};

export default function MyDealsPage() {
  return <MyDeals />;
}
```

`web/src/app/(app)/deals/MyDeals.tsx`:

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, type ReactNode } from "react";
import { DealCard } from "@/components/deal/DealCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { countByFilter, filterDeals, sortDeals, urgencyOf, type DealFilter, type DealSummary, type Urgency } from "@/lib/dashboard";
import { useMounted, useNow } from "@/lib/hooks";
import { useMyDeals } from "@/lib/use-my-deals";

const GROUPS: Array<{ urgency: Urgency; title: string }> = [
  { urgency: "now", title: "Needs you now" },
  { urgency: "waiting", title: "Waiting" },
  { urgency: "done", title: "Done" },
];

function Cards() {
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-busy="true">
      <p role="status" className="sr-only">
        Loading your deals…
      </p>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function DealList({ deals, now }: { deals: DealSummary[]; now: number }) {
  const [filter, setFilter] = useState<DealFilter>("all");
  const counts = countByFilter(deals);
  const visible = sortDeals(filterDeals(deals, filter), now);
  return (
    <>
      <Segmented
        name="filter"
        legend="Show"
        hideLegend
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All (${counts.all})` },
          { value: "letting", label: `Letting (${counts.letting})` },
          { value: "renting", label: `Renting (${counts.renting})` },
        ]}
      />
      {GROUPS.map(({ urgency, title }) => {
        const items = visible.filter((d) => urgencyOf(d, now) === urgency);
        if (items.length === 0) return null;
        return (
          <section key={urgency} aria-labelledby={`group-${urgency}`} className="mt-8">
            <h2 id={`group-${urgency}`} className="label text-fg-muted">
              {title} · {items.length}
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {items.map((deal) => (
                <li key={deal.address}>
                  <DealCard deal={deal} now={now} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {visible.length === 0 && <p className="mt-6 text-fg-muted">No deals in this view.</p>}
    </>
  );
}

export function MyDeals() {
  const mounted = useMounted();
  const now = useNow();
  const { wallet: selected, connecting, connected } = useWallet();
  const { state, refresh, wallet } = useMyDeals();
  // A returning visitor reconnects automatically: show the skeleton, not "Log in", while that happens.
  const waitingForWallet = !mounted || now === 0 || connecting || (selected !== null && !connected);

  let content: ReactNode;
  if (waitingForWallet) {
    content = <Cards />;
  } else if (!wallet) {
    content = (
      <div className="space-y-4">
        <EmptyState pictogram="phone-wallet" title="Log in to see your deals" action={<LoginButton variant="primary" size="lg" />}>
          Your deals are read straight from Solana: the ones you created as a landlord and the ones you paid as a tenant.
        </EmptyState>
        <OpenInPhantom />
      </div>
    );
  } else if (state.status === "error") {
    content = (
      <Callout tone="danger" role="alert" title="Couldn't load your deals">
        <p>{state.message}</p>
        <Button className="mt-3" variant="secondary" onClick={refresh}>
          Try again
        </Button>
      </Callout>
    );
  } else if (state.status !== "ready") {
    content = <Cards />;
  } else if (state.deals.length === 0) {
    content = (
      <EmptyState
        pictogram="laptop-wallet"
        title="No deals yet"
        action={<ButtonLink href="/new">Create a deposit link</ButtonLink>}
      >
        Letting a room? Create a deposit link. Renting? Your deal appears here as soon as you pay the landlord&apos;s link.
      </EmptyState>
    );
  } else {
    content = <DealList deals={state.deals} now={now} />;
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-fg-muted">Your deposits</p>
          <h1 className="mt-2 font-display text-title font-bold">My deals</h1>
        </div>
        {wallet && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={refresh} disabled={state.status === "loading"}>
              <Icon name="refresh" size={18} />
              Refresh
            </Button>
            <ButtonLink href="/new">Create a deal</ButtonLink>
          </div>
        )}
      </div>
      <div className="mt-8">{content}</div>
    </div>
  );
}
```

- [ ] **Step 8: Write the dashboard gallery**

`web/src/app/(app)/dev/deals/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsGallery } from "./DealsGallery";

export const metadata: Metadata = { title: "My deals gallery (development)", robots: { index: false } };

export default function DealsGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DealsGallery />;
}
```

`web/src/app/(app)/dev/deals/DealsGallery.tsx`:

```tsx
"use client";

import { DealList } from "@/app/(app)/deals/MyDeals";
import type { DealSummary } from "@/lib/dashboard";

const DAY = 86_400;
const NOW = Date.UTC(2026, 8, 29, 12, 0) / 1000;
const base = {
  landlord: "LandLord111111111111111111111111111111111111",
  tenant: "TenAnt11111111111111111111111111111111111111",
  amount: "600000000",
  createdAt: NOW - 2 * DAY,
  fundedAt: NOW - DAY,
  settledAt: 0,
};
const DEALS: DealSummary[] = [
  { ...base, address: "a1", role: "landlord", title: "Room in Vallendar", status: "funded", moveIn: NOW + 3600, deadline: NOW + 3 * DAY },
  { ...base, address: "a2", role: "tenant", title: "WG room in Koblenz, 16 m²", status: "funded", moveIn: NOW + 3 * DAY, deadline: NOW + 6 * DAY },
  { ...base, address: "a3", role: "landlord", title: "Studio near campus", status: "open", fundedAt: 0, moveIn: NOW + 10 * DAY, deadline: NOW + 13 * DAY },
  { ...base, address: "a4", role: "tenant", title: "Room in Bendorf", status: "funded", moveIn: NOW - 6 * DAY, deadline: NOW - DAY },
  { ...base, address: "a5", role: "landlord", title: "Sublet for the winter semester", status: "released", moveIn: NOW - 3 * DAY, deadline: NOW, settledAt: NOW - 3 * DAY + 420 },
  { ...base, address: "a6", role: "tenant", title: "Room that didn't exist", status: "refunded", moveIn: NOW - 9 * DAY, deadline: NOW - 6 * DAY, settledAt: NOW - 6 * DAY + 60 },
];

export function DealsGallery() {
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-6 font-display text-section font-bold">My deals gallery</h1>
      <DealList deals={DEALS} now={NOW} />
    </div>
  );
}
```

- [ ] **Step 9: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → succeeds.
Browser at 375 and 1280 px:
- `/dev/deals`: groups "Needs you now · 2" (a1, a4), "Waiting · 2" (a2, a3), "Done · 2" (a5, a6); filters show the right counts; cards are one link each; one column at 375 px, two at 1280 px.
- `/deals` logged out: skeleton, then "Log in to see your deals"; `/deals?login=1` opens the connect sheet.
- Logged in (Task 20 with Phantom): the user's real deals appear with the right role; Network shows two `getProgramAccounts` calls per load, none while idle, and a new pair when coming back to the tab after 15 s.
- No console errors, no horizontal scroll.

- [ ] **Step 10: Commit and close milestone M3**

```bash
git add web/src/lib/dashboard.ts web/src/lib/dashboard.test.ts web/src/lib/use-my-deals.ts web/src/components/deal/DealCard.tsx "web/src/app/(app)/deals" "web/src/app/(app)/dev/deals"
git commit -m "feat(web): My deals from on-chain data with urgency groups, filters and countdowns" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Report M3: works / doesn't / next.

---

### Task 11: Content data, marketing blocks and the landing page

**Files:**
- Create: `web/src/content/scenarios.ts`, `web/src/content/faq.ts`
- Create: `web/src/components/marketing/{SectionHeader,RulesTimetable,StepList,ProblemSteps,AudienceSplit,ScenarioGrid,WhySolana,FaqList,CtaBand,AskLandlord}.tsx`
- Modify (replace): `web/src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: UI primitives, `Pictogram`, `Icon`, `whatsappUrl`, `explorerAddress`, `useMounted`, `PRODUCTION_URL`, `idl.address`.
- Produces:
  - `interface Scenario { id; question; answer; rule; audience: "tenant" | "landlord" | "both"; pictogram: PictogramName }`, `SCENARIOS: Scenario[]`, `LANDING_SCENARIO_IDS: string[]`, `scenariosFor(audience: "tenant" | "landlord"): Scenario[]` from `@/content/scenarios`.
  - `interface FaqEntry { id; question; answer: string[]; link?: { href; label } }`, `interface FaqGroup { id; title; entries: FaqEntry[] }`, `FAQ: FaqGroup[]`, `LANDING_FAQ_IDS: string[]`, `faqEntries(ids: string[]): FaqEntry[]` from `@/content/faq`.
  - `SectionHeader({ id; eyebrow?; title; lead?; align? })`, `RulesTimetable()`, `StepList({ steps: Step[] })` with `interface Step { pictogram: PictogramName; title: string; text: string }`, `ProblemSteps()`, `AudienceSplit()`, `ScenarioGrid({ scenarios })`, `WhySolana()`, `FaqList({ entries })`, `CtaBand()`, `AskLandlord({ tone?: "light" | "dark" })`.

- [ ] **Step 1: Write `web/src/content/scenarios.ts`**

```ts
import type { PictogramName } from "@/components/brand/Pictogram";

export interface Scenario {
  id: string;
  question: string;
  answer: string;
  rule: string;
  audience: "tenant" | "landlord" | "both";
  pictogram: PictogramName;
}

// Every answer follows the program's rules (product spec §6) and its known limits (§10).
export const SCENARIOS: Scenario[] = [
  {
    id: "fake-landlord",
    question: "What if the landlord is fake?",
    answer: "Nobody can hand you real keys, so you never scan and the fake landlord is never paid. After the deadline the deposit comes back to you.",
    rule: "Only the tenant's approval at the handover pays the landlord.",
    audience: "tenant",
    pictogram: "fake-listing",
  },
  {
    id: "not-as-described",
    question: "What if the room isn't as described?",
    answer: "Don't scan. Ask the landlord to give the deposit back, which they can do at any time, or wait for the deadline and it returns to you.",
    rule: "No scan, no payment. The landlord can always give it back.",
    audience: "tenant",
    pictogram: "scan-at-door",
  },
  {
    id: "cant-travel",
    question: "What if I can't travel?",
    answer: "The deposit stays in the lock and comes back to you after the deadline. The landlord can also give it back earlier.",
    rule: "After the deadline anyone can send the deposit back to the tenant.",
    audience: "tenant",
    pictogram: "back-to-you",
  },
  {
    id: "no-show",
    question: "What if the tenant never shows up?",
    answer: "The deposit goes back to them after the deadline. You lose the time the room was reserved, not money.",
    rule: "The clock returns the deposit; nobody has to decide.",
    audience: "landlord",
    pictogram: "deadline",
  },
  {
    id: "scan-early",
    question: "What if someone asks me to scan before I arrive?",
    answer: "Don't. Scanning pays the landlord. Only scan standing in the room with the keys; the handover can't even start earlier than 24 hours before move-in.",
    rule: "The release only works from 24 hours before move-in until the deadline.",
    audience: "tenant",
    pictogram: "phone-wallet",
  },
  {
    id: "wrong-wallet",
    question: "What if I scan with the wrong wallet?",
    answer: "Nothing moves. Phantom can't load the request; switch to the wallet that paid and scan again.",
    rule: "Only the tenant who paid can confirm the handover.",
    audience: "tenant",
    pictogram: "keys-change-hands",
  },
  {
    id: "keys-kept",
    question: "What if the landlord takes the money and keeps the keys?",
    answer: "At the door you scan first, so this is possible. It would be theft by a known person at a real address, which is far rarer than an anonymous online scam and easier to act on.",
    rule: "Keysfirst can't see the physical world. This is a known limit.",
    audience: "both",
    pictogram: "landlord",
  },
  {
    id: "changed-mind",
    question: "What if the landlord wants to call it off?",
    answer: "Before anyone pays, the landlord can cancel the deal. After payment, they can give the deposit back at any time.",
    rule: "The landlord can cancel an unpaid deal or give the deposit back.",
    audience: "landlord",
    pictogram: "back-to-you",
  },
];

export const LANDING_SCENARIO_IDS = ["fake-landlord", "not-as-described", "cant-travel", "no-show", "scan-early", "wrong-wallet"];

export function scenariosFor(audience: "tenant" | "landlord"): Scenario[] {
  return SCENARIOS.filter((s) => s.audience === audience || s.audience === "both");
}
```

- [ ] **Step 2: Write `web/src/content/faq.ts`**

```ts
export interface FaqEntry {
  id: string;
  question: string;
  answer: string[];
  link?: { href: string; label: string };
}

export interface FaqGroup {
  id: string;
  title: string;
  entries: FaqEntry[];
}

// Legal statements: only §551 BGB exactly as written here. Honest caveats stay in (brand guidelines §8).
export const FAQ: FaqGroup[] = [
  {
    id: "basics",
    title: "Basics",
    entries: [
      {
        id: "what-is",
        question: "What is Keysfirst?",
        answer: [
          "A deposit link for renting a room. The tenant pays the deposit into a lock. The landlord receives it only when the tenant scans the landlord's code at the key handover. If that never happens, the money goes back to the tenant after the deadline.",
        ],
      },
      {
        id: "who-for",
        question: "Who is it for?",
        answer: [
          "Students and young professionals who rent a room in Germany before they arrive, and landlords, often students subletting their own room, who want a tenant from abroad to trust them.",
        ],
      },
      {
        id: "landlord-paid",
        question: "How does the landlord get paid?",
        answer: [
          "At the handover the landlord shows a code on their phone or laptop. The tenant checks the room, scans the code with their phone camera and approves in Phantom. The deposit reaches the landlord in seconds and the landlord's screen turns green.",
        ],
      },
      {
        id: "no-keys",
        question: "What if I never get the keys?",
        answer: [
          "Then you never scan, and the landlord is never paid. After the handover deadline the deposit goes back to you. Anyone can trigger that return, including you.",
        ],
      },
      {
        id: "cost",
        question: "What does it cost?",
        answer: [
          "Nothing real: this prototype runs on Solana's test network with test money. Each step costs a tiny network fee in test SOL, which Get test funds covers.",
          "The plan for a live version is a small flat fee per deal, paid separately, so the deposit itself only ever goes to the tenant or the landlord.",
        ],
      },
    ],
  },
  {
    id: "safety",
    title: "Money and safety",
    entries: [
      {
        id: "who-holds",
        question: "Who holds the money?",
        answer: [
          "A program on Solana holds it in a lock. Its rules allow exactly two ways out: to the landlord when the tenant approves at the handover, or back to the tenant (after the deadline, or earlier if the landlord gives it back). Keysfirst has no button to take it.",
          "One honest caveat: on this test network the program can still be updated by its deploy key. Before any real money, that key would be locked or shared between several people.",
        ],
        link: { href: "/how-it-works#limits", label: "All known limits" },
      },
      {
        id: "keys-kept",
        question: "Can the landlord take the money and keep the keys?",
        answer: [
          "At the door you scan first, so this is possible. It would be theft by a known person at a real address, which is far rarer than an anonymous online scam and easier to act on.",
        ],
      },
      {
        id: "scan-early",
        question: "Can someone trick me into scanning early?",
        answer: [
          "Scanning pays the landlord, so only scan standing in the room with the keys. The program only accepts the scan from 24 hours before move-in, which blocks \"scan now to reserve the room\" tricks weeks ahead. It can't stop pressure close to move-in, so the rule stays: no keys, no scan.",
        ],
      },
      {
        id: "not-as-described",
        question: "What if the room isn't as described?",
        answer: [
          "Don't scan. Ask the landlord to give the deposit back, which they can do at any time, or wait for the deadline and it returns to you.",
        ],
      },
      {
        id: "no-show",
        question: "What if the tenant doesn't show up?",
        answer: ["The deposit goes back to the tenant after the deadline. The landlord loses the time the room was reserved, not money."],
      },
      {
        id: "contract",
        question: "Does this replace a rental contract?",
        answer: [
          "No. Keysfirst only protects the moment the deposit changes hands. Your contract, and disputes after you move in (damage, for example), follow normal German tenancy law.",
        ],
      },
      {
        id: "law",
        question: "What does German law say about deposits?",
        answer: [
          "Under §551 BGB a deposit may be at most three months' rent without utilities, and the tenant may pay it in three monthly instalments, the first due when the tenancy starts. So you don't have to pay the full deposit before you move in.",
          "This is general information, not legal advice.",
        ],
      },
    ],
  },
  {
    id: "wallets",
    title: "Wallets and test money",
    entries: [
      {
        id: "wallet",
        question: "What is a wallet, and why Phantom?",
        answer: [
          "A wallet is an app that holds your money and approves payments; your keys never leave it. Keysfirst is tested with Phantom, a popular Solana wallet for phones and browsers.",
        ],
        link: { href: "/start", label: "Get started in 5 minutes" },
      },
      {
        id: "devnet",
        question: "What are devnet and test money?",
        answer: [
          "Devnet is Solana's test network. Money there has no value, so you can try everything safely. This prototype uses its own Test EUR on devnet; a live version would use EURC, a regulated euro stablecoin.",
        ],
      },
      {
        id: "test-money",
        question: "How do I get test money?",
        answer: [
          "Log in, then use Get test funds in the wallet menu or in the guide. It sends 1,000 Test EUR and, if your wallet has none, a little devnet SOL for fees.",
        ],
        link: { href: "/start#funds", label: "Get test funds" },
      },
      {
        id: "phone-login",
        question: "I can't log in on my phone.",
        answer: [
          "Phone browsers like Safari can't reach Phantom. Tap Open in Phantom: the page reopens inside Phantom's own browser, where logging in and paying work.",
        ],
      },
      {
        id: "qr",
        question: "The code doesn't open anything.",
        answer: [
          "Use the phone's normal camera app and tap the link it shows. The page that opens has an Approve in Phantom button. Approve within a minute; if the request expires, tap the button again.",
        ],
      },
      {
        id: "unsafe",
        question: "Phantom says this site may be unsafe.",
        answer: [
          "Phantom warns about new websites it doesn't know yet. This is a prototype on the test network with test money only. A review of the domain was requested from Phantom on 27 September 2026.",
        ],
      },
    ],
  },
  {
    id: "prototype",
    title: "The prototype",
    entries: [
      {
        id: "real-money",
        question: "Is this real money?",
        answer: ["No. Everything runs on Solana devnet with test money. Never send real money to anything here."],
      },
      {
        id: "why-solana",
        question: "Why Solana?",
        answer: [
          "Payments settle in seconds and can't be charged back, so a landlord can hand over the keys the moment the screen turns green. The rules live in a public program, and Solana's clock lets anyone send the deposit back after the deadline.",
        ],
      },
    ],
  },
];

export const LANDING_FAQ_IDS = ["no-keys", "who-holds", "cost", "real-money"];

export function faqEntries(ids: string[]): FaqEntry[] {
  const all = FAQ.flatMap((group) => group.entries);
  return ids.map((id) => all.find((entry) => entry.id === id)).filter((entry): entry is FaqEntry => entry !== undefined);
}
```

- [ ] **Step 3: Write the marketing blocks**

`web/src/components/marketing/SectionHeader.tsx`:

```tsx
import { cx } from "@/lib/cx";

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className="label text-fg-muted">{eyebrow}</p>}
      <h2 id={id} className="mt-3 scroll-mt-24 font-display text-section font-bold">
        {title}
      </h2>
      {lead && <p className="mt-4 text-lead text-fg-muted">{lead}</p>}
    </div>
  );
}
```

`web/src/components/marketing/RulesTimetable.tsx`:

```tsx
import { Timetable } from "@/components/ui/Timetable";

/** The landing hero's proof: the rulebook as a timetable (example deal). */
export function RulesTimetable() {
  return (
    <Timetable
      className="animate-rise"
      title="How your €600.00 moves"
      aside="Example"
      footer="Rules run in a public program on Solana."
      rows={[
        { key: "pay", time: "Today", title: "You pay €600.00 into the lock", detail: "From here it can only go one of two ways.", state: "now" },
        { key: "door", time: "Move-in", title: "You scan the landlord's code at the door", detail: "€600.00 goes to the landlord, in seconds.", state: "next" },
        { key: "back", time: "Deadline", title: "No handover by then?", detail: "€600.00 comes back to you, automatically.", state: "later" },
      ]}
    />
  );
}
```

`web/src/components/marketing/StepList.tsx`:

```tsx
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

export interface Step {
  pictogram: PictogramName;
  title: string;
  text: string;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <Pictogram name={step.pictogram} size={52} className="shrink-0" />
          <div>
            <p className="font-display text-card font-bold">
              <span className="mr-2 text-fg-subtle tabular-nums">{i + 1}</span>
              {step.title}
            </p>
            <p className="mt-1 text-body text-fg-muted">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

`web/src/components/marketing/ProblemSteps.tsx`:

```tsx
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

const STEPS: Array<{ pictogram: PictogramName; title: string; text: string }> = [
  { pictogram: "fake-listing", title: "A room appears online", text: "A nice room at a fair price, in a Facebook group or on WG-Gesucht." },
  { pictogram: "landlord", title: "The \"landlord\" is abroad", text: "They can't show you the room, but want the deposit now to \"hold\" it." },
  { pictogram: "pay-into-lock", title: "You pay. They disappear.", text: "The money is gone, and so is the listing." },
];

export function ProblemSteps() {
  return (
    <ol className="mt-10 grid gap-6 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <li key={step.title} className="rounded-lg border-[1.5px] border-rule bg-canvas p-5">
          <Pictogram name={step.pictogram} size={52} />
          <p className="mt-4 font-display text-card font-bold">
            <span className="mr-2 text-fg-subtle tabular-nums">{i + 1}</span>
            {step.title}
          </p>
          <p className="mt-1 text-body text-fg-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
```

`web/src/components/marketing/AudienceSplit.tsx`:

```tsx
import { ButtonLink } from "@/components/ui/Button";
import { StepList, type Step } from "./StepList";

const RENTING: Step[] = [
  { pictogram: "share-link", title: "Get a deposit link", text: "Ask your landlord to create one. It takes a minute." },
  { pictogram: "pay-into-lock", title: "Pay into the lock", text: "The deposit leaves your wallet but doesn't reach the landlord yet: it waits in the lock." },
  { pictogram: "scan-at-door", title: "Scan at the door", text: "Check the room, then scan the landlord's code. Only then are they paid. No handover? It comes back to you." },
];

const LETTING: Step[] = [
  { pictogram: "laptop-wallet", title: "Create a deposit link", text: "Room, amount, move-in and the latest handover." },
  { pictogram: "share-link", title: "Send it to your tenant", text: "On WhatsApp or wherever you talk. They pay into the lock." },
  { pictogram: "keys-change-hands", title: "Show your code at the handover", text: "Your screen turns green in seconds: then hand over the keys." },
];

export function AudienceSplit() {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="renting" className="rounded-lg border-2 border-fg p-6">
        <h3 id="renting" className="label text-fg-muted">
          If you&apos;re renting
        </h3>
        <div className="mt-5">
          <StepList steps={RENTING} />
        </div>
        {/* Cut rule: if /tenants is cut, link to /how-it-works. */}
        <ButtonLink href="/tenants" variant="quiet" className="mt-6">
          How it protects tenants
        </ButtonLink>
      </section>
      <section aria-labelledby="letting" className="rounded-lg border-2 border-fg p-6">
        <h3 id="letting" className="label text-fg-muted">
          If you&apos;re letting
        </h3>
        <div className="mt-5">
          <StepList steps={LETTING} />
        </div>
        <ButtonLink href="/new" className="mt-6">
          Create a deposit link
        </ButtonLink>
      </section>
    </div>
  );
}
```

`web/src/components/marketing/ScenarioGrid.tsx`:

```tsx
import { Pictogram } from "@/components/brand/Pictogram";
import type { Scenario } from "@/content/scenarios";

export function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((s) => (
        <li key={s.id} id={s.id} className="flex flex-col rounded-lg border-[1.5px] border-rule bg-canvas p-5">
          <Pictogram name={s.pictogram} size={44} />
          <h3 className="mt-4 font-display text-card font-bold">{s.question}</h3>
          {/* flex-1 pushes the rule line to the bottom, so the rules line up across a row of cards */}
          <p className="mt-2 flex-1 text-body text-fg-muted">{s.answer}</p>
          <p className="mt-4 border-t border-rule pt-3 text-sm">
            <span className="marker font-semibold">The rule:</span> {s.rule}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

`web/src/components/marketing/WhySolana.tsx`:

```tsx
import { Icon, type IconName } from "@/components/ui/Icon";
import idl from "@/idl/keysfirst.json";
import { explorerAddress } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

const FACTS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "clock",
    title: "Final in seconds",
    text: "Payment on Solana settles in seconds and can't be charged back, so the landlord can hand over the keys the moment the screen turns green. A bank transfer can take a day.",
  },
  {
    icon: "lock",
    title: "Rules in a public program",
    text: "A program on Solana holds each deposit. Its rules allow two ways out: to the landlord when the tenant approves at the handover, or back to the tenant.",
  },
  {
    icon: "return",
    title: "A clock nobody controls",
    text: "After the deadline, anyone can send the deposit back to the tenant. No support ticket, no waiting for someone to decide.",
  },
];

export function WhySolana() {
  return (
    <section aria-labelledby="why-solana" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
      <SectionHeader id="why-solana" eyebrow="Why Solana" title="Why it runs on Solana." />
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {FACTS.map((fact) => (
          <li key={fact.title} className="border-t-2 border-fg pt-5">
            <Icon name={fact.icon} size={28} />
            <h3 className="mt-3 font-display text-card font-bold">{fact.title}</h3>
            <p className="mt-2 text-body text-fg-muted">{fact.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-fg-muted">
        Every step leaves a public receipt.{" "}
        <a href={explorerAddress(idl.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2">
          See the program on Solana Explorer
          <Icon name="external" size={14} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </section>
  );
}
```

`web/src/components/marketing/FaqList.tsx`:

```tsx
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { FaqEntry } from "@/content/faq";

/** Native <details>: keyboard and screen-reader friendly, no JavaScript. */
export function FaqList({ entries }: { entries: FaqEntry[] }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {entries.map((entry) => (
        <details key={entry.id} id={entry.id} className="group scroll-mt-24">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-card font-bold [&::-webkit-details-marker]:hidden">
            {entry.question}
            <Icon name="chevron-down" size={22} className="shrink-0 transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <div className="space-y-3 pb-5 text-body text-fg-muted">
            {entry.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {entry.link && (
              <p>
                <Link href={entry.link.href} className="font-semibold text-fg underline decoration-accent decoration-2 underline-offset-4">
                  {entry.link.label}
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
```

`web/src/components/marketing/AskLandlord.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { whatsappUrl } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { PRODUCTION_URL } from "@/lib/site";

// Cut rule: if /landlords is cut, point the message at "/".
const LANDLORD_PAGE = "/landlords";

/** A pre-filled message a tenant sends to their landlord (spec §6.10): WhatsApp or copy. */
export function AskLandlord({ tone = "light" }: { tone?: "light" | "dark" }) {
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const origin = mounted ? window.location.origin : PRODUCTION_URL;
  const message = `Hi! Could we use Keysfirst for the deposit? You create a deposit link, I pay into it, and you get the money the moment I scan your code at the key handover: ${origin}${LANDLORD_PAGE}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ButtonLink href={whatsappUrl(message)} external variant="secondary">
        Ask your landlord on WhatsApp
      </ButtonLink>
      <Button variant="quiet" onClick={copy} className={cx("justify-center", tone === "dark" && "text-fg-inverse")}>
        <Icon name={copied ? "check" : "copy"} size={18} />
        {copied ? "Copied" : "Copy the message"}
      </Button>
    </div>
  );
}
```

`web/src/components/marketing/CtaBand.tsx`:

```tsx
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { AskLandlord } from "./AskLandlord";

export function CtaBand() {
  return (
    <section aria-labelledby="cta" className="bg-inverse text-fg-inverse">
      <div className="mx-auto grid max-w-page gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div>
          <h2 id="cta" className="font-display text-section font-bold">
            Renting from abroad? Ask for a deposit link.
          </h2>
          <p className="mt-3 max-w-md text-fg-inverse-muted">Send your landlord a short message. If someone won&apos;t use a deposit link, ask why.</p>
          <div className="mt-6">
            <AskLandlord tone="dark" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-section font-bold">Letting a room? Create a link in a minute.</h2>
          <p className="mt-3 max-w-md text-fg-inverse-muted">Your tenant pays into the lock, and you&apos;re paid at the door.</p>
          <ButtonLink href="/new" variant="secondary" className="mt-6">
            Create a deposit link
          </ButtonLink>
        </div>
        <p className="lg:col-span-2">
          <Link href="/start" className="font-semibold underline decoration-accent decoration-2 underline-offset-4">
            New to wallets? Get started in 5 minutes
          </Link>
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `web/src/app/(site)/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AudienceSplit } from "@/components/marketing/AudienceSplit";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { ProblemSteps } from "@/components/marketing/ProblemSteps";
import { RulesTimetable } from "@/components/marketing/RulesTimetable";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { WhySolana } from "@/components/marketing/WhySolana";
import { faqEntries, LANDING_FAQ_IDS } from "@/content/faq";
import { LANDING_SCENARIO_IDS, SCENARIOS } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  // The root template doesn't reach the home page, so the title is written out in full.
  title: { absolute: "Keysfirst · The deposit moves only when the keys do" },
  description:
    "Renting a room in Germany from abroad? Keysfirst holds the deposit in a lock until the key handover: the landlord is paid when you scan their code at the door, otherwise it comes back to you.",
};

const FACTS = ["Works with any listing: WG-Gesucht, Facebook, a friend's sublet", "Money only goes to the tenant or the landlord", "Automatic return after the deadline"];

export default function LandingPage() {
  const scenarios = SCENARIOS.filter((s) => LANDING_SCENARIO_IDS.includes(s.id));
  return (
    <>
      <section className="mx-auto grid max-w-page gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-14 lg:px-10 lg:pt-16 lg:pb-24">
        <div>
          <p className="label text-fg-muted">Deposit protection for rooms in Germany</p>
          <h1 className="mt-4 font-display text-hero font-bold">
            The deposit moves only when the <span className="marker animate-marker">keys</span> do.
          </h1>
          <p className="mt-6 max-w-[36ch] text-lead text-fg-muted">
            Keysfirst holds a rental deposit in a lock until the key handover. The tenant scans the landlord&apos;s code at the door and the
            landlord is paid in seconds. No handover? The money goes back to the tenant.
          </p>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div>
              <ButtonLink href="/new" size="lg" fullWidth className="sm:w-auto">
                Create a deposit link
              </ButtonLink>
              <p className="mt-2 text-sm text-fg-subtle">For landlords · free on devnet</p>
            </div>
            {/* Cut rule: if /tenants is cut, link to /how-it-works. */}
            <ButtonLink href="/tenants" variant="quiet" className="sm:mt-4">
              I&apos;m renting: how it protects me
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-3 border-t border-rule pt-6 text-sm text-fg-muted sm:grid-cols-3">
            {FACTS.map((fact) => (
              <li key={fact} className="flex gap-2">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-fg" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <RulesTimetable />
      </section>

      <section aria-labelledby="problem" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
          <SectionHeader
            id="problem"
            eyebrow="The problem"
            title="Fake landlords look for tenants who can't visit."
            lead="Students often rent a room in Germany before they arrive. That is exactly who the fake-landlord scam targets."
          />
          <ProblemSteps />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Callout tone="neutral" title="Booking platforms protect only their own listings.">
              Keysfirst works with any listing: a Facebook group, WG-Gesucht, WhatsApp or a friend&apos;s sublet. The money waits until you&apos;re at
              the door.
            </Callout>
            <Callout tone="info" title="German law is on your side.">
              You don&apos;t have to pay the full deposit before you move in: under §551 BGB you may pay it in three monthly instalments, the first due
              when the tenancy starts.
            </Callout>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
        <SectionHeader id="how" eyebrow="How it works" title="Three steps on each side." />
        <AudienceSplit />
        <ButtonLink href="/how-it-works" variant="quiet" className="mt-8">
          All the rules, step by step
        </ButtonLink>
      </section>

      <section aria-labelledby="what-if" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-24">
          <SectionHeader id="what-if" eyebrow="What if…" title="The rules answer the hard questions." />
          <ScenarioGrid scenarios={scenarios} />
        </div>
      </section>

      <WhySolana />

      <section aria-labelledby="faq" className="bg-subtle">
        <div className="mx-auto max-w-read px-4 py-14 sm:px-6 lg:py-24">
          <SectionHeader id="faq" eyebrow="FAQ" title="Questions people ask first." />
          <div className="mt-8">
            <FaqList entries={faqEntries(LANDING_FAQ_IDS)} />
          </div>
          <ButtonLink href="/faq" variant="quiet" className="mt-6">
            All questions
          </ButtonLink>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm test` → PASS. `npm run lint` → no errors. `npm run build` → `/` is `○ (Static)` (the `dynamic = "error"` guard would fail the build otherwise).
Browser at 375 and 1280 px:
- First viewport at 1280: headline with the Highlighter drawing in under "keys", lead, "Create a deposit link", the renting link, and the timetable card on the right. At 375: the same stacked, the primary button full width.
- Sections in order: problem (mist band), how it works (two framed columns), what if (six cards with the rule lines aligned), why Solana (three facts + Explorer link), FAQ preview (four questions that open and close with Enter/Space), ink closing band.
- "Ask your landlord on WhatsApp" opens `wa.me` with the message ending in `/landlords`; "Copy the message" copies it.
- No console errors, no horizontal scroll. Network: no `@solana` chunk on `/`.

- [ ] **Step 6: Commit**

```bash
git add web/src/content web/src/components/marketing "web/src/app/(site)/page.tsx"
git commit -m "feat(web): landing page with the rules as a timetable, the scam problem, both sides, what-ifs, why Solana and FAQ" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Get started guide

**Files:**
- Create: `web/src/components/guide/GuideIllustrations.tsx`
- Create: `web/src/app/(app)/start/page.tsx`, `web/src/app/(app)/start/GuideFunds.tsx`

**Interfaces:**
- Consumes: `LoginButton`, `OpenInPhantom`, `TestFundsButton`, `ButtonLink`, `Callout`, `shortAddress`, `useWallet`, `useMounted`.
- Produces: `/start` with anchors `#install`, `#devnet`, `#funds`, `#try`, `#tips` (linked from the connect sheet, the FAQ and the footer); `InstallIllustration`, `DevnetIllustration`, `FundsIllustration`, `ScanIllustration`.

- [ ] **Step 1: Write `web/src/components/guide/GuideIllustrations.tsx`** (schematic screens in the pictogram line style; Phantom is named, never drawn)

```tsx
import type { ReactNode } from "react";

const INK = "#16181D";
const MARKER = "#FFE14D";
const MIST = "#F4F5F2";
const GREEN = "#0B7A47";

function Figure({ label, width, height, children }: { label: string; width: number; height: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-auto w-full max-w-sm font-sans">
      {children}
    </svg>
  );
}

function Phone({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="120" height="220" rx="16" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="48" y="10" width="24" height="5" rx="2.5" fill={INK} />
      {children}
    </g>
  );
}

export function InstallIllustration() {
  return (
    <Figure label="A phone with the Phantom app icon and a laptop with the Phantom browser extension" width={340} height={240}>
      <Phone x={10} y={10}>
        <rect x="16" y="34" width="36" height="36" rx="9" fill={MIST} />
        <rect x="68" y="34" width="36" height="36" rx="9" fill={MARKER} stroke={INK} strokeWidth="3" />
        <text x="86" y="86" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>Phantom</text>
        <rect x="16" y="96" width="36" height="36" rx="9" fill={MIST} />
        <rect x="68" y="96" width="36" height="36" rx="9" fill={MIST} />
      </Phone>
      <g transform="translate(150 50)">
        <rect width="180" height="120" rx="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <rect x="0" y="0" width="180" height="24" rx="8" fill={MIST} stroke={INK} strokeWidth="4" />
        <rect x="150" y="6" width="14" height="12" rx="3" fill={MARKER} stroke={INK} strokeWidth="2" />
        <text x="146" y="44" textAnchor="end" fontSize="11" fontWeight="600" fill={INK}>Phantom extension</text>
        <path d="M-12 128h204" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </g>
    </Figure>
  );
}

export function DevnetIllustration() {
  const rows = ["Settings", "Developer Settings", "Testnet Mode", "Solana Devnet"];
  return (
    <Figure label="Phantom settings: Developer Settings, Testnet Mode switched on, Solana Devnet selected" width={200} height={240}>
      <Phone x={40} y={10}>
        {rows.map((row, i) => (
          <g key={row} transform={`translate(10 ${32 + i * 44})`}>
            <rect width="100" height="36" rx="6" fill={i >= 2 ? MARKER : MIST} stroke={INK} strokeWidth={i >= 2 ? 2 : 0} />
            <text x="8" y="22" fontSize="10" fontWeight="600" fill={INK}>{row}</text>
            {i === 2 && (
              <g transform="translate(74 11)">
                <rect width="20" height="14" rx="7" fill={INK} />
                <circle cx="13" cy="7" r="5" fill="#fff" />
              </g>
            )}
            {i === 3 && <path d="M80 18l4 4 8-9" stroke={INK} strokeWidth="2.5" fill="none" />}
          </g>
        ))}
      </Phone>
    </Figure>
  );
}

export function FundsIllustration() {
  return (
    <Figure label="Keysfirst on a phone: the Get test funds button and a confirmation of 1,000 Test EUR" width={200} height={240}>
      <Phone x={40} y={10}>
        <rect x="12" y="30" width="20" height="20" rx="4" fill={MARKER} />
        <text x="38" y="45" fontSize="11" fontWeight="700" fill={INK}>Keysfirst</text>
        <rect x="12" y="96" width="96" height="30" rx="6" fill={INK} />
        <text x="60" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">Get test funds</text>
        <rect x="12" y="138" width="96" height="34" rx="6" fill="#E3F4EA" />
        <path d="M20 155l4 4 8-9" stroke={GREEN} strokeWidth="2.5" fill="none" />
        <text x="38" y="159" fontSize="9" fontWeight="600" fill={INK}>1,000 Test EUR</text>
      </Phone>
    </Figure>
  );
}

export function ScanIllustration() {
  return (
    <Figure label="The landlord's laptop shows a handover code; the tenant scans it with the phone camera" width={340} height={240}>
      <g transform="translate(10 30)">
        <rect width="200" height="130" rx="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <rect x="0" y="0" width="200" height="22" rx="8" fill={INK} />
        <text x="10" y="15" fontSize="10" fontWeight="600" fill="#fff">Key handover</text>
        <g transform="translate(66 34)">
          <rect width="68" height="68" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M8 8h16v16H8zM44 8h16v16H44zM8 44h16v16H8zM34 34h6v6h-6zM46 46h8v8h-8zM34 50h6v8h-6z" fill={INK} />
        </g>
        <path d="M-12 138h224" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </g>
      <Phone x={210} y={10}>
        <rect x="14" y="40" width="92" height="92" rx="4" fill={MIST} />
        <path d="M22 50v-6h8M98 50v-6h-8M22 122v6h8M98 122v6h-8" stroke={MARKER} strokeWidth="4" fill="none" />
        <rect x="14" y="150" width="92" height="28" rx="6" fill={INK} />
        <text x="60" y="168" textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">Approve in Phantom</text>
      </Phone>
    </Figure>
  );
}
```

- [ ] **Step 2: Write `web/src/app/(app)/start/GuideFunds.tsx`**

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { LoginButton } from "@/components/wallet/LoginButton";
import { OpenInPhantom } from "@/components/wallet/OpenInPhantom";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { shortAddress } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Step 3 of the guide, live: log in, then get test funds right here. */
export function GuideFunds() {
  const mounted = useMounted();
  const { publicKey } = useWallet();
  if (!mounted || !publicKey) {
    return (
      <div className="max-w-sm space-y-3">
        <LoginButton variant="primary" fullWidth />
        <OpenInPhantom />
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-fg-muted">
        Logged in as <span className="font-semibold text-fg tabular-nums">{shortAddress(publicKey.toBase58())}</span>
      </p>
      <TestFundsButton variant="primary" />
    </div>
  );
}
```

- [ ] **Step 3: Write `web/src/app/(app)/start/page.tsx`**

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DevnetIllustration, FundsIllustration, InstallIllustration, ScanIllustration } from "@/components/guide/GuideIllustrations";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { GuideFunds } from "./GuideFunds";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Get started",
  description: "Install Phantom, switch it to Solana Devnet, get free test money and try Keysfirst as landlord and tenant.",
};

function GuideStep({ id, number, title, children, art }: { id: string; number: number; title: string; children: ReactNode; art?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-24 gap-6 border-t-2 border-fg py-10 md:grid-cols-[1fr_minmax(0,20rem)] md:items-start">
      <div>
        <p className="font-display text-section font-bold text-fg-subtle tabular-nums">{number}</p>
        <h2 id={`${id}-title`} className="mt-1 font-display text-section font-bold">
          {title}
        </h2>
        <div className="mt-4 space-y-4 text-body text-fg-muted">{children}</div>
      </div>
      {art && <div className="flex justify-center md:justify-end">{art}</div>}
    </section>
  );
}

export default function GetStartedPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <p className="label text-fg-muted">Guide</p>
      <h1 className="mt-3 font-display text-title font-bold">Get started in 5 minutes</h1>
      <p className="mt-4 max-w-2xl text-lead text-fg-muted">
        Keysfirst runs on Solana&apos;s test network, so everything here uses test money. You need a wallet app, the test network switched on and
        some test money.
      </p>

      <div className="mt-10">
        <GuideStep id="install" number={1} title="Install Phantom" art={<InstallIllustration />}>
          <p>
            Phantom is a wallet app: it holds your money and approves payments, and your keys never leave it. On a phone, install it from the App
            Store or Google Play. On a laptop, add the browser extension.
          </p>
          <ButtonLink href="https://phantom.com/download" external variant="secondary">
            Download Phantom
          </ButtonLink>
        </GuideStep>

        <GuideStep id="devnet" number={2} title="Switch Phantom to Solana Devnet" art={<DevnetIllustration />}>
          <p>
            In Phantom open <strong className="text-fg">Settings → Developer Settings</strong>, turn on <strong className="text-fg">Testnet Mode</strong>{" "}
            and choose <strong className="text-fg">Solana Devnet</strong>.
          </p>
          <p>Keysfirst only works there, and nothing on devnet has real value.</p>
        </GuideStep>

        <GuideStep id="funds" number={3} title="Log in and get test money" art={<FundsIllustration />}>
          <p>Get test funds sends 1,000 Test EUR and, if your wallet has none, a little devnet SOL for network fees.</p>
          <GuideFunds />
        </GuideStep>

        <GuideStep id="try" number={4} title="Try both sides" art={<ScanIllustration />}>
          <p>
            <strong className="text-fg">As the landlord</strong> (laptop): create a deposit link with the demo values. The 5-minute window lets you
            see the whole cycle quickly.
          </p>
          <p>
            <strong className="text-fg">As the tenant</strong> (phone): open the link inside Phantom&apos;s browser, pay into the lock, then at the
            &ldquo;door&rdquo; scan the landlord&apos;s code with the phone camera and approve in Phantom.
          </p>
          <Callout tone="neutral">Use a second wallet for the tenant: the landlord can&apos;t pay their own deal.</Callout>
          <ButtonLink href="/new">Create a deposit link</ButtonLink>
        </GuideStep>

        <GuideStep id="tips" number={5} title="Tips for phones">
          <ul className="list-disc space-y-2 pl-5">
            <li>On iPhone, open Keysfirst inside Phantom (Open in Phantom) to log in and pay.</li>
            <li>Scan the handover code with the normal Camera app, then tap Approve in Phantom.</li>
            <li>Approve within a minute. If the request expires, tap the button again for a fresh one.</li>
            <li>Phantom must be on the wallet that paid; with any other wallet it can&apos;t load the request.</li>
            <li>
              Phantom may warn that the site is new. This prototype only uses test money; a review of the domain was requested from Phantom on
              27 September 2026.
            </li>
          </ul>
        </GuideStep>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`, `npm run build` → `/start` is `○ (Static)`.
Browser at 375 and 1280 px:
- Five numbered steps; illustrations sit to the right on desktop and below the text on phones; their labels read correctly (Phantom, Testnet Mode, Solana Devnet, Get test funds, Approve in Phantom); no text overflows the drawn phones.
- `/start#devnet` jumps to step 2 below the sticky header.
- Logged out: "Log in" in step 3 opens the connect sheet. Logged in (Task 20): the address and "Get test funds" appear, and the faucet answers.
- No console errors, no horizontal scroll.

- [ ] **Step 5: Commit and close milestone M4**

```bash
git add web/src/components/guide "web/src/app/(app)/start"
git commit -m "feat(web): get-started guide with drawn Phantom steps and live log-in plus test funds" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Report M4: works / doesn't / next.

---

### Task 13: 404, error and global error pages

**Files:**
- Create: `web/src/components/site/ErrorView.tsx`
- Create: `web/src/app/not-found.tsx`, `web/src/app/error.tsx`, `web/src/app/(site)/error.tsx`, `web/src/app/(app)/error.tsx`, `web/src/app/global-error.tsx`

**Interfaces:**
- Consumes: `SiteHeader` (Task 4), `Button`, `ButtonLink`, `Callout`, `barlow`, `barlowCondensed`, `globals.css`.
- Produces: `ErrorView({ error, retry })`. Every unmatched URL renders the branded 404; an error inside a group keeps that group's header (the group-level `error.tsx` sits inside the group layout); a root-layout failure renders `global-error.tsx`.

- [ ] **Step 1: Write `web/src/components/site/ErrorView.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

/** Shared body of the error boundaries. Next 16.3 passes `retry()`, which re-fetches and re-renders the segment. */
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto w-full max-w-read px-4 py-16 sm:py-24">
      <p className="label text-fg-muted">Something went wrong</p>
      <h1 className="mt-3 font-display text-title font-bold">This page hit a problem.</h1>
      <p className="mt-4 text-lead text-fg-muted">Try again. If it keeps happening, reload the page or come back in a minute.</p>
      <Callout className="mt-6" tone="info">
        Nothing moves without your approval in Phantom, so any deposit is exactly where it was.
      </Callout>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to the homepage
        </ButtonLink>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the three `error.tsx` files** (identical content; each must be a client module)

`web/src/app/error.tsx`, `web/src/app/(site)/error.tsx` and `web/src/app/(app)/error.tsx`:

```tsx
"use client";

import { ErrorView } from "@/components/site/ErrorView";

export default function ErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} />;
}
```

- [ ] **Step 3: Write `web/src/app/global-error.tsx`**

```tsx
"use client";

import "./globals.css";
import { barlow, barlowCondensed } from "./fonts";

/** Replaces the root layout when that fails, so it brings its own <html>, <body>, fonts and styles. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="grid min-h-dvh place-items-center bg-canvas px-4 text-fg">
        <title>Something went wrong · Keysfirst</title>
        <main className="max-w-read py-16">
          <p className="label text-fg-muted">Keysfirst</p>
          <h1 className="mt-3 font-display text-title font-bold">Something went wrong.</h1>
          <p className="mt-4 text-lead text-fg-muted">Nothing moves without your approval in Phantom. Try again, or reload the page.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-8 min-h-12 rounded-md bg-inverse px-5 font-semibold text-fg-inverse"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
```

If `npm run build` rejects the font import in this client file, delete the `fonts` import and the `className` on `<html>`: this page then uses the system font, which is acceptable for a last-resort screen.

- [ ] **Step 4: Write `web/src/app/not-found.tsx`**

```tsx
import { SiteHeader } from "@/components/site/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

/** Also handles every unmatched URL. Rendered inside the root layout (ribbon + footer), so it adds the header itself. */
export default function NotFound() {
  return (
    <>
      <title>Page not found · Keysfirst</title>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-read flex-1 px-4 py-16 sm:py-24">
        <p className="label text-fg-muted">Error 404</p>
        <h1 className="mt-3 font-display text-title font-bold">
          This page isn&apos;t on the <span className="marker">timetable</span>.
        </h1>
        <p className="mt-4 text-lead text-fg-muted">
          The link may be mistyped or out of date. Deal links look like keysfirst.vercel.app/deal/ followed by a long code.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/">Go to the homepage</ButtonLink>
          <ButtonLink href="/deals" variant="secondary">
            My deals
          </ButtonLink>
          <ButtonLink href="/start" variant="quiet" className="sm:ml-2">
            Get started
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint`, `npm run build` → succeed.
Browser at 375 and 1280 px:
- `/this-does-not-exist`: one header, the 404 page, footer; the tab title is "Page not found · Keysfirst"; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/this-does-not-exist` → `404`.
- Error boundary: temporarily add `throw new Error("test")` at the top of `web/src/app/(site)/faq/page.tsx`'s component once it exists, or of the landing page now; reload: the error view appears under the site header, "Try again" re-renders; remove the throw again (`git diff` must be empty for that file afterwards).
- No console errors apart from the deliberate test error.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/site/ErrorView.tsx web/src/app/not-found.tsx web/src/app/error.tsx "web/src/app/(site)/error.tsx" "web/src/app/(app)/error.tsx" web/src/app/global-error.tsx
git commit -m "feat(web): branded 404, error boundaries with retry and a last-resort global error page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Link previews, icons, manifest and cleanup

**Files:**
- Create: `web/assets/fonts/BarlowSemiCondensed-Bold.ttf`, `web/assets/fonts/OFL.txt` (downloaded from Google Fonts' official repository; approved by the user on 2026-09-28)
- Modify: `.gitattributes` (binary fonts and icons)
- Create: `web/src/lib/og.tsx`
- Modify (replace): `web/src/app/opengraph-image.tsx`, `web/src/app/icon.png/route.tsx`
- Create: `web/src/app/(app)/deal/[id]/opengraph-image.tsx`
- Modify: `web/src/app/(app)/deal/[id]/page.tsx` (drop the hand-written `openGraph.images`)
- Create: `web/src/app/icon.svg`, `web/src/app/apple-icon.tsx`, `web/src/app/manifest.ts`, `web/src/app/robots.ts`, `web/src/app/sitemap.ts`
- Create: `web/scripts/make-favicon.mjs`; regenerate `web/src/app/favicon.ico`
- Modify: `web/next.config.ts`
- Delete: `web/public/{icon,next,vercel,globe,file,window}.svg`

**Interfaces:**
- Consumes: `siteUrl` (Task 1), `formatEur`, `STATUS_LABEL`, `statusOf`, `getProgram`, `RPC_URL`.
- Produces: `OG_SIZE`, `OG_CONTENT_TYPE`, `ogCard({ kicker?, title, subtitle? }): Promise<ImageResponse>` from `@/lib/og` (Task 17 uses it for the content pages); `/icon.png?size=<16–512>&simple=1` (default 256, unchanged URL for wallets).

- [ ] **Step 1: Add the approved font file**

```bash
mkdir -p web/assets/fonts
curl -fsSL -o web/assets/fonts/BarlowSemiCondensed-Bold.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/barlowsemicondensed/BarlowSemiCondensed-Bold.ttf
curl -fsSL -o web/assets/fonts/OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/barlowsemicondensed/OFL.txt
```

Expected: the TTF is roughly 80–130 KB and starts with the TrueType signature (`node -e "console.log(require('fs').readFileSync('web/assets/fonts/BarlowSemiCondensed-Bold.ttf').subarray(0,4))"` prints `<Buffer 00 01 00 00>`); `OFL.txt` contains "SIL Open Font License".

Append to `.gitattributes`:

```gitattributes
*.ttf binary
*.ico binary
```

- [ ] **Step 2: Write `web/src/lib/og.tsx`**

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#16181D";
const MARKER = "#FFE14D";
const GRAPHITE = "#545B66";

// ImageResponse can't read next/font's woff2 files; it gets the approved TTF, read once per server instance.
const displayFont = readFile(join(process.cwd(), "assets/fonts/BarlowSemiCondensed-Bold.ttf"));

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="10" fill={MARKER} />
      <circle cx="15" cy="24" r="6.5" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke={INK} strokeWidth="4" strokeLinecap="square" />
    </svg>
  );
}

/** A 1200 × 630 link-preview card in the brand: plate logo, big ink title, devnet line. Flexbox only (Satori). */
export async function ogCard({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#FFFFFF",
          color: INK,
          fontFamily: "Barlow Semi Condensed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark size={72} />
          <div style={{ display: "flex", fontSize: 52, marginLeft: 20, letterSpacing: -0.5 }}>Keysfirst</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {kicker ? (
            <div style={{ display: "flex", fontSize: 30, color: GRAPHITE, textTransform: "uppercase", letterSpacing: 2 }}>{kicker}</div>
          ) : null}
          <div style={{ display: "flex", fontSize: 80, lineHeight: 1.04, marginTop: 14, maxWidth: 1040 }}>{title}</div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, color: GRAPHITE, marginTop: 22, maxWidth: 1000 }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: GRAPHITE }}>
          <div style={{ display: "flex", width: 28, height: 10, background: MARKER, marginRight: 14 }} />
          Solana devnet prototype · test money only
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Barlow Semi Condensed", data: await displayFont, weight: 700, style: "normal" }] },
  );
}
```

- [ ] **Step 3: Replace `web/src/app/opengraph-image.tsx`**

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst: the deposit moves only when the keys do";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return ogCard({ title: "The deposit moves only when the keys do.", subtitle: "A deposit link for renting a room in Germany from abroad." });
}
```

- [ ] **Step 4: Write `web/src/app/(app)/deal/[id]/opengraph-image.tsx`**

```tsx
import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { formatEur } from "@/lib/format";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";
import { getProgram } from "@/lib/program";
import { STATUS_LABEL, statusOf } from "@/lib/rules";

export const alt = "A Keysfirst deposit link";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const SUBTITLE = "Protected by Keysfirst: the landlord is paid only when the tenant scans at the door.";

/** WhatsApp and Telegram previews of a deal link: amount, room and status. */
export default async function DealImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deal = await getProgram(new Connection(RPC_URL, "confirmed")).account.deal.fetchNullable(new PublicKey(id));
    if (deal) {
      return ogCard({
        kicker: STATUS_LABEL[statusOf(deal.status)],
        title: `${formatEur(deal.amount.toString())} deposit · ${deal.title}`,
        subtitle: SUBTITLE,
      });
    }
  } catch {
    // Unreadable address or devnet unreachable: fall back to the generic card below.
  }
  return ogCard({ title: "A Keysfirst deposit link", subtitle: SUBTITLE });
}
```

- [ ] **Step 5: Drop the hand-written image from the deal page's metadata**

In `web/src/app/(app)/deal/[id]/page.tsx`, replace the two lines

```tsx
    // Next merges metadata shallowly: setting openGraph here drops the root's image unless we repeat it (Task 14 replaces this with a file).
    const images = [{ url: "/opengraph-image", width: 1200, height: 630 }];
    return { title, description: DESCRIPTION, robots: { index: false }, openGraph: { title, description: DESCRIPTION, images } };
```

with

```tsx
    // No openGraph here: an explicit images list would override the deal's opengraph-image file.
    return { title, description: DESCRIPTION, robots: { index: false } };
```

- [ ] **Step 6: Icons, manifest, robots and sitemap**

Replace `web/src/app/icon.png/route.tsx`:

```tsx
import { ImageResponse } from "next/og";

/**
 * The wallet request icon (Solana Pay GET) and the favicon source. PNG on purpose: Phantom draws SVG icons in
 * Solana Pay requests as a black square. `?size=` 16–512 (default 256), `?simple=1` for the small-size mark.
 */
export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const size = Math.min(512, Math.max(16, Number(params.get("size")) || 256));
  const simple = params.get("simple") === "1";
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size}>
        <rect width="48" height="48" rx="10" fill="#FFE14D" />
        {simple ? (
          <>
            <circle cx="15" cy="24" r="7" fill="none" stroke="#16181D" strokeWidth="5" />
            <path d="M22 24H40M31 24v7" stroke="#16181D" strokeWidth="5" strokeLinecap="square" />
          </>
        ) : (
          <>
            <circle cx="15" cy="24" r="6.5" fill="none" stroke="#16181D" strokeWidth="4" />
            <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke="#16181D" strokeWidth="4" strokeLinecap="square" />
          </>
        )}
      </svg>
    ),
    { width: size, height: size },
  );
}
```

Create `web/src/app/icon.svg` (browser tab icon, the simplified mark):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#FFE14D"/><circle cx="15" cy="24" r="7" fill="none" stroke="#16181D" stroke-width="5"/><path d="M22 24H40M31 24v7" stroke="#16181D" stroke-width="5" stroke-linecap="square"/></svg>
```

Create `web/src/app/apple-icon.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: full-bleed Highlighter (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="180" height="180">
        <rect width="48" height="48" fill="#FFE14D" />
        <circle cx="15" cy="24" r="6.5" fill="none" stroke="#16181D" strokeWidth="4" />
        <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke="#16181D" strokeWidth="4" strokeLinecap="square" />
      </svg>
    ),
    { ...size },
  );
}
```

Create `web/src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keysfirst",
    short_name: "Keysfirst",
    description: "The deposit moves only when the keys do. Solana devnet prototype with test money.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#16181D",
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
```

Create `web/src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dev/"] }, sitemap: `${siteUrl()}/sitemap.xml` };
}
```

Create `web/src/app/sitemap.ts` (cut rule: drop pages that were cut):

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PAGES = ["/", "/how-it-works", "/tenants", "/landlords", "/faq", "/about", "/start"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PAGES.map((path) => ({ url: `${base}${path === "/" ? "" : path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.6 }));
}
```

- [ ] **Step 7: Regenerate the favicon**

Create `web/scripts/make-favicon.mjs`:

```js
// Writes src/app/favicon.ico from the app's own PNG icon (16, 32 and 48 px), without any image library.
// Usage, with the dev server running: node scripts/make-favicon.mjs [origin]
import { writeFile } from "node:fs/promises";

const origin = process.argv[2] ?? "http://localhost:3000";
const sizes = [16, 32, 48];

const images = await Promise.all(
  sizes.map(async (size) => {
    const res = await fetch(`${origin}/icon.png?size=${size}&simple=1`);
    if (!res.ok) throw new Error(`GET /icon.png?size=${size} answered ${res.status}`);
    return { size, png: Buffer.from(await res.arrayBuffer()) };
  }),
);

// ICO = 6-byte header + one 16-byte directory entry per image + the PNG files themselves.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, png }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});

await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([header, ...entries, ...images.map((i) => i.png)]));
console.log(`Wrote src/app/favicon.ico (${sizes.join(", ")} px)`);
```

With `npm run dev` running, run (in `web/`): `node scripts/make-favicon.mjs`
Expected: `Wrote src/app/favicon.ico (16, 32, 48 px)`; opening `http://localhost:3000/favicon.ico` shows the yellow key mark.

- [ ] **Step 8: Ship the font with the server functions** (replace `web/next.config.ts`)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link-preview images read the approved TTF at request time (deal previews): ship it with every server function.
  outputFileTracingIncludes: { "/**": ["./assets/fonts/**"] },
};

export default nextConfig;
```

- [ ] **Step 9: Remove the unused create-next-app files**

Run: `git grep -n -e "icon.svg" -e "next.svg" -e "vercel.svg" -e "globe.svg" -e "file.svg" -e "window.svg" -- web/src` → only `manifest.ts` (`/icon.svg`, now served from `app/icon.svg`).
Then: `git rm web/public/icon.svg web/public/next.svg web/public/vercel.svg web/public/globe.svg web/public/file.svg web/public/window.svg`

- [ ] **Step 10: Verify**

Run: `npm test`, `npm run lint`, `npm run build` → all pass. The route list includes `/opengraph-image`, `/deal/[id]/opengraph-image`, `/apple-icon`, `/icon.png`, `/icon.svg`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`. If the build reports a conflict between `app/icon.svg` and the `app/icon.png` route, delete `app/icon.svg` and its manifest entry (the favicon then covers browser tabs).
With the dev server:
- Open `http://localhost:3000/opengraph-image` in the browser: white card, yellow plate, "The deposit moves only when the keys do." in Barlow Semi Condensed, devnet line.
- View source of `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy`: `og:image` points to that deal's own image; open it: "RELEASED TO LANDLORD", "€600.00 deposit · …". The page title is "€600.00 deposit · … · Keysfirst".
- View source of `/`: `og:image`, `twitter:card` = `summary_large_image`, `<link rel="icon" …>` for `favicon.ico` and `icon.svg`, `apple-touch-icon`, `manifest`, `theme-color` `#16181D`, `metadataBase`-resolved absolute image URLs.
- `curl -s http://localhost:3000/api/handover/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy` still returns `"icon":"http://localhost:3000/icon.png"`; that URL returns the new 256 px PNG.
- `/robots.txt` and `/sitemap.xml` render.

- [ ] **Step 11: Commit and close milestone M5**

```bash
git add .gitattributes web/assets web/scripts/make-favicon.mjs web/next.config.ts web/src/lib/og.tsx web/src/app
git commit -m "feat(web): branded link previews (site and per deal), icons, favicon, manifest, robots and sitemap" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

On the Preview: `curl -sI <preview>/opengraph-image` → `200` and `content-type: image/png`; open a deal's `og:image` URL from its page source → `200` (proves the font file ships with the function). Ask the user to paste one Preview deal link into a WhatsApp chat with themselves and report whether the card shows.
Report M5: works / doesn't / next.

---

### Task 15: How it works and Safety

**Files:**
- Create: `web/src/app/(site)/how-it-works/page.tsx`

**Interfaces:**
- Consumes: `Timetable`, `StatusChip`, `Icon`, `ButtonLink`, `SectionHeader`, `ScenarioGrid`, `CtaBand`, `SCENARIOS`, `explorerAddress`, `idl.address`.
- Produces: `/how-it-works` with anchors `#rules`, `#what-if`, `#no-arbiter`, `#limits` (the FAQ links to `#limits`).

- [ ] **Step 1: Write `web/src/app/(site)/how-it-works/page.tsx`**

```tsx
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { Timetable } from "@/components/ui/Timetable";
import { SCENARIOS } from "@/content/scenarios";
import idl from "@/idl/keysfirst.json";
import { explorerAddress } from "@/lib/format";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "How it works and safety",
  description: "Two rules and a clock: only the tenant's scan at the handover pays the landlord, and only the deadline sends the deposit back. Plus the honest limits.",
};

// Product spec §6, in plain words. Keep in step with the program.
const RULES = [
  "Only the landlord can create a deal, and they can cancel it until someone pays.",
  "The tenant pays the exact amount into the lock, before the deadline. The landlord can't pay their own deal.",
  "Paying only works if the money would be locked for at most 180 days.",
  "Only the tenant who paid can release the deposit to the landlord, from 24 hours before move-in until the deadline.",
  "The landlord can give the deposit back to the tenant at any time.",
  "After the deadline, anyone can send the deposit back to the tenant.",
  "Every deal settles once. The money only ever goes to the tenant or the landlord, and the deal stays on Solana as a receipt.",
];

// Product spec §10, in plain words. Never soften these.
const LIMITS = [
  "Someone pressured into scanning from far away close to move-in can still be tricked. The 24-hour rule and clear wallet messages reduce this risk; they don't remove it.",
  "At the door the tenant scans first, so a landlord could take the money and keep the keys. That would be theft by a known person at a real address, far rarer than the anonymous online scam.",
  "A fake copy of this website isn't covered. A verified domain is on the roadmap.",
  "Keysfirst proves the room exists and the keys work, not that the person may legally rent it out. Landlord verification is on the roadmap.",
  "Disputes after move-in, such as damage, are ordinary tenancy law.",
  "A tenant who doesn't show up gets the deposit back; the landlord loses only the time the room was reserved.",
  "On devnet the program can still be updated by its deploy key. Before real money it would be frozen or controlled by several people.",
  "How the service would be regulated hasn't been assessed yet.",
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label text-fg-muted">How it works and safety</p>
        <h1 className="mt-3 max-w-3xl font-display text-title font-bold">
          Two rules and a <span className="marker">clock</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lead text-fg-muted">
          Keysfirst doesn&apos;t decide anything. A public program on Solana applies the same rules to every deal: only the tenant&apos;s approval at
          the handover pays the landlord, and only the clock sends the deposit back.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
          <Timetable
            title="A deal, start to finish"
            rows={[
              { key: "create", time: "Step 1", title: "The landlord creates the deal", detail: "Room, amount, move-in and the latest handover, at most 14 days after move-in.", state: "done" },
              { key: "pay", time: "Step 2", title: "The tenant pays into the lock", detail: "The exact amount, before the deadline.", state: "done" },
              { key: "window", time: "24 h before move-in", title: "The handover window opens", detail: "From now until the deadline, the tenant can release the deposit.", state: "now" },
              { key: "door", time: "At the door", title: "The tenant scans the landlord's code", detail: "100% goes to the landlord, in seconds.", state: "next" },
              { key: "deadline", time: "After the deadline", title: "No handover?", detail: "100% goes back to the tenant. Anyone can trigger it.", state: "later" },
            ]}
          />
          <div className="grid gap-4">
            <div className="rounded-lg bg-released-soft p-5">
              <StatusChip status="released" />
              <p className="mt-3 text-body">When the tenant scans the landlord&apos;s code at the handover and approves in Phantom.</p>
            </div>
            <div className="rounded-lg bg-returned-soft p-5">
              <StatusChip status="refunded" />
              <p className="mt-3 text-body">When there&apos;s no handover by the deadline, or the landlord gives the deposit back earlier.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="rules" className="bg-subtle">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <SectionHeader id="rules" eyebrow="The rules" title="Who can do what, and when." />
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {RULES.map((rule, i) => (
              <li key={rule} className="flex gap-3 rounded-md bg-canvas p-4">
                <span className="font-display text-card font-bold text-fg-subtle tabular-nums">{i + 1}</span>
                <span className="text-body">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="what-if" eyebrow="What if…" title="Every hard question has a rule behind it." />
        <ScenarioGrid scenarios={SCENARIOS} />
      </section>

      <section aria-labelledby="no-arbiter" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <SectionHeader id="no-arbiter" eyebrow="Design choice" title="Why there's no judge in the middle." />
          <div className="space-y-4 text-body text-fg-muted">
            <p>
              Software can&apos;t see whether a room exists, and a judge chosen by the landlord could be the scammer&apos;s friend. The only reliable
              witness is the tenant standing in the room.
            </p>
            <p>
              So the tenant&apos;s approval is the only way to pay the landlord, and the clock is the only way back to the tenant. The worst case for
              an honest landlord: a tenant who never comes gets their deposit back, and the landlord loses time, not money.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="limits" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="limits" eyebrow="Honest limits" title="What Keysfirst doesn't do (yet)." lead="This is a prototype. Here is everything we know it can't protect against." />
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {LIMITS.map((limit) => (
            <li key={limit} className="flex gap-3 rounded-md border-[1.5px] border-rule p-4">
              <Icon name="alert" size={20} className="mt-0.5 shrink-0 text-fg-muted" />
              <span className="text-body">{limit}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-fg-muted">
          Every step of every deal leaves a public receipt.{" "}
          <a href={explorerAddress(idl.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2">
            See the program on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`, `npm run build` → `/how-it-works` is `○ (Static)`.
Browser at 375 and 1280 px: the timetable and the two outcome cards, seven rules, eight scenario cards, the no-judge section and eight limits; `/how-it-works#limits` lands on the limits heading just below the sticky header (the `SectionHeader` heading carries `scroll-mt-24`). Compare `RULES` and `LIMITS` word for word with product spec §6 and §10: nothing softened, nothing added. No console errors, no horizontal scroll.

- [ ] **Step 3: Commit**

```bash
git add "web/src/app/(site)/how-it-works"
git commit -m "feat(web): How it works and safety page with the rules, what-ifs, the no-arbiter choice and honest limits" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: FAQ

**Files:**
- Create: `web/src/components/marketing/OpenHashDetails.tsx`
- Create: `web/src/app/(site)/faq/page.tsx`

**Interfaces:**
- Consumes: `FAQ` (Task 11), `FaqList`, `SectionHeader`, `CtaBand`.
- Produces: `/faq` where `#<entry id>` (e.g. `#devnet` from the ribbon) opens and shows that answer.

- [ ] **Step 1: Write `web/src/components/marketing/OpenHashDetails.tsx`**

```tsx
"use client";

import { useEffect } from "react";

/** Opens the <details> named in the URL hash, e.g. /faq#devnet from the devnet ribbon. */
export function OpenHashDetails() {
  useEffect(() => {
    const open = () => {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target instanceof HTMLDetailsElement) {
        target.open = true;
        target.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
```

- [ ] **Step 2: Write `web/src/app/(site)/faq/page.tsx`**

```tsx
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { OpenHashDetails } from "@/components/marketing/OpenHashDetails";
import { FAQ } from "@/content/faq";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "How Keysfirst works, who holds the money, what German law says about deposits, wallets, test money and the prototype.",
};

export default function FaqPage() {
  return (
    <>
      <OpenHashDetails />
      <div className="mx-auto max-w-read px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
        <p className="label text-fg-muted">FAQ</p>
        <h1 className="mt-3 font-display text-title font-bold">Questions and answers</h1>
        <p className="mt-4 text-lead text-fg-muted">Plain answers about the deposit, the handover, wallets and this prototype.</p>
        {FAQ.map((group) => (
          <section key={group.id} aria-labelledby={`faq-${group.id}`} className="mt-12">
            <h2 id={`faq-${group.id}`} className="label mb-3 text-fg-muted">
              {group.title}
            </h2>
            <FaqList entries={group.entries} />
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`, `npm run build` → `/faq` is `○ (Static)`.
Browser at 375 and 1280 px: four groups; each question opens and closes with a click, Enter or Space; the chevron turns. Click "What's devnet?" in the ribbon from another page: `/faq#devnet` opens the devnet answer below the header. Read the §551 BGB answer against the brand guidelines (only the wording given in Task 11). No console errors.

- [ ] **Step 4: Commit and close milestone M6's Tier 2**

```bash
git add web/src/components/marketing/OpenHashDetails.tsx "web/src/app/(site)/faq"
git commit -m "feat(web): FAQ page with grouped answers and deep links that open the right question" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 17 (Tier 3, cut first): For tenants, For landlords, About and page-specific previews

Cut order if time runs out: skip Step 3 (About) first, then Steps 1–2 (tenants, landlords), then Step 4 (previews). For every page you skip, apply the cut rule from "Schedule and milestones" (navigation, footer, sitemap, Ask-your-landlord link) and remove the corresponding `href`s in `AudienceSplit.tsx` and the landing hero (point them at `/how-it-works`).

**Files:**
- Create: `web/src/app/(site)/tenants/page.tsx`, `web/src/app/(site)/landlords/page.tsx`, `web/src/app/(site)/about/page.tsx`
- Create: `web/src/app/(site)/{how-it-works,faq,tenants,landlords,about}/opengraph-image.tsx`

**Interfaces:**
- Consumes: `StepList`, `ScenarioGrid`, `scenariosFor`, `SectionHeader`, `CtaBand`, `AskLandlord`, `ButtonLink`, `Callout`, `Icon`, `ogCard`, `OG_SIZE`, `OG_CONTENT_TYPE`.
- Produces: `/tenants`, `/landlords`, `/about`, and a page-specific link preview for each content page.

- [ ] **Step 1: Write `web/src/app/(site)/tenants/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { AskLandlord } from "@/components/marketing/AskLandlord";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StepList, type Step } from "@/components/marketing/StepList";
import { ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { scenariosFor } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "For tenants",
  description: "Pay the deposit before you arrive without trusting a stranger: it waits in a lock until you're in the room with the keys.",
};

const STEPS: Step[] = [
  { pictogram: "share-link", title: "Ask for a deposit link", text: "Your landlord creates it in a minute and sends it to you." },
  { pictogram: "pay-into-lock", title: "Pay into the lock", text: "From your phone, inside Phantom. The money waits; the landlord can't take it." },
  { pictogram: "scan-at-door", title: "At the door: check, then scan", text: "Look at the room, take the keys, then scan the landlord's code. Only then are they paid." },
  { pictogram: "back-to-you", title: "No handover? It comes back", text: "If you never scan, the deposit returns to you after the deadline." },
];

const NEEDS = [
  { href: "/start#install", title: "Phantom", text: "A wallet app for your phone." },
  { href: "/start#devnet", title: "Solana Devnet", text: "The test network, switched on in Phantom." },
  { href: "/start#funds", title: "Test money", text: "Free: 1,000 Test EUR from the guide." },
];

export default function TenantsPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label text-fg-muted">For tenants</p>
        <h1 className="mt-3 max-w-3xl font-display text-title font-bold">Pay the deposit before you arrive, without trusting a stranger.</h1>
        <p className="mt-5 max-w-2xl text-lead text-fg-muted">
          Your deposit waits in a lock until you&apos;re standing in the room with the keys. Your landlord is paid when you scan their code at the
          door. If that never happens, it comes back to you.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <AskLandlord />
          <ButtonLink href="/start" variant="quiet">
            Get started
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="your-steps" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <SectionHeader id="your-steps" eyebrow="How it works for you" title="Four steps, and the money never goes to a stranger." />
            <div className="mt-8">
              <StepList steps={STEPS} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="label text-fg-muted">What you need</h3>
            <ul className="grid gap-3">
              {NEEDS.map((need) => (
                <li key={need.href}>
                  <Link href={need.href} className="block rounded-md border-[1.5px] border-rule bg-canvas p-4 hover:border-fg">
                    <span className="font-display text-card font-bold">{need.title}</span>
                    <span className="mt-1 block text-body text-fg-muted">{need.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Callout tone="info" title="If someone won't use a deposit link, ask why.">
              An honest landlord is paid the moment you get the keys. And under §551 BGB you don&apos;t have to pay the full deposit before the tenancy
              starts.
            </Callout>
          </div>
        </div>
      </section>

      <section aria-labelledby="tenant-what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="tenant-what-if" eyebrow="What if…" title="The questions tenants ask us." />
        <ScenarioGrid scenarios={scenariosFor("tenant")} />
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 2: Write `web/src/app/(site)/landlords/page.tsx`**

```tsx
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ScenarioGrid } from "@/components/marketing/ScenarioGrid";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StepList, type Step } from "@/components/marketing/StepList";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { scenariosFor } from "@/content/scenarios";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "For landlords",
  description: "Show tenants abroad you're genuine and get the deposit at the door, in seconds, with no chargeback.",
};

const WHY: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: "key", title: "Trust from the first message", text: "Your tenant can pay before arriving without taking your word for it." },
  { icon: "clock", title: "Paid at the door", text: "The deposit reaches your wallet in seconds, before you hand over the keys, and it can't be charged back." },
  { icon: "check", title: "Free while it's a prototype", text: "Keysfirst runs on Solana's test network with test money." },
];

const STEPS: Step[] = [
  { pictogram: "laptop-wallet", title: "Create a deposit link", text: "Room, amount, move-in and the latest handover." },
  { pictogram: "share-link", title: "Send it to your tenant", text: "They pay into the lock. You see it on the deal page and in My deals." },
  { pictogram: "scan-at-door", title: "Start the handover", text: "At the door, your phone or laptop shows a code. Your tenant checks the room and scans it." },
  { pictogram: "keys-change-hands", title: "Released: hand over the keys", text: "Your screen turns green in seconds. Then the keys change hands." },
];

export default function LandlordsPage() {
  return (
    <>
      <section className="mx-auto max-w-page px-4 pt-10 pb-14 sm:px-6 lg:px-10 lg:pt-16">
        <p className="label text-fg-muted">For landlords</p>
        <h1 className="mt-3 max-w-3xl font-display text-title font-bold">
          Get the deposit at the <span className="marker">door</span>, in seconds.
        </h1>
        <p className="mt-5 max-w-2xl text-lead text-fg-muted">
          Tenants abroad can&apos;t check you out before they arrive. A deposit link shows you&apos;re genuine: they pay into a lock, and you&apos;re
          paid the moment they scan your code at the handover.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ButtonLink href="/new" size="lg">
            Create a deposit link
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="quiet">
            How it works
          </ButtonLink>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {WHY.map((item) => (
            <li key={item.title} className="border-t-2 border-fg pt-5">
              <Icon name={item.icon} size={28} />
              <h2 className="mt-3 font-display text-card font-bold">{item.title}</h2>
              <p className="mt-2 text-body text-fg-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="landlord-steps" className="bg-subtle">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
          <div>
            <SectionHeader id="landlord-steps" eyebrow="How it works for you" title="From link to keys in four steps." />
            <div className="mt-8">
              <StepList steps={STEPS} />
            </div>
          </div>
          <div className="self-start rounded-lg border-2 border-fg bg-canvas p-6">
            <h3 className="font-display text-card font-bold">What if the tenant never comes?</h3>
            <p className="mt-3 text-body text-fg-muted">
              Then the deposit goes back to them after the deadline, and you lose the time the room was reserved, not money. That&apos;s the trade:
              the tenant carries the bigger risk (paying a stranger), so the default protects them.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="landlord-what-if" className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <SectionHeader id="landlord-what-if" eyebrow="What if…" title="The questions landlords ask us." />
        <ScenarioGrid scenarios={scenariosFor("landlord")} />
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 3: Write `web/src/app/(site)/about/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "About",
  description: "Why Keysfirst exists, how the prototype is built, and what comes next.",
};

const BUILT = [
  "A program on Solana, written with Anchor, with 42 automated tests including the money rules.",
  "Solana Pay for the code the tenant scans at the handover.",
  "A Next.js web app. Deals are read straight from Solana; there is no database.",
];

const ROADMAP = [
  "EURC, Circle's euro stablecoin, on Solana mainnet.",
  "Ways to get euro stablecoins inside the flow.",
  "Landlord verification.",
  "A verified domain, so fake copies of the site are easy to spot.",
  "Holding the deposit for the whole tenancy.",
  "Locking the program's upgrade key or sharing it between several people.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-read px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
      <p className="label text-fg-muted">About</p>
      <h1 className="mt-3 font-display text-title font-bold">About Keysfirst</h1>

      <section aria-labelledby="why" className="mt-10 space-y-4 text-body">
        <h2 id="why" className="font-display text-section font-bold">
          Why it exists
        </h2>
        <p>
          International students often rent a room in Germany before they arrive. Fake landlords know this: they post a room, ask for the deposit
          before any viewing, and disappear. Booking platforms only protect bookings made on their own platform.
        </p>
        <p>Keysfirst turns the key handover into the moment the deposit moves: no keys, no money.</p>
      </section>

      <section aria-labelledby="what" className="mt-12 space-y-4 text-body">
        <h2 id="what" className="font-display text-section font-bold">
          What it is
        </h2>
        <p>
          A working prototype for Superteam Germany&apos;s &ldquo;Build an MVP with Solana at WHU&rdquo; challenge. It runs on Solana&apos;s test
          network with test money.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted">
          {BUILT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next" className="mt-12 space-y-4 text-body">
        <h2 id="next" className="font-display text-section font-bold">
          What comes next
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted">
          {ROADMAP.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="who" className="mt-12 space-y-4 text-body">
        <h2 id="who" className="font-display text-section font-bold">
          Who built it
        </h2>
        <p>Built by a business student at WHU with AI coding tools (Claude Code and solana.new).</p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/how-it-works#limits" variant="secondary">
          The honest limits
        </ButtonLink>
        <ButtonLink href="/faq" variant="quiet">
          FAQ
        </ButtonLink>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the page-specific link previews**

`web/src/app/(site)/how-it-works/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "How Keysfirst works: two rules and a clock";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "How it works", title: "Two rules and a clock.", subtitle: "Only the tenant's scan pays the landlord. Only the deadline sends the deposit back." });
}
```

`web/src/app/(site)/faq/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst questions and answers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "FAQ", title: "Questions and answers.", subtitle: "The deposit, the handover, wallets and test money, in plain words." });
}
```

`web/src/app/(site)/tenants/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst for tenants";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "For tenants", title: "Pay the deposit before you arrive, without trusting a stranger." });
}
```

`web/src/app/(site)/landlords/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Keysfirst for landlords";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "For landlords", title: "Get the deposit at the door, in seconds." });
}
```

`web/src/app/(site)/about/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "About Keysfirst";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ kicker: "About", title: "A deposit link that moves only when the keys do." });
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint`, `npm run build` → the three pages and five images are `○ (Static)`.
Browser at 375 and 1280 px: `/tenants` (Ask your landlord works; "What you need" links land on the guide's steps), `/landlords`, `/about`; every link in the header, the mobile menu and the footer resolves (no 404). View source on each content page: its own `og:image`. No console errors, no horizontal scroll.

- [ ] **Step 6: Commit and close milestone M6**

```bash
git add "web/src/app/(site)"
git commit -m "feat(web): For tenants, For landlords and About pages with their own link previews" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Report M6: works / doesn't / next (and anything cut).

---

### Task 18: Accessibility audit (WCAG 2.1 AA)

**Files:**
- Modify: whichever files the audit flags (fixes only; no new features)
- Create: `docs/audits/2026-10-01-accessibility.md` (findings and fixes)

**Interfaces:**
- Consumes: every page from Tasks 4–17; the `design:accessibility-review` skill (supporting skill chosen on 2026-09-27).

- [ ] **Step 1: Run the skill's checklist**

Invoke the `design:accessibility-review` skill for these URLs (dev server): `/`, `/how-it-works`, `/faq`, `/tenants`, `/landlords`, `/about`, `/start`, `/new`, `/deals`, `/dev/deal` (all phases), `/dev/deals`, `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy`, `/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy/handover`, `/this-does-not-exist`. Follow its WCAG 2.1 AA quick reference (1.1.1, 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.5.5, 3.2.1, 3.3.1, 3.3.2, 4.1.2).

- [ ] **Step 2: Automated structure check on every URL above**

Run this in the page (browser tool `javascript_exec`) and write every non-empty result into the audit file:

```js
(() => {
  const issues = [];
  document.querySelectorAll("img:not([alt])").forEach((el) => issues.push(["img without alt", el.outerHTML.slice(0, 90)]));
  document.querySelectorAll("button, a[href]").forEach((el) => {
    const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
    if (!name) issues.push(["control without a name", el.outerHTML.slice(0, 90)]);
  });
  document.querySelectorAll("input, select, textarea").forEach((el) => {
    if (el.type === "hidden") return;
    const labelled = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest("label");
    if (!labelled) issues.push(["field without a label", el.outerHTML.slice(0, 90)]);
  });
  const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => issues.push(["duplicate id", id]));
  const levels = [...document.querySelectorAll("h1, h2, h3, h4")].map((h) => Number(h.tagName[1]));
  if (levels.filter((l) => l === 1).length !== 1) issues.push(["h1 count is not 1", levels.filter((l) => l === 1).length]);
  levels.forEach((l, i) => { if (i > 0 && l - levels[i - 1] > 1) issues.push(["heading level skipped", `h${levels[i - 1]} -> h${l}`]); });
  if (!document.querySelector("main#main")) issues.push(["no main#main landmark", ""]);
  if (document.documentElement.scrollWidth > innerWidth) issues.push(["horizontal scroll", document.documentElement.scrollWidth]);
  return issues;
})()
```

Expected: `[]` on every page. (The UI and deal galleries may repeat ids across their demo sections; ignore duplicates inside `/dev/*` only.)

- [ ] **Step 3: Manual checks**

1. **Keyboard only** on `/`, `/new`, `/deals`, `/dev/deal`, `/faq`: Tab reaches every control in reading order; the focus ring (white gap, ink ring, yellow halo) is always visible; Enter/Space activate; Esc closes every sheet and focus returns to its opener; "Skip to content" is the first Tab stop.
2. **Contrast**: only the token pairs from the brand guidelines appear; spot-check with dev tools on the devnet ribbon, the status chips on every band, the muted text on `bg-subtle`, the footer's muted text, and the Released screen.
3. **Zoom and reflow**: 200 % browser zoom at 1280 px and a 320 px wide viewport (`resize_window` 320 × 800): no horizontal scroll, nothing cut off.
4. **Reduced motion**: emulate `prefers-reduced-motion: reduce`: the marker, flips, Released entry, sheets and the pulsing dot are static; everything still works.
5. **Screen reader spot check** (VoiceOver on the user's iPhone or NVDA if available): the deal status announces once when it changes; the countdown doesn't chatter.
6. **Touch targets**: every interactive element is at least 44 × 44 px at 375 px wide (check the header buttons, chips, the FAQ summaries, the copy buttons).

- [ ] **Step 4: Fix, re-check, record**

Fix every finding in the component that causes it, re-run Steps 2–3 for the affected pages, and write `docs/audits/2026-10-01-accessibility.md`: date, pages, method, findings (page, criterion, problem, fix, commit), and anything left open with the reason.

- [ ] **Step 5: Commit**

```bash
git add -A web/src docs/audits
git commit -m "fix(web): accessibility audit fixes (WCAG 2.1 AA) and audit notes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Lighthouse on the landing page (mobile ≥ 90 × 4)

**Files:**
- Modify: whichever files the reports flag
- Modify: `docs/audits/2026-10-01-accessibility.md` → add a "Lighthouse" section (or create `docs/audits/2026-10-01-lighthouse.md`)

- [ ] **Step 1: Measure the Preview with PageSpeed Insights (no install)**

Push the branch, then run (replace `<preview>` with the Preview URL; the Preview is public after Task 4's check):

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<preview>/&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo" -o psi.json
node -e "const r=require('./psi.json').lighthouseResult; for (const [k,v] of Object.entries(r.categories)) console.log(k, Math.round(v.score*100)); console.log('LCP', r.audits['largest-contentful-paint'].displayValue, 'TBT', r.audits['total-blocking-time'].displayValue, 'CLS', r.audits['cumulative-layout-shift'].displayValue)"
```

Delete `psi.json` afterwards (don't commit it). Vercel marks Preview deployments `noindex`, so the SEO score there loses the "page is blocked from indexing" audit; every other SEO audit must pass. The final SEO number is measured on production in Task 20.

- [ ] **Step 2: Fix what keeps a score under 90**

Typical causes and fixes, in this order:
- JavaScript on `/`: dev tools → Network (disable cache) on the production build (`npm run build` then `npx next start -p 3100`): no chunk may contain `@solana` or `@anchor-lang`; if one does, find the import that pulls the wallet code into the `(site)` group and move it behind the `(app)` layout.
- Fonts: only four font files load (Barlow 400/600, Barlow Semi Condensed 600/700). If a fifth appears, a weight crept into `fonts.ts`.
- LCP: the H1 must be visible without waiting for animation (only the timetable card uses `animate-rise`).
- CLS: nothing above the fold may move after load (the wallet chip only lives in the app header, not on `/`).
- Best practices: no console errors, no 404s for icons (`/favicon.ico`, `/icon.svg`, `/apple-icon`).

Re-measure after each fix batch (at most two rounds), then record the four scores, LCP, TBT and CLS in the audit notes.

- [ ] **Step 3: Commit**

```bash
git add -A web/src docs/audits
git commit -m "perf(web): landing page Lighthouse fixes and scores" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 20: Final verification, the user's Phantom regression, merge

**Files:**
- Modify: `CLAUDE.md` (redesign notes), this plan (ticks), `docs/audits/…` (final numbers)

- [ ] **Step 1: Full checks**

Run (in `web/`): `npm test` → all pass; `npm run lint` → no errors; `npm run build` → succeeds, and the route table shows every marketing page and `/start`, `/new` as `○ (Static)`.

- [ ] **Step 2: Browser tour at 375 and 1280 px**

Visit and screenshot every route: `/`, `/how-it-works`, `/faq`, `/tenants`, `/landlords`, `/about`, `/start`, `/new` (steps 1–3), `/deals` (logged out), a released deal, its hand-off page, `/this-does-not-exist`, and on the dev server `/dev/deal` for every phase plus handover mode and the Released screen. For each: no console errors, no horizontal scroll, header and footer links resolve. Share the phone and desktop screenshots of the landing page, a deal page and handover mode with the user.

- [ ] **Step 3: Update `CLAUDE.md`**

Append:

```markdown
- Redesign (Sep–Oct 2026): brand "Clear Rules" in docs/brand-guidelines.md, tokens and components in docs/design-system.md (Tailwind v4 @theme in web/src/app/globals.css; only semantic colour utilities exist). Spec: docs/superpowers/specs/2026-09-28-keysfirst-redesign-design.md, plan: docs/superpowers/plans/2026-09-28-keysfirst-redesign.md.
- Route groups: web/src/app/(site) = static marketing pages with no wallet code (keep it that way: Lighthouse); web/src/app/(app) = wallet pages under one Providers + connect sheet. Dev galleries at /dev/ui, /dev/deal, /dev/deals (404 in production).
- Deal logic for the UI lives in web/src/lib/deal-view.ts (next-step matrix, tested); never offer an action that rules.ts availableActions() doesn't return.
```

- [ ] **Step 4: Hand the user the Phantom regression checklist (on the Preview)**

Send the Preview URL and these steps (spec §13); wait for their results:

1. Create a deal on the laptop with the Phantom extension (try "Use demo values"): it lands on the deal page with "Your deposit link is ready" and the share box.
2. Pay as the tenant on the iPhone inside Phantom's browser (Open in Phantom if needed): the deal shows "Deposit locked".
3. Landlord: "Start the handover" (full-screen QR). Tenant: scan it with the iPhone Camera, tap "Approve in Phantom", approve. The landlord's screen turns green: "Released: hand over the keys."
4. With a second, funded deal: scan with a different Phantom wallet. Phantom refuses and nothing moves; switching back to the paying wallet works.
5. Landlord gives the deposit back (confirmation dialog): the deal shows "Returned to tenant".
6. A 5-minute demo deal expires; a third wallet opens it and taps "Return the deposit to the tenant": "Returned to tenant".
7. Cancel an unpaid deal (confirmation dialog): "Cancelled".
8. Inside Phantom's browser, the tenant uses "I have the keys: release the deposit" in the handover window (confirmation dialog): "Released to landlord".
9. My deals shows each of these deals with the right role, status and next step, as landlord and as tenant.

Fix anything that fails (systematic-debugging first), push, and ask the user to re-run only the failed steps.

- [ ] **Step 5: Merge after the user approves the Preview**

Use superpowers:finishing-a-development-branch. Default (the user's process): on the user's explicit approval, `git checkout main`, `git merge --no-ff redesign -m "Merge the Keysfirst redesign" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`, `git push`. Then on production (https://keysfirst.vercel.app):
- The landing page, a deal page and the hand-off page load; `curl -s https://keysfirst.vercel.app/api/handover/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy` returns the label JSON; `/icon.png` is the new PNG.
- Re-run Task 19's PageSpeed Insights command against `https://keysfirst.vercel.app/` and record the final four scores (SEO now without the Preview's `noindex`).
- Report to the user: what works, what doesn't, what's next (Fri: rehearsal and demo wallets from the original plan's Task 15, README, deck; when the repository becomes public, add an FAQ entry "Where can I see the code?" that links to it).

- [ ] **Step 6: Commit the notes**

```bash
git add CLAUDE.md docs/superpowers/plans/2026-09-28-keysfirst-redesign.md docs/audits
git commit -m "docs: redesign done; CLAUDE.md notes, final checks and Lighthouse scores" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

## Not in this plan (by decision)

- Email or social login, embedded wallets, dark mode, other languages, analytics, cookie banner, keeper bot, landlord verification (spec §14).
- Program changes or redeploys (Global Constraints).
- New dependencies beyond the approved font file (Global Constraints).
- The original plan's Tasks 15–17 (rehearsal, README, deck, video, submission) follow on Fri–Sat.
