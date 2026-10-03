"use client";

import { useEffect } from "react";

/**
 * Plays a [data-play] block's pointer reaction (globals.css, design system §5): when a mouse or pen arrives, or a finger
 * taps it, the block gets data-playing until its play-* animations have run. So a quick pass never cuts a reaction
 * short, it never loops, and the next arrival plays it again. One listener for the page, like ScrollReveal; under
 * reduced motion there are no play-* animations and the flag clears at once.
 */
export function PlayOnPointer() {
  useEffect(() => {
    function play(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      const block = event.target.closest<HTMLElement>("[data-play]");
      if (!block || block.dataset.playing !== undefined || !block.getAnimations) return;
      // pointerover fires again for every child the pointer crosses: only an arrival from outside the block counts.
      if (event.relatedTarget instanceof Node && block.contains(event.relatedTarget)) return;

      block.dataset.playing = "";
      const running = block
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("play-"));
      Promise.allSettled(running.map((animation) => animation.finished)).then(() => delete block.dataset.playing);
    }
    const onOver = (event: PointerEvent) => event.pointerType !== "touch" && play(event);
    // A tap, not a finger that lands on the block to scroll past it (scrolling cancels the pointer: no pointerup).
    const onUp = (event: PointerEvent) => event.pointerType === "touch" && play(event);

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);
  return null;
}
