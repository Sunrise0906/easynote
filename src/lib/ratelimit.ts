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
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(windowMs: number) {
  // Periodically drop empty buckets so the map doesn't grow forever.
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
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
  sweep(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}
