// Best-effort in-memory rate limiting for public form endpoints.
//
// LIMITATION: Netlify Functions are stateless and may run on different
// warm instances between requests, so this only throttles bursts hitting
// the SAME warm instance - it is not a substitute for a shared store
// (e.g. Upstash Redis) or an edge-level WAF rule. Combine with Turnstile
// (see lib/turnstile.ts) for real spam resistance in production; see
// README "Spam protection" for recommended upgrades.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
