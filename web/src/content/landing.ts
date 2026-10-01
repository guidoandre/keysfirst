import { formatEur, fromCents } from "@/lib/format";
import { priceBreakdown } from "@/lib/pricing";
import type { DealStatus } from "@/lib/rules";
import { feeLine } from "./fees";

/** Who the landing page speaks to. The toggle in the hero rewrites the page for one of the two. */
export type LandingRole = "tenant" | "landlord";

export const ROLE_OPTIONS: Array<{ value: LandingRole; label: string }> = [
  { value: "tenant", label: "I'm renting" },
  { value: "landlord", label: "I'm letting" },
];

interface Link {
  label: string;
  href: string;
}

export const HERO: Record<LandingRole, { eyebrow: string; lead: string; primary: Link; secondary: Link }> = {
  tenant: {
    eyebrow: "Renting a room in Europe from abroad",
    lead: "Pay the deposit before you arrive without trusting a stranger. It goes to the landlord only when you approve at the door: scan their code or tap “I have the keys”. If you never do, you can take it back after the deadline.",
    primary: { label: "Ask your landlord for a deposit link", href: "#ask" },
    secondary: { label: "How it protects me", href: "/tenants" },
  },
  landlord: {
    eyebrow: "Letting a room to someone abroad",
    lead: "Show you are genuine and get paid at the handover: the deposit reaches your Keysfirst balance in seconds, and your payout can't be charged back. Landlords pay nothing.",
    primary: { label: "Create a deposit link", href: "/new" },
    secondary: { label: "How the handover works", href: "/landlords#landlord-steps" },
  },
};

export const HERO_FACTS = ["Works with any listing", "Money only goes to the tenant or the landlord", "Rules run in a public program on Solana"];

export const PROBLEM: Record<LandingRole, { title: string; lead: string; items: Array<{ title: string; text: string }> }> = {
  tenant: {
    title: "Fake landlords look for tenants who can't visit.",
    lead: "Students often rent a room in another country before they arrive. That is exactly who the fake-landlord scam targets.",
    items: [
      { title: "A room appears online", text: "A nice room at a fair price, in a Facebook group or on a listing site." },
      { title: 'The "landlord" is abroad', text: 'They can\'t show you the room, but want the deposit now to "hold" it.' },
      { title: "You pay. They disappear.", text: "The money is gone, and so is the listing." },
    ],
  },
  landlord: {
    title: "Tenants abroad have learned not to trust strangers.",
    lead: "The fake-landlord scam targets people who rent before they arrive, so an honest landlord asking for a deposit looks like one more risk.",
    items: [
      { title: "You list a real room", text: "In a Facebook group, on a listing site or as a sublet of your own room." },
      { title: "Your tenant can't check you", text: "They're abroad and can't view the room, so a deposit request looks like the scam." },
      { title: "Send a deposit link instead", text: "They pay into the lock, and you're paid at the door when they approve the handover." },
    ],
  },
};

export const CLOSING: Record<LandingRole, { title: string; text: string }> = {
  tenant: {
    title: "Renting from abroad? Ask for a deposit link.",
    text: "Send your landlord a short message. If someone won't use a deposit link, ask why.",
  },
  landlord: {
    title: "Letting a room? Create a link in a minute.",
    text: "Your tenant pays into the lock, and you're paid at the door.",
  },
};

// ── The scripted demo deal: €600.00 of test money, paid by card, handover from 24 hours before a 1 Oct move-in ──

const eur = (cents: number) => formatEur(fromCents(cents));
const price = priceBreakdown(60_000, "card");
const AMOUNT = eur(price.depositCents);

export const DEMO_DEAL = { title: "Room in Leipzig", amount: AMOUNT };

export const LANDLORD_TERMS = [
  { label: "Your fee", value: eur(0) },
  { label: "When you're paid", value: "At the door, in seconds" },
  { label: "Chargebacks on your payout", value: "None" },
];

/** Where the deposit is: the tag on the demo's money track. */
export type MoneyAt = "tenant" | "lock" | "landlord";

/** Steps 0–3 are the happy path (link sent, paid, at the door, released); step 4 is the no-handover branch. */
export const DEMO_STEPS: Array<{ status: DealStatus; money: MoneyAt; caption: string; next: string }> = [
  { status: "open", money: "tenant", caption: `${AMOUNT} is still with the tenant.`, next: "Pay into the lock" },
  { status: "funded", money: "lock", caption: `${AMOUNT} is in the lock. Neither side can take it.`, next: "Go to the handover" },
  { status: "funded", money: "lock", caption: "Still in the lock until the tenant approves at the door.", next: "Approve: I have the keys" },
  { status: "released", money: "landlord", caption: `${AMOUNT} is with the landlord. The keys change hands.`, next: "Replay the deal" },
  { status: "refunded", money: "tenant", caption: `The deadline passed, so the tenant took ${AMOUNT} back.`, next: "Replay the deal" },
];

export const DEADLINE_STEP = 4;

/** Next goes one step forward; from the end of either path it replays the deal. */
export const nextStep = (step: number) => (step >= 3 ? 0 : step + 1);

/** "No handover?" is offered while the money is in the lock. */
export const canSkipToDeadline = (step: number) => step === 1 || step === 2;

export const stepLabel = (step: number) => (step === DEADLINE_STEP ? "Deadline." : `Step ${step + 1} of 4.`);

/** What each side's phone shows at each step, kept short. `button` advances the demo. */
export interface PhoneScreen {
  body: string;
  meta?: string;
  button?: string;
  qr?: true;
}

export const PHONE: Record<LandingRole, PhoneScreen[]> = {
  tenant: [
    { body: "Your landlord sent this link. They aren't paid until you have the keys.", meta: feeLine(price.depositCents), button: `Pay ${eur(price.totalCents)} by card` },
    { body: "Locked until you approve the handover at the door.", meta: "Handover from 24 h before move-in" },
    { body: "Check the room first. Approve only with the keys in your hand.", button: "I have the keys" },
    { body: "Paid to your landlord. Take the keys.", meta: "Public receipt on Solana" },
    { body: "No handover by the deadline, so you took it back.", meta: "Public receipt on Solana" },
  ],
  landlord: [
    { body: "Share this link with your tenant.", button: "Share on WhatsApp" },
    { body: "Your tenant paid into the lock. You're paid when they approve at the door.", button: "Start the handover" },
    { body: "Waiting for your tenant to approve…", qr: true, meta: "Show this code at the door" },
    { body: "Released: hand over the keys.", meta: "In your Keysfirst balance" },
    { body: "No handover by the deadline. It went back to your tenant." },
  ],
};
