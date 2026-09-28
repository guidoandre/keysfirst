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

// Legal statements: only what §551 BGB and the privacy policy support, worded as written here. Honest caveats stay in (brand guidelines §8).
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
          "No. Keysfirst only protects the moment the deposit changes hands. Your contract, and disputes after you move in (damage, for example), follow normal German tenancy law.",
        ],
      },
    ],
  },
  {
    id: "law",
    title: "German law",
    entries: [
      {
        id: "law",
        question: "What does German law say about deposits?",
        answer: [
          "Under §551 BGB a deposit may be at most three months' rent without utilities, and the tenant may pay it in three monthly instalments, the first due when the tenancy starts. So you don't have to pay the full deposit before you move in.",
          "This is general information, not legal advice.",
        ],
      },
      {
        id: "choice",
        question: "Can a landlord make me use Keysfirst?",
        answer: [
          "No. Under §551 BGB a landlord can't demand the full deposit before the tenancy starts; an agreement that says otherwise doesn't count (§551(4)). Keysfirst is for tenants who choose to pay early without the risk, never a condition for getting the room.",
        ],
      },
      {
        id: "after-handover",
        question: "What happens to the deposit after the handover?",
        answer: [
          "It is the landlord's to hold as security, under the usual rules: the landlord must keep it apart from their own money, normally in a deposit account at a bank, and any interest belongs to the tenant (§551(3) BGB). A live version would point landlords to that step when the deposit is released.",
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
          "Keysfirst has no accounts, cookies or tracking, and never sees your wallet's keys. Deals are public on the blockchain and can't be deleted by anyone, so the room title must never contain names, street addresses or phone numbers.",
        ],
        link: { href: "/privacy", label: "Privacy policy" },
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
