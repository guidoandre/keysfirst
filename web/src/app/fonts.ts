import { Barlow, Barlow_Semi_Condensed } from "next/font/google";

// Loaded once and imported wherever needed (root layout, global-error). Not variable fonts, so weights are listed.

/** Body and UI text: Barlow 400 and 600; 800 for the "Keysfirst" wordmark only. */
export const barlow = Barlow({
  weight: ["400", "600", "800"],
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
