/**
 * Simple in-memory fixed-window rate limiter, applied to the /extract and
 * /estimate routes since they call a paid external API.
 *
 * Tradeoff (explicitly noted, per the spec's "say so explicitly" guidance):
 * this state lives in process memory, so it resets on every server restart
 * and does NOT coordinate across multiple serverless instances (e.g. on
 * Vercel, concurrent invocations may run in separate instances, each with
 * its own counter). That's an acceptable MVP tradeoff for a single-user
 * app — a distributed limiter (e.g. Upstash Redis) would close this gap,
 * but that's a new external dependency, not added without discussing it
 * first.
 */
interface WindowState {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, WindowState>();

export interface RateLimitResult {
  allowed: boolean;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const state = buckets.get(key);

  if (!state || now - state.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (state.count >= limit) {
    return { allowed: false };
  }

  state.count += 1;
  return { allowed: true };
}

export function clientKeyFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}
