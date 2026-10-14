import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ============================================================================
// Authentification serveur — sessions signées HMAC en cookie httpOnly
// (aucune dépendance externe : node:crypto uniquement)
// ============================================================================

export const SESSION_COOKIE = 'resto_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 jours

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string // super_admin | restaurant_owner | manager | staff
  restaurantId: string | null
}

// ---------------------------------------------------------------------------
// Secret de session
// ---------------------------------------------------------------------------
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (secret && secret.length >= 16) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET est obligatoire en production (>= 16 caractères).')
  }
  // Développement uniquement : secret jetable local
  return 'dev-only-insecure-session-secret-change-me'
}

// ---------------------------------------------------------------------------
// Hash de mot de passe (scrypt — équivalent bcrypt sans dépendance)
// Format stocké : scrypt$<hex-salt>$<hex-hash>
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split('$')
    if (scheme !== 'scrypt' || !salt || !hash) return false
    const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
    return timingSafeEqualHex(candidate, hash)
  } catch {
    return false
  }
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  return timingSafeEqualHex(
    crypto.createHash('sha256').update(a).digest('hex'),
    crypto.createHash('sha256').update(b).digest('hex')
  )
}

// ---------------------------------------------------------------------------
// Jeton de session : payload HMAC-SHA256 signé (aucun état serveur requis)
// ---------------------------------------------------------------------------
interface SessionPayload extends SessionUser {
  exp: number
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url')
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return null
  const body = token.slice(0, idx)
  const signature = token.slice(idx + 1)
  if (!timingSafeEqualHex(sign(body), signature)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!payload?.id || !payload?.role || payload.exp < Math.floor(Date.now() / 1000)) return null
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      restaurantId: payload.restaurantId ?? null,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = createSessionToken(user)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Version compatible route handler (lit aussi l'en-tête Authorization: Bearer). */
export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value
  const user = verifySessionToken(cookieToken)
  if (user) return user
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return verifySessionToken(auth.slice(7))
  }
  return null
}

// ---------------------------------------------------------------------------
// Garde-fous pour les route handlers
// ---------------------------------------------------------------------------
export function unauthorized(message = 'Authentification requise.') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Accès refusé.') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/** Exige un utilisateur connecté. */
export function requireAuth(request: NextRequest): SessionUser | NextResponse {
  const user = getSessionFromRequest(request)
  return user ?? unauthorized()
}

/** Exige un des rôles donnés (super_admin passe toujours). */
export function requireRole(request: NextRequest, ...roles: string[]): SessionUser | NextResponse {
  const user = getSessionFromRequest(request)
  if (!user) return unauthorized()
  if (user.role === 'super_admin' || roles.includes(user.role)) return user
  return forbidden('Rôle insuffisant pour cette action.')
}

/**
 * Exige que l'utilisateur appartienne au restaurant ciblé (ou soit super_admin).
 * `targetRestaurantId` est pris dans la requête ; il ne doit jamais faire foi seul.
 */
export function requireRestaurant(
  request: NextRequest,
  targetRestaurantId: string | null | undefined,
  ...roles: string[]
): SessionUser | NextResponse {
  const user = requireRole(request, ...roles)
  if (user instanceof NextResponse) return user
  if (user.role === 'super_admin') return user
  if (!targetRestaurantId || user.restaurantId !== targetRestaurantId) {
    return forbidden('Ce restaurant ne vous appartient pas.')
  }
  return user
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === 'super_admin'
}
