// ============================================================================
// Rate limiting en mémoire (par clé : IP + route)
// Note : limitateur par instance. Pour du multi-instance, brancher Redis/Upstash.
// ============================================================================

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  bucket.count++
  const remaining = Math.max(0, limit - bucket.count)
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  return { ok: true, remaining, retryAfterSeconds: 0 }
}

/** Nettoyage périodique des buckets expirés (éviter une croissance mémoire). */
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, 60_000).unref?.()
}

/** Récupère l'IP client de façon raisonnable (derrière proxy Caddy/Vercel). */
export function getClientKey(request: Request, route: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `${route}:${ip}`
}
