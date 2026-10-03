# Keysfirst Redesign — Design Spec

Date: 2026-09-28 · Status: implemented (merged into main in 48d2b21) · Branch: `redesign` (production stays on `main`)
Deadline: finished, verified and merged by **Thu 1 Oct 2026, evening**. Fri–Sat are for rehearsal, README, deck and video.

Read with: [brand guidelines](../../brand-guidelines.md) · [design system](../../design-system.md) · [product spec](2026-09-27-keysfirst-design.md) (deal rules §6 and limitations §10 are unchanged) · [spike notes](../../spike.md).

## 1. Goal and definition of done

Turn the working skeleton into a complete, calm, trustworthy platform that an international student would trust with a €600 deposit, and that shows the judges a useful idea, a working prototype, a clear role for Solana and room to grow.

Done means:

- Every page in §4 works at 375 px (including inside Phantom's in-app browser on iPhone) and on desktop, with no horizontal scroll.
- WCAG 2.1 AA: contrast from the brand guidelines, keyboard access, visible focus, semantic HTML, alt text.
- Lighthouse (mobile) ≥ 90 for performance, accessibility, best practices and SEO on the landing page.
- `npm test`, `npm run lint` and `npm run build` are green; the new logic has unit tests (dashboard filtering and sorting, next steps, countdowns).
- Every page is checked in the browser (screenshots at 375 and 1280 px, no console errors).
- The user approves the Preview deployment, then `redesign` is merged to `main`; the user runs the Phantom regression checklist (§13).

## 2. Hard constraints (unchanged behaviour)

- No change to the on-chain program, the deal rules (product spec §6) or the deployment.
- The UI never offers an action the program would reject: every button comes from `availableActions()` in `web/src/lib/rules.ts`.
- Keep, exactly as they behave today (each fixes a bug found on a real phone):
  1. The landlord's QR encodes `https://<origin>/deal/<id>/handover`; that page links to `solana:<origin>/api/handover/<id>`.
  2. The Solana Pay endpoint `/api/handover/[id]` and its tenant-only check (`handoverProblem`).
  3. "Open in Phantom" wherever a phone browser has no wallet; everything works inside Phantom's in-app browser.
  4. Deal polling every 2 s pauses in hidden tabs; no automatic RPC retries on 429 (`disableRetryOnRateLimit`); transaction history is fetched only while a timeline link is missing.
  5. Action buttons re-check the live deal status before asking the wallet to sign.
  6. The wallet request icon is a PNG (`/icon.png`); the faucet's SOL top-up stays 0.02.
- Devnet only; never print or commit keys or secrets.
- No new dependencies. The one approved addition is a font file: Barlow Semi Condensed Bold TTF (SIL Open Font License) in `web/assets/`, used only to draw link-preview images.
- Copy: plain English, no blockchain jargon (brand guidelines §1 and §6), status labels exactly as in the product spec, amounts like €600.00, English only.
- Honesty: always labelled a devnet prototype with test money; no invented testimonials, numbers, logos or press; legal statements exactly as accurate as §551 BGB allows; limitations stated (product spec §10), including that the devnet program can still be upgraded by its deploy key.

## 3. Brand

Direction A, "Clear Rules", as specified in the brand guidelines and design system: ink and white with a Highlighter accent, Barlow Semi Condensed + Barlow, the key-as-timeline logo, pictograms, timetables as the signature component, split-flap status motion, and a calm, exact, fair voice. Light mode only.

## 4. Scope and pages

Build order and the cut order were agreed on 2026-09-27: all tiers are in scope; if Thursday gets tight, cut in this order: About → For tenants and For landlords → page-specific preview images.

| Route | Page | Tier | Group | Rendering |
|---|---|---|---|---|
| `/` | Landing | 1 | site | static |
| `/start` | Get started guide | 1 | app | static shell + wallet islands |
| `/new` | Create a deposit link | 1 | app | client flow |
| `/deal/[id]` | Deal page + landlord handover mode | 1 | app | server metadata + client |
| `/deal/[id]/handover` | Tenant hand-off page (QR target) | 1 | app | server |
| `/deals` | My deals | 1 | app | client |
| (system) | 404, error, loading, deal not found, empty states | 1 | root | — |
| (metadata) | Favicon, app icons, manifest, titles, descriptions, link previews for `/` and deals | 1 | root | — |
| `/how-it-works` | How it works and Safety | 2 | site | static |
| `/faq` | FAQ | 2 | site | static |
| `/tenants` | For tenants | 3 | site | static |
| `/landlords` | For landlords | 3 | site | static |
| `/about` | About | 3 | site | static |
| (metadata) | Page-specific link previews for the content pages | 3 | — | — |

### Route groups (performance decision)

The wallet library pulls in the whole Solana client, and today the providers wrap every page in the root layout, so even the landing page ships it: the baseline build (2026-09-28) loads **1,070 KB of raw JavaScript on `/`**. To reach Lighthouse ≥ 90 on phones:

- `app/layout.tsx` (root, server): `<html>`, fonts, skip link, devnet ribbon, footer. No wallet code.
- `app/(site)/layout.tsx`: the static site header. Its "Log in" button links to `/deals?login=1`, which opens the connect sheet in the app. Marketing pages don't show the connected-wallet chip.
- `app/(app)/layout.tsx`: wallet providers, the connect sheet and the wallet-aware app header.
- URLs don't change. Moving between groups is a normal client navigation; the wallet code loads when you first enter an app page.
- Marketing pages stay prerendered: nothing in the root layout or the site group reads request data (`headers()`, `getOrigin()`). Each marketing page exports `dynamic = "error"`, so the build fails if one turns dynamic. Share buttons on static pages read `window.location.origin` at click time.

## 5. Navigation and log-in

"Log in" means connecting a wallet. There's no account, email or social login (product spec "Won't" list; embedded wallets were considered and stay out).

- **Devnet ribbon** on every page: "Prototype on Solana devnet · test money only, nothing here has real value · What's devnet?" → `/faq#devnet`.
- **Site header** (marketing pages): logo; How it works · For tenants · For landlords · FAQ; "Get started" (quiet link); "Log in" (secondary button).
- **App header**:
  - logged out: How it works · FAQ; "Get started" and "Log in";
  - logged in: My deals · Create a deal · How it works · FAQ and the wallet chip (`7xKp…3mQe` with a green dot). The chip opens a menu: My deals · Get test funds · Copy address · Log out.
- **Phones:** logo, "Log in" or the wallet chip, and a menu button that opens a sheet with all links.
- **Current page:** `aria-current="page"` plus a Highlighter underline.
- **Connect sheet** ("Log in with your wallet"), a native `<dialog>`:
  - It explains a wallet in one line: "an app like Phantom that holds your money and approves payments. Keysfirst never sees your keys."
  - It lists detected wallets as large buttons, Phantom first. Choosing one calls `select(name)`; the provider connects on its own (autoConnect), or `connect()` runs when the same wallet is already selected.
  - No wallet on a phone: the "Open Keysfirst in Phantom" deep link plus a link to the guide.
  - No wallet on a desktop: "Install Phantom ↗" plus the guide link.
  - Footer: "Phantom must be set to Solana Devnet. How?" → `/start#devnet`.
  - The sheet closes when connected. Any "Log in", "Log in to pay" or "Log in to create" button opens it, and so does `?login=1`.
- **Footer**:
  - lockup and promise;
  - links: How it works, For tenants, For landlords, FAQ, About, Get started;
  - "The Keysfirst program on Solana Explorer ↗";
  - a devnet disclaimer.

## 6. Pages

### 6.1 Landing `/`

1. **Hero.**
   - Eyebrow: "Deposit protection for rooms in Germany".
   - H1: "The deposit moves only when the **keys** do." The Highlighter draws in under "keys".
   - Lead: "Keysfirst holds a rental deposit in a lock until the key handover. The tenant scans the landlord's code at the door and the landlord is paid in seconds. No handover? The money goes back to the tenant."
   - Primary button: "Create a deposit link" (note: "For landlords · free on devnet"). Quiet link: "I'm renting: how it protects me" → `/tenants`.
   - Beside the copy (below it on phones), the Timetable card "How your €600.00 moves" with three rows:
     1. Today: you pay into the lock.
     2. Move-in: you scan at the door, and the money goes to the landlord.
     3. Deadline: no handover, so it comes back to you.
   - Three facts under the hero: works with any listing · money only goes to tenant or landlord · automatic return after the deadline.
2. **The problem.**
   - H2: "Fake landlords look for tenants who can't visit."
   - Three pictogram steps: "A room appears online" → "The 'landlord' is abroad and wants the deposit first" → "You pay. They disappear."
   - Then: booking platforms protect only their own listings, while Keysfirst works with any.
   - The §551(2) BGB note: you don't have to pay the full deposit before the tenancy starts, because it can be paid in three monthly instalments, the first due at the start.
3. **How it works for each side:** two columns. "If you're renting": get a link → pay into the lock → scan at the door. "If you're letting": create a link → share it → show your code at the handover. Each column has its own call to action.
4. **What if…** Six cards, each with a question, a one-line answer and the rule behind it:
   - the landlord is fake;
   - the room isn't as described;
   - I can't travel;
   - the tenant never shows up;
   - someone asks me to scan before I arrive;
   - I scan with the wrong wallet.
5. **Why Solana.** Three facts:
   - final in seconds, so the keys can change hands at once (bank transfers take a day, cards can be charged back);
   - the rules are a public program, and the money only goes to the tenant or the landlord;
   - a clock nobody controls: after the deadline anyone can send the deposit back.

   Link: the program on Solana Explorer ↗.
6. **FAQ preview:** four questions, then "All questions".
7. **Closing band (ink):**
   - "Renting from abroad? Ask for a deposit link." with the "Ask your landlord" share button.
   - "Letting a room? Create one in a minute." with "Create a deposit link".
   - "New to wallets? Get started in 5 minutes →".

### 6.2 Get started `/start`

A step-by-step guide with drawn phone and laptop screens (pictogram line style, no Phantom logos). Each step has an anchor:

1. `#install`: install Phantom, on the phone from the App Store or Google Play, on a laptop as a browser extension (links to phantom.app).
2. `#devnet`: turn on Testnet Mode and choose Solana Devnet (Settings → Developer Settings → Testnet Mode).
3. `#funds`: log in and get test funds, inline, with the Log in button and "Get test funds" (1,000 Test EUR plus a little devnet SOL).
4. `#try`: try both sides. As the landlord, create a link on the laptop. As the tenant, open it on the phone inside Phantom's browser and pay. At the "door", the landlord starts the handover, and the tenant scans with the phone camera and approves in Phantom (or uses "I have the keys" in the app).
5. `#tips`, phone tips:
   - on iPhone, open links inside Phantom;
   - approve within a minute;
   - Phantom must be on the wallet that paid;
   - Phantom may warn about a new website: it's a devnet prototype, and a domain review was requested on 2026-09-27.

### 6.3 Create a deposit link `/new`

Three steps, one screen each, with Back and Next. A "Use demo values" quiet button fills in "Room in Vallendar", €600, move-in now and the 5-minute demo window, then jumps to step 3.

1. **The room:**
   - Room description, 1–64 bytes, with a counter; hint "Your tenant sees this".
   - Deposit in € (`parseEur`, `inputMode="decimal"`); hint "The exact amount your tenant pays".
2. **The handover:**
   - Move-in (`datetime-local` plus a "Now" button).
   - Latest handover as a segmented choice: 1 day · **3 days** (default) · 7 days · 14 days after move-in.
   - Below it, a separate, clearly labelled "Demo: 5-minute window (for trying it out)" toggle.
   - A live summary: "Handover window: from Wed 30 Sep, 14:00 (24 h before move-in) until Sun 4 Oct, 14:00."
   - Validation: the deadline must be in the future.
3. **Check and create:**
   - A preview of what the tenant will see: amount, room, and a timetable of pay → handover window → deadline → return.
   - Note: "Creating the link costs a tiny network fee in test SOL."
   - Primary button "Create deposit link" (large; shows "Log in to create" when logged out).
   - After approval, go to `/deal/<id>?created=1`, which shows a "Your link is ready: send it to your tenant" callout above the share box.

Validation errors appear under each field and in a summary on submit. Program logic (`randomDealId`, `createDealIx`, `signAndSend`, `friendlyError`) is unchanged.

### 6.4 Deal page `/deal/[id]` (`max-w-app`, one column)

Top to bottom:

1. The "link ready" callout, when `?created=1`.
2. **Deal hero:** a band in the status colour with the room, the amount, the status chip, "You're the landlord" or "You're the tenant", and one sentence explaining the state.
3. **Countdown panel.**
4. **Next step card.**
5. **Share box:** landlord, while the deal is open and before the deadline.
6. **Deal timetable:** rows with receipts.
7. **Details:** move-in, handover opens, deadline, and the deal on Solana Explorer ↗.

The phase comes from the rules functions: `open`, `open-expired`, `funded-before` (before the handover window), `funded-window`, `funded-expired`, `released`, `refunded`, `cancelled`. The next-step matrix derives from `availableActions()`:

| Phase | Landlord | Tenant | Anyone else / logged out |
|---|---|---|---|
| open | Share box (primary) · "Cancel this deal" (danger, confirm) | — (the payer becomes the tenant) | "Pay €600.00 into the lock" (large) + "Get test funds"; logged out: "Log in to pay" + Open in Phantom on phones |
| open-expired | "Nobody paid before the deadline." · "Cancel this deal" | — | "This link expired before anyone paid. Ask the landlord for a new one." |
| funded-before | "Handover opens Wed 30 Sep, 14:00." · "Give the deposit back" (secondary, confirm) | "Your handover opens Wed 30 Sep, 14:00. At the door, check the room, then scan the landlord's code." | "The deposit is locked until the handover or Sun 4 Oct, 14:00." |
| funded-window | **"Start the handover"** (opens handover mode) · "Give the deposit back" (secondary, confirm) | "At the door: check the room, then scan the landlord's code with your camera." · "I have the keys: release the deposit" (secondary, confirm) | as above |
| funded-expired | "The deadline passed without a handover." · "Give the deposit back to the tenant" (primary) | "Take the deposit back" (primary) | "Return the deposit to the tenant" (primary; logged out: "Log in to return it") |
| released | "Released on Thu 1 Oct, 14:07." | "The deposit went to the landlord on Thu 1 Oct, 14:07." | same |
| refunded | "The deposit went back to the tenant on …" | same | same |
| cancelled | "You cancelled this deal before anyone paid." | — | "The landlord cancelled this deal." |

The countdown panel shows:
- `open`: "Pay by … · in 2 days 4 h".
- `funded-before`: "Handover opens in 18 h 42 min".
- `funded-window`: "Handover deadline in …".
- `funded-expired`: "Deadline passed on …".
- Settled deals: nothing.

The timetable has four rows while open or funded: created ✓ · deposit locked (✓, or "waiting for the tenant") · key handover window (the "now" row when it's open) · "No handover by …? The deposit goes back to the tenant; anyone can trigger it". Settled deals show their real rows with receipt links (the `timelineSteps` logic is unchanged).

Confirmations use an in-page `<dialog>`, never `window.confirm` (in-app browsers can block it silently):
- release: "Only continue if you are holding the keys. €600.00 goes to the landlord immediately and can't be undone."
- cancel: "Cancel this deal? The link stops working."
- the landlord giving the deposit back: "Give €600.00 back to the tenant? This ends the deal."

Before signing, every action still re-fetches the live status (constraint 5).

When the status changes while the page is open, the chip flips. If the landlord is on the page when the deal becomes `released`, the Released screen opens by itself.

### 6.5 Handover mode and the Released screen (landlord)

"Start the handover" opens a full-screen view (`fixed inset-0`, above everything):
- A header on ink with the lockup, "Key handover · Room in Vallendar" and a Close button.
- The QR (`--qr-size`, white quiet zone) encoding `https://<origin>/deal/<id>/handover`.
- Three numbered steps:
  1. Let the tenant check the room.
  2. They scan this code with their phone camera and approve in Phantom.
  3. Hand over the keys when this screen turns green.
- A live line: "Waiting for the tenant to approve…" with a pulsing dot, and the deadline countdown.
- It asks for a screen wake lock while open, then re-requests it when the tab becomes visible again; it's ignored where unsupported.

Deal polling keeps running underneath (same hook). On `released`, the view becomes the Released screen:
- full green;
- "Released: hand over the keys.";
- "€600.00 is in your wallet now.";
- a receipt link and "Back to the deal".

It enters once (`animate-released`) and is announced with `role="status"`.

### 6.6 Tenant hand-off page `/deal/[id]/handover`

A server page (it needs no wallet) that fetches the deal:
- "Key handover · €600.00 · Room in Vallendar".
- A three-item checklist: "You are inside the room", "You have the keys, or they're in front of you", "Phantom is on the wallet that paid".
- The large primary link "Approve in Phantom" (`solana:` URL, unchanged).
- Notes: "Approve within a minute; if it expires, tap again for a fresh one" and "With any other wallet Phantom only says it could not load the request: switch wallets and tap again".
- A quiet link: "Open the deal page instead", for the in-app "I have the keys".
- If the deal is no longer locked, it says so instead (for example "This deposit was already released on …") and links to the deal page. If the fetch fails, it shows the checklist and button as today.

### 6.7 My deals `/deals`

- **Data:** two lookups per refresh: `program.account.deal.all([{ memcmp: { offset: 8, bytes: wallet } }])` (as landlord) and offset 40 (as tenant). Anchor adds the account-type filter itself. No database.
- **Refresh:** on load, on wallet change, when the tab becomes visible again (at most every 15 s), and with a "Refresh" button. There's no interval polling.
- **Filter:** All · Letting · Renting (segmented, with counts).
- **Order:**
  1. Needs you now: the handover window is open, a deposit can be taken or given back, or an expired open deal can be cancelled.
  2. Waiting: open deals, and locked deals before their window, soonest milestone first.
  3. Done: released, returned, cancelled, newest first.
- **Deal card:** room, amount, status chip, role, a countdown line ("Handover opens in 18 h", "Deadline in 2 days", "Deadline passed", "Released on 1 Oct"), the next-step text, and a link to the deal.
- **States:**
  - logged out: empty state with "Log in to see your deals" and Log in;
  - loading: three skeleton cards;
  - error: a callout with Retry, and the friendly message for 429;
  - no deals: "No deals yet", "Create a deposit link" for landlords, and for tenants "Waiting for a link? It appears here once you pay" plus "Ask your landlord".

### 6.8 How it works and Safety `/how-it-works`

1. "Two rules and a clock."
2. A large lifecycle timetable: create → pay → handover window (opens 24 h before move-in) → released when the tenant scans, or returned if there's no handover by the deadline (or the landlord gives it back).
3. The rules in plain words: who can do what, and when (product spec §6, every rule).
4. All "What if…" scenarios.
5. Why there's no arbiter (product spec §4).
6. **Honest limits:** every item of product spec §10 in plain words, including the upgrade key.
7. Every step leaves a receipt on Solana Explorer.

### 6.9 FAQ `/faq`

Grouped. Each group lists its questions:

1. **Basics:** what is Keysfirst; who is it for; how the landlord gets paid; what if I never get the keys; what it costs (devnet: nothing real; later: a small flat fee per deal, paid outside the lock, as a plan).
2. **Money and safety:** who holds the money (with the upgrade-key caveat); can the landlord take the money and keep the keys; can someone trick me into scanning early; the room isn't as described; the tenant doesn't show up; does this replace a rental contract (no); what German law says (§551 BGB: at most three months' rent without utilities; payable in three monthly instalments, the first at the start of the tenancy), plus "not legal advice".
3. **Wallets and test money:** what is a wallet, and why Phantom; `#devnet` what devnet and test money are; how to get test money; I can't connect on my phone; the QR code doesn't open anything; Phantom says the site may be unsafe.
4. **The prototype:** is this real money (no); why Solana; where the code is (link added when the repository is public).

### 6.10 For tenants, For landlords, About (Tier 3)

- **For tenants:**
  - "Pay the deposit before you arrive, without trusting a stranger."
  - Steps; what you need (links to the guide).
  - The red flag: "If someone won't use a deposit link, ask why."
  - The §551 note.
  - **Ask your landlord:** a pre-filled WhatsApp message plus Copy.
  - Tenant "What if…" cards and a call to action.
- **For landlords:**
  - "Get the deposit at the door, in seconds."
  - Why it helps: trust from abroad, paid at once, no chargebacks.
  - Create → share → handover mode → released.
  - A fair answer to "What if the tenant doesn't come?" and the Create call to action.
- **About:**
  - Why it exists.
  - What it is: a prototype for Superteam Germany's "Build an MVP with Solana at WHU".
  - How it's built: an Anchor program with 42 tests, Solana Pay, Next.js.
  - Roadmap: EURC on mainnet, landlord verification, a verified domain, a deposit held through the tenancy, on-ramps, a frozen or shared upgrade key.
  - Credit: "Built by a business student at WHU with AI coding tools (Claude Code and solana.new)." No name.

"Ask your landlord" message (WhatsApp and Copy): "Hi! Could we use Keysfirst for the deposit? You create a deposit link, I pay into it, and you get the money the moment I scan your code at the key handover: `<origin>/landlords`".

### 6.11 System states

- **404:** root `not-found.tsx` (it also catches every unmatched URL): "This page isn't on the timetable." with links to the landing page, My deals and Get started. It renders the static site header itself.
- **Error boundary:** `error.tsx` (client, uses Next 16.3's `retry()` prop): "Something went wrong on this page." with Try again, plus "Nothing moves without your approval in Phantom." Pages keep the devnet ribbon. `global-error.tsx` brings its own `<html>`, `<body>`, fonts and `globals.css`, with a React `<title>`.
- **Deal loading:** a skeleton for the hero and timetable; after 3 s without data it adds "Still connecting to Solana devnet…" (today's error details stay visible).
- **Deal not found:** "We can't find this deal. If it was just created, wait a few seconds." with Try again.
- **Invalid link:** "This isn't a valid deal link."
- **RPC busy (429):** "Solana devnet is busy right now. Wait a few seconds and try again." (`friendlyError`, unchanged).

## 7. Code structure

The visual layer is replaced; the logic stays.

| Keep as is | Change | New |
|---|---|---|
| `lib/rules.ts`, `lib/instructions.ts`, `lib/send.ts`, `lib/program.ts`, `lib/config.ts`, `lib/origin.ts`, `api/handover/[id]`, `api/faucet`, `test-eur.json`, `idl/` | `app/layout.tsx` (fonts, ribbon, footer, metadata), `globals.css` (tokens), `providers.tsx` (moved into the app group; the wallet library's modal provider and stylesheet dropped), `icon.png/route.tsx` (new logo, still PNG), `opengraph-image.tsx`, every page, all components | `lib/use-deal.ts` (today's polling logic moved out of `DealClient`, unchanged), `lib/use-my-deals.ts`, `lib/deal-view.ts` (phase and next-step matrix, pure), `lib/dashboard.ts` (summaries, sorting, filtering, pure), `lib/cx.ts`, format helpers (`formatCountdown`, `formatShortDateTime`, `shortAddress`, `whatsappUrl`), `components/ui/*`, `components/site/*`, `components/wallet/*`, `components/deal/*`, `components/marketing/*`, pictograms, route-group layouts |

Unit tests (vitest) cover `deal-view` (the whole matrix in §6.4, including never offering an action `availableActions` omits), `dashboard` (role detection, order, filters, counts, countdown lines), the new format helpers, and all existing tests.

## 8. Metadata, link previews, icons

- Title template "%s · Keysfirst"; a description for every page. The landing page writes its title out in full (the root template doesn't reach it). `/new` becomes a server `page.tsx` that exports metadata and renders the client flow.
- `metadataBase` comes from the build environment, never from request headers:
  - `https://keysfirst.vercel.app` in production;
  - `https://$VERCEL_BRANCH_URL` (or `$VERCEL_URL`) on Previews;
  - `http://localhost:3000` locally.
- `themeColor` moves to `export const viewport`.
- Metadata merges shallowly: a page that sets `openGraph` replaces the parent's.
- The per-deal image uses the `deal/[id]/opengraph-image.tsx` file convention. The hand-written `openGraph.images` in the deal page's `generateMetadata` is removed, because it would override the file.
- Preview images use `ImageResponse` from `next/og` with flexbox-only layout. They load `web/assets/fonts/BarlowSemiCondensed-Bold.ttf` with `readFile` at module scope (TTF, since `ImageResponse` can't read the woff2 files `next/font` serves), under the 500 KB bundle limit. `next.config.ts` adds `outputFileTracingIncludes` so the font ships with the request-time deal image on Vercel. All preview text uses that one approved font.
- **Link previews** (1200 × 630, drawn with `ImageResponse` in Barlow Semi Condensed Bold from `web/assets/`), all on white with the ink wordmark and the devnet line:
  - root: the yellow plate logo plus "The deposit moves only when the keys do.";
  - each content page (Tier 3): the page title plus one line;
  - each deal: "€600.00 deposit", the room, the status in words, and "Protected by Keysfirst: the landlord is paid only when the tenant scans at the door".
- **Icons:**
  - `app/icon.svg` holds the simplified key mark for browser tabs.
  - `app/favicon.ico` replaces Next's default triangle. It is a single-image ICO wrapping the 256 px PNG, written by a small dependency-free script.
  - `apple-icon.tsx` draws the 180 px home-screen icon.
  - `/icon.png` stays a route handler (the 256 px wallet request icon, new logo, still PNG), so no static `app/icon.png` can sit next to it.
  - A web manifest (`manifest.ts`: name, short name, theme `#16181D`, background `#FFFFFF`, icons `/icon.png` and `/apple-icon`).
  - The unused create-next-app files in `public/` (`next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg`) and the old `public/icon.svg` are deleted once nothing references them.

## 9. Motion

As in design system §8. Signature moments:
- the Highlighter draws in under "keys" on the landing hero;
- the status chip flips when a deal changes;
- the Released screen swings in once.

Everything else is a 200 ms rise or a 150 ms colour change, and reduced motion removes all of it.

## 10. Accessibility and performance

- Landmarks, a skip link, one `h1` per page, labelled controls, focus rings from the design system, native `<dialog>` for sheets and confirmations.
- Status changes are announced once; countdowns aren't announced every second.
- Marketing pages carry no wallet code (§4 route groups); at most four font files; no images except SVG and generated PNG previews; the QR code library loads only in handover mode.
- Lighthouse targets for the landing page (mobile) are in §1. Measure it with Lighthouse against the Preview deployment (PageSpeed Insights) or a local production build.

## 11. Delivery

The milestones follow the day plan. Each ends with `npm test`, `npm run lint` and `npm run build` green, browser checks at 375 and 1280 px, a commit on `redesign`, a push (Vercel Preview), and a short "works / doesn't / next" note. Plan checkboxes are ticked as tasks complete.

1. **Foundation (Tue):** tokens and fonts, logo, icons and pictograms, UI primitives, site and app chrome, connect sheet, route groups, `useDeal` moved out.
2. **The deal (Tue):** deal page, next-step matrix, handover mode, Released screen, hand-off page. The user does a quick phone check on the Preview.
3. **Create and My deals (Wed).**
4. **Landing and Get started (Wed).**
5. **States, metadata, icons, link previews (Wed evening).**
6. **Content pages (Thu morning):** How it works, FAQ, then Tier 3 in cut order.
7. **Audit and merge (Thu):** accessibility review (WCAG 2.1 AA), Lighthouse, fixes; the user runs the Phantom regression on the Preview; merge to `main` after approval.

Vercel Preview check on the first push:
- The build needs `NEXT_PUBLIC_MINT` and `NEXT_PUBLIC_RPC_URL` in the Preview environment. The faucet also needs `FAUCET_SECRET_KEY` there.
- Previews must not sit behind Vercel's login, or Phantom can't reach `/api/handover`.
- If either needs a settings change, the user makes it in Vercel.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Wallet code on marketing pages sinks Lighthouse | Route groups (§4); measure after milestone 1 |
| Preview behind Vercel login, or env vars missing | Check on the first push; the user flips the setting |
| Phantom's in-app browser quirks (`<dialog>`, wake lock, clipboard) | Progressive enhancement; phone check after milestone 2 |
| RPC rate limits from the My deals lookups | Two lookups per refresh, no polling, Helius RPC |
| Palette reset removes styles from not-yet-rebuilt pages | Acceptable on the branch; all old pages are replaced by milestone 4 |
| Time | Agreed cut order; the Tier 3 pages share components |

## 13. Phantom regression checklist (for the user, on the Preview)

1. Create a deal on the laptop (Phantom extension).
2. Pay as the tenant on the iPhone, inside Phantom's browser.
3. Landlord: Start the handover. Tenant: scan the QR with the iPhone Camera, then Approve in Phantom. The landlord's screen turns green ("Released: hand over the keys").
4. Scan with the wrong wallet: Phantom refuses, and nothing moves.
5. The landlord gives the deposit back (confirmation dialog), and the deal shows "Returned to tenant".
6. A 5-minute demo deal expires; a third wallet returns it to the tenant.
7. Cancel an unpaid deal (confirmation dialog).
8. The in-app "I have the keys: release the deposit" works inside Phantom's browser (confirmation dialog).
9. My deals shows each deal with the right role, status and next step.

## 14. Out of scope

Email or social login, embedded wallets, dark mode, other languages, analytics or tracking (so there's no cookie banner), program changes, new dependencies beyond the approved font file, a keeper bot, and landlord verification.
