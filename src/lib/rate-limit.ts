import "server-only";

// Lightweight in-memory fixed-window rate limiter for auth + other sensitive
// endpoints. This is BEST-EFFORT and PER-INSTANCE: on a multi-instance deploy
// each instance keeps its own counters, so a determined attacker spread across
// instances gets N times the budget. It still meaningfully slows credential
// stuffing / account enumeration from a single origin. For a hard guarantee,
// move the store to Redis (see REVIEW.md NEEDS HUMAN).

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Consume one unit from `key`'s window. Allows up to `limit` hits per
 * `windowSeconds`. Returns `ok: false` once the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: Math.max(0, limit - existing.count), retryAfterSeconds };
}

/**
 * Best-effort client key from proxy headers. Falls back to a shared bucket when
 * no forwarded IP is present (still rate-limits, just more coarsely).
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Test-only: clear all windows. */
export function __resetRateLimits() {
  buckets.clear();
}
