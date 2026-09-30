/**
 * A small in-memory rate limiter: at most `max` hits per key in `windowMs`. Each server instance keeps its own
 * counts, so it slows a single client down rather than enforcing a global quota (the Vercel firewall does that).
 */
export function rateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    // Keep memory bounded on a long-lived instance.
    if (hits.size > 10_000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return true;
  };
}

/** The caller's IP as Vercel reports it (first hop of x-forwarded-for), or "unknown". */
export function clientIp(req: Request): string {
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * True for a JSON request. A cross-site form or a no-cors fetch can only send text/plain, form or multipart bodies,
 * so requiring JSON keeps other websites from making their visitors' browsers call our API.
 */
export function isJson(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
