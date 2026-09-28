"use client";

import { useEffect } from "react";

/** Opens the <details> named in the URL hash, e.g. /faq#devnet from the devnet ribbon, and moves focus to its question. */
export function OpenHashDetails() {
  useEffect(() => {
    const open = (hash: string) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return; // a malformed hash opens nothing
      }
      const target = id ? document.getElementById(id) : null;
      if (target instanceof HTMLDetailsElement) {
        target.open = true;
        target.scrollIntoView({ block: "start" });
        // Keyboard and screen-reader users carry on from the question they followed, not from the top of the page.
        target.querySelector("summary")?.focus({ preventScroll: true });
      }
    };
    const fromLocation = () => open(window.location.hash);
    // A link to a question on this same page (the ribbon's "What's devnet?" while on /faq) is a client-side
    // navigation that fires no hashchange, so take the hash from the clicked link.
    const fromClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.pathname !== window.location.pathname || !link.hash) return;
      setTimeout(() => open(link.hash), 0);
    };
    fromLocation();
    window.addEventListener("hashchange", fromLocation);
    document.addEventListener("click", fromClick);
    return () => {
      window.removeEventListener("hashchange", fromLocation);
      document.removeEventListener("click", fromClick);
    };
  }, []);
  return null;
}
