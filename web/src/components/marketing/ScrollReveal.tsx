"use client";

import { useEffect } from "react";

// Consecutive blocks that arrive in the same frame (a row of cards) land 80 ms apart, at most 400 ms after the first.
const STAGGER_MS = 80;
const MAX_STAGGER_STEPS = 5;

/**
 * Rises the page's [data-reveal] blocks into place as they scroll into view (CSS in globals.css, design system §8).
 * Progressive: a block is hidden only once this has run, and only while it is still below the fold, so without
 * JavaScript, with reduced motion, or for anything already on screen, the page renders exactly as it is.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const below = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            el.style.setProperty("--reveal-delay", `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
            el.dataset.reveal = "in";
            observer.unobserve(el);
          });
      },
      // Land a little after the block's top edge crosses into view, so the rise is seen.
      { rootMargin: "0px 0px -6% 0px" },
    );
    for (const el of below) {
      el.dataset.reveal = "pending";
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      for (const el of below) {
        el.dataset.reveal = "";
        el.style.removeProperty("--reveal-delay");
      }
    };
  }, []);
  return null;
}
