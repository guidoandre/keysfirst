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
