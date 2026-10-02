/**
 * A "this browser is logged in" hint for the marketing pages, which carry no wallet code (route groups, Lighthouse).
 * The app's AccountProvider writes it once Privy knows; the site header only reads it. Never holds the account itself.
 */
export const LOGGED_IN_KEY = "keysfirst:logged-in";

export function readLoggedIn(): boolean {
  try {
    return localStorage.getItem(LOGGED_IN_KEY) === "1";
  } catch {
    return false; // storage blocked: show "Log in"
  }
}

export function writeLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) localStorage.setItem(LOGGED_IN_KEY, "1");
    else localStorage.removeItem(LOGGED_IN_KEY);
  } catch {
    // Storage blocked: the site header keeps showing "Log in".
  }
}
