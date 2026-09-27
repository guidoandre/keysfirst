"use client";

import { useState } from "react";

export function ShareLink({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="font-semibold">Send this link to your tenant</h2>
      <input readOnly value={url} className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-2 font-medium"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center font-medium text-white"
        >
          Share on WhatsApp
        </a>
      </div>
    </section>
  );
}
