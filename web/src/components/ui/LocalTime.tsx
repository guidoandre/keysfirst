"use client";

import { useSyncExternalStore } from "react";
import { formatDoorTime, formatShortDateTime } from "@/lib/format";

const noop = () => () => {};

/**
 * A time rendered on the server in Central European time (the server clock is UTC), then shown in the time zone of the
 * phone reading it once the page is live: at the door, that's the room's own time (Ireland included).
 */
export function LocalTime({ at }: { at: number }) {
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return <time dateTime={new Date(at * 1000).toISOString()}>{client ? formatShortDateTime(at) : formatDoorTime(at)}</time>;
}
