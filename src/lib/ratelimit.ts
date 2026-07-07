import { NextRequest } from "next/server";

/**
 * Small in-memory sliding-window rate limiter.
 *
 * Suitable for the single-instance deployments this app targets (one Node
 * process with a persistent volume). If you scale to multiple instances,
 * replace with a shared store (Redis) — see README.
 */

interface Bucket {
  hits: number[];
  windowMs: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep() {
  // Periodically drop expired hits / empty buckets so the map can't grow
  // forever. Each bucket is pruned against ITS OWN window (not the caller's).
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < bucket.windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

/**
 * Best-effort client IP for rate limiting.
 *
 * The left-most X-Forwarded-For entry is attacker-controlled, so we never
 * trust it. In order of preference we use headers a trusted edge sets to the
 * *verified* peer address: Fly's `fly-client-ip`, then the conventional
 * `x-real-ip` (nginx/Render), then the right-most XFF token (added by the
 * proxy closest to us). Behind no proxy at all this collapses to "local",
 * which makes the auth limiter global — acceptable, since those paths also
 * carry non-IP limits (per-email / per-account).
 */
export function clientIp(req: NextRequest): string {
  const fly = req.headers.get("fly-client-ip");
  if (fly) return fly.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "local";
}

/**
 * Returns true when the caller is within the limit (and records the hit),
 * false when the limit is exceeded.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [], windowMs };
  bucket.windowMs = windowMs;
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}
