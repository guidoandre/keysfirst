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
    answer: "Nobody can hand you real keys, so you never scan and the fake landlord is never paid. After the deadline you can take the deposit back.",
    rule: "Only the tenant's approval at the handover pays the landlord.",
    audience: "tenant",
    pictogram: "fake-listing",
  },
  {
    id: "not-as-described",
    question: "What if the room isn't as described?",
    answer: "Don't scan. Ask the landlord to give the deposit back, which they can do at any time, or wait for the deadline and take it back.",
    rule: "No approval, no payment. The landlord can always give it back.",
    audience: "tenant",
    pictogram: "scan-at-door",
  },
  {
    id: "cant-travel",
    question: "What if I can't travel?",
    answer: "The deposit stays in the lock, and after the deadline you can take it back. The landlord can also give it back earlier.",
    rule: "After the deadline anyone can send the deposit back to the tenant.",
    audience: "tenant",
    pictogram: "back-to-you",
  },
  {
    id: "no-show",
    question: "What if the tenant never shows up?",
    answer: "The deposit goes back to them after the deadline. You lose the time the room was reserved, not money.",
    rule: "After the deadline, anyone can send the deposit back to the tenant; nobody has to decide.",
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
    question: "What if I scan while logged in with the wrong account?",
    answer: "Nothing moves. Only the account that paid can confirm; log in with that account and scan again.",
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

export function scenariosFor(audience: "tenant" | "landlord"): Scenario[] {
  return SCENARIOS.filter((s) => s.audience === audience || s.audience === "both");
}
