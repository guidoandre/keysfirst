"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { LOGGED_IN_KEY, readLoggedIn } from "@/lib/logged-in";

// Runs while the HTML is parsed, before the first paint: a logged-in visitor never sees "Log in" flash first.
const MARK = `try{localStorage.getItem(${JSON.stringify(LOGGED_IN_KEY)})==="1"&&document.currentScript.parentNode.setAttribute("data-account","")}catch(e){}`;

/**
 * "Log in", or the account avatar once this browser has logged in (the hint the app pages leave, lib/logged-in.ts).
 * Both are in the HTML and CSS shows one, so the static page needs no wallet code. A full page load is marked by the
 * inline script; a client-side navigation from the app reads the hint while rendering.
 */
export function SiteAccount() {
  const loggedIn = typeof window !== "undefined" && readLoggedIn();
  return (
    <span data-account={loggedIn ? "" : undefined} suppressHydrationWarning className="group/account contents">
      <script
        // The browser runs it on a full load; React leaves it as text/plain on the client (Next "preventing flash" guide).
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: MARK }}
      />
      {/* prefetch={false} on links into the wallet pages: see isAppRoute in lib/site.ts */}
      <ButtonLink href="/deals?login=1" prefetch={false} variant="secondary" size="sm" className="group-data-account/account:hidden">
        Log in
      </ButtonLink>
      <Link
        href="/deals"
        prefetch={false}
        className="hidden h-11 items-center gap-2 rounded-full border-[1.5px] border-field pr-3.5 pl-1 text-sm font-semibold hover:bg-subtle group-data-account/account:inline-flex"
      >
        <Avatar />
        <span className="sr-only">You&apos;re logged in. </span>
        My deals
      </Link>
    </span>
  );
}
