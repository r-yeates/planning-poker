/**
 * Sliding-window rate limiter for /api/room. State lives in this server instance's
 * memory, so on a multi-instance or serverless deploy it is a per-instance, best-effort
 * guard against floods; a hard global limit needs a shared store (Redis, Firestore).
 */

const WINDOW_MS = 60_000;
const MAX_KEYS = 5_000;

/** Requests allowed per window for each action; anything unlisted uses `default`. */
export const ACTION_LIMITS: Record<string, number> = {
  create: 5,
  join: 15,
  vote: 60,
  setBacklog: 20,
  setTicket: 30,
  default: 120,
};

/** Cap per client IP for the actions that create state or accept passwords. */
export const IP_LIMITS: Record<string, number> = {
  create: 20,
  join: 60,
};

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/** Records a hit for `key` and reports whether it is within `limit` per window. */
export function checkRateLimit(key: string, limit: number, now = Date.now()): RateLimitResult {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > MAX_KEYS) sweep(now);
  return { allowed: true, retryAfterSec: 0 };
}

function sweep(now: number) {
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
}

/** Test helper. */
export function resetRateLimits() {
  hits.clear();
}
