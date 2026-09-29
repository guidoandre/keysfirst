import { COUNTRIES, LAW_CHECKED } from "./countries";

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

// Legal statements: only what the country entries in countries.ts (checked 29 September 2026) and the privacy policy support, worded as written there. Honest caveats stay in (brand guidelines §8).
export const FAQ: FaqGroup[] = [
  {
    id: "basics",
    title: "Basics",
    entries: [
      {
        id: "what-is",
        question: "What is Keysfirst?",
        answer: [
          "A deposit link for renting a room. The tenant pays the deposit into a lock. The landlord receives it only when the tenant confirms the key handover, by scanning the landlord's code at the door or tapping “I have the keys”. If that never happens, the deposit goes back to the tenant: the landlord can return it at any time, and after the deadline anyone can.",
        ],
      },
      {
        id: "who-for",
        question: "Who is it for?",
        answer: [
          "Students and young professionals who rent a room in Europe before they arrive, and landlords, often students subletting their own room, who want a tenant from abroad to trust them.",
        ],
      },
      {
        id: "countries",
        question: "Which countries does it cover?",
        answer: [
          "Germany, the Netherlands, Ireland, Spain, France and Italy. In these countries we checked the deposit rules, and when a landlord creates a link Keysfirst checks the deposit against the rent they enter and the country's legal maximum. Always compare it with the rent in your contract.",
          "Rooms in other countries aren't covered yet.",
        ],
        link: { href: "/faq#law", label: "Deposit rules by country" },
      },
      {
        id: "landlord-paid",
        question: "How does the landlord get paid?",
        answer: [
          "At the handover the landlord shows a code on their phone or laptop. The tenant checks the room, scans the code with their phone camera and taps “I have the keys”. The deposit reaches the landlord's Keysfirst balance in seconds and the landlord's screen turns green. From there the landlord withdraws it to their bank.",
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
          "The tenant pays a Keysfirst fee on top of the deposit: 3.5% when paying by card, or 2% by bank transfer, and at least €12. For a €600 deposit that is €21 by card. Landlords pay nothing.",
          "The fee is paid separately, so the deposit itself only ever goes to the tenant or the landlord. It isn't refunded if the deposit comes back. In this prototype every payment uses Stripe's test mode and test money, and only card payment is switched on.",
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
          "Don't scan. Ask the landlord to give the deposit back, which they can do at any time, or wait for the deadline and take it back.",
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
          "No. Keysfirst only protects the moment the deposit changes hands. Your contract, and disputes after you move in (damage, for example), follow the tenancy law of the country where the room is.",
        ],
      },
    ],
  },
  {
    id: "law",
    title: "Deposit rules by country",
    entries: [
      {
        id: "law",
        question: "What does the law say about deposits?",
        answer: [
          "Every country we cover limits how much a landlord may ask for, and says what the landlord must do with the deposit afterwards. Open your country below.",
          "This is general information, not legal advice.",
        ],
      },
      ...COUNTRIES.map((country) => ({
        id: `law-${country.code.toLowerCase()}`,
        question: `Renting in ${country.name}`,
        answer: [...country.law, `General information, not legal advice. Checked ${LAW_CHECKED}.`],
      })),
      {
        id: "choice",
        question: "Can a landlord make me use Keysfirst?",
        answer: [
          "No. Keysfirst is for tenants who choose to pay early without the risk, never a condition for getting the room. In Germany, for example, a landlord can't demand the full deposit before the tenancy starts (§551(4) BGB), and in France and Spain the deposit is due when the lease is signed.",
        ],
      },
      {
        id: "after-handover",
        question: "What happens to the deposit after the handover?",
        answer: [
          "It is the landlord's to hold as security, under the deposit rules of the country: in Germany the landlord must keep it apart from their own money, in Spain lodge it with a regional body, in Italy pay interest on it. Open your country above for the details. A live version would point landlords to these steps when the deposit is released.",
        ],
      },
      {
        id: "regulated",
        question: "Is Keysfirst a bank or a payment service?",
        answer: [
          "No. Keysfirst never holds the money: the program on Solana does, and pays it out only by its published rules. This prototype also moves only test money with no value.",
          "Before a live version with real euros, the program's update key would be removed, so nobody, Keysfirst included, could ever change the rules or reach a deposit. We would also ask BaFin, Germany's financial regulator, to confirm whether the model needs a licence under German payment services law (ZAG) or the EU's crypto rules (MiCA), and work with a licensed partner if it does.",
        ],
      },
      {
        id: "data",
        question: "What happens to my data?",
        answer: [
          "Keysfirst has no database and no tracking. Logging in is handled by Privy, card payments by Stripe; neither shares your card details or password with us. Deals are public on the blockchain and can't be deleted by anyone, so the room title must never contain names, street addresses or phone numbers.",
        ],
        link: { href: "/privacy", label: "Privacy policy" },
      },
    ],
  },
  {
    id: "accounts",
    title: "Your account and test money",
    entries: [
      {
        id: "login",
        question: "Do I need a wallet app or crypto?",
        answer: [
          "No. Log in with your email or Google and Keysfirst sets up your account, including the Solana wallet behind it, for you. Keysfirst also covers the network costs. If you already use Phantom, you can log in with it instead.",
        ],
        link: { href: "/start", label: "Get started in 5 minutes" },
      },
      {
        id: "test-card",
        question: "How do I pay in this prototype?",
        answer: [
          "By card on Stripe's test page. Use the card number 4242 4242 4242 4242, any future expiry date and any three digits. No real money moves.",
        ],
      },
      {
        id: "withdraw",
        question: "How do I get money out?",
        answer: [
          "Tap your account in the top corner, then “Withdraw to bank”, and enter your IBAN. In this prototype the money leaves your Keysfirst balance, but the bank transfer itself is a demo.",
        ],
      },
      {
        id: "devnet",
        question: "What are devnet and test money?",
        answer: [
          "Devnet is Solana's test network. Money there has no value, so you can try everything safely. This prototype uses its own Test EUR on devnet; a live version would use EURC, a regulated euro stablecoin, and a licensed partner for card and bank payments.",
        ],
      },
      {
        id: "qr",
        question: "The code doesn't open anything.",
        answer: [
          "Use the phone's normal camera app and tap the link it shows. On the page that opens, tap Continue, log in with the account that paid, then tap “I have the keys”.",
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
