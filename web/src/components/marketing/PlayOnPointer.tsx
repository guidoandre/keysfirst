"use client";

import { useEffect } from "react";

// A mouse has to settle on a block for this long before its reaction plays, so a quick sweep across the page sets
// nothing off; a tap plays at once.
const PLAY_DWELL_MS = 70;
// An arrow leans after the pointer has rested on its card this long, and stays leaning this long after it leaves, so
// crossing the gap between two ways out doesn't twitch it back and forth.
const LEAN_IN_MS = 60;
const LEAN_OUT_MS = 160;

/**
 * The marketing pages' pointer reactions (globals.css, design system §5). One set of listeners for the page, like
 * ScrollReveal.
 * - [data-play]: once a mouse settles on the block, or a finger taps it, the block gets data-playing until its play-*
 *   animations have run. A quick pass never cuts a reaction short, it never loops, the next arrival plays it again.
 * - [data-lean="<name>"] inside a [data-flow]: while a mouse rests on it, the flow gets data-leaning="<name>" and the
 *   matching arrow leans (set from here, not with :has(:hover), which can leave an arrow pushed out after the pointer
 *   has gone).
 * Under reduced motion there are no play-* animations and the CSS never moves an arrow.
 */
export function PlayOnPointer() {
  useEffect(() => {
    const dwell = new WeakMap<Element, number>();
    const leanTimer = new WeakMap<Element, number>();

    function play(block: HTMLElement) {
      if (block.dataset.playing !== undefined || !block.getAnimations) return;
      block.dataset.playing = "";
      const running = block
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("play-"));
      Promise.allSettled(running.map((animation) => animation.finished)).then(() => delete block.dataset.playing);
    }

    function lean(flow: HTMLElement, to: string | undefined, delay: number) {
      clearTimeout(leanTimer.get(flow));
      const apply = () => (to ? (flow.dataset.leaning = to) : delete flow.dataset.leaning);
      if (delay) leanTimer.set(flow, window.setTimeout(apply, delay));
      else apply();
    }

    // The block (or lean source) the event crosses into or out of: null when the pointer only moved between its children.
    function crossed(event: PointerEvent, selector: string) {
      if (!(event.target instanceof Element)) return null;
      const el = event.target.closest<HTMLElement>(selector);
      return el && !(event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) ? el : null;
    }

    function onOver(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      const block = crossed(event, "[data-play]");
      if (block) dwell.set(block, window.setTimeout(() => play(block), PLAY_DWELL_MS));
      const source = crossed(event, "[data-lean]");
      const flow = source?.closest<HTMLElement>("[data-flow]");
      if (source && flow) lean(flow, source.dataset.lean, flow.dataset.leaning === source.dataset.lean ? 0 : LEAN_IN_MS);
    }
    function onOut(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      const block = crossed(event, "[data-play]");
      if (block) clearTimeout(dwell.get(block));
      const source = crossed(event, "[data-lean]");
      const flow = source?.closest<HTMLElement>("[data-flow]");
      if (source && flow) lean(flow, undefined, LEAN_OUT_MS);
    }
    // A tap, not a finger that lands on the block to scroll past it (scrolling cancels the pointer: no pointerup).
    function onUp(event: PointerEvent) {
      if (event.pointerType !== "touch" || !(event.target instanceof Element)) return;
      const block = event.target.closest<HTMLElement>("[data-play]");
      if (block) play(block);
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);
  return null;
}
