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
