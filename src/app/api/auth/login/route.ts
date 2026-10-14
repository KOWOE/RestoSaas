import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie, verifyPassword, timingSafeEqualStr, createSessionToken, type SessionUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/auth/login — authentification réelle (session cookie httpOnly)
// 1. Utilisateur en base (mot de passe hashé scrypt)
// 2. Repli bootstrap ADMIN_EMAIL / ADMIN_PASSWORD (jamais par défaut en prod)
// ============================================================================

function bootstrapSuperAdmin(): { email: string; password: string } | null {
  const isProd = process.env.NODE_ENV === 'production'
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (isProd) {
    if (!email || !password) return null
    return { email, password }
  }
  // Développement : valeurs de démo documentées dans .env.example
  return {
    email: email || 'admin@restaurant.com',
    password: password || 'admin123',
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit : 10 tentatives / 5 min / IP
    const key = getClientKey(request, 'login')
    const limit = rateLimit(key, 10, 5 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis (format invalide).' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // 1. Utilisateur en base
    let user: SessionUser | null = null
    try {
      const dbUser = await db.user.findUnique({ where: { email } })
      if (dbUser?.password && verifyPassword(password, dbUser.password)) {
        if (dbUser.isActive === false) {
          return NextResponse.json({ error: 'Ce compte est désactivé.' }, { status: 403 })
        }
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          restaurantId: dbUser.restaurantId || null,
        }
      }
    } catch (dbErr) {
      console.error('[Auth] Erreur lecture utilisateur:', dbErr)
    }

    // 2. Repli bootstrap (compte fondateur non stocké en base)
    if (!user) {
      const bootstrap = bootstrapSuperAdmin()
      if (
        bootstrap &&
        timingSafeEqualStr(email, bootstrap.email) &&
        timingSafeEqualStr(password, bootstrap.password)
      ) {
        user = {
          id: 'bootstrap-admin',
          email: bootstrap.email,
          name: 'Fondateur SaaS (Super Admin)',
          role: 'super_admin',
          restaurantId: null,
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    await setSessionCookie(user)

    return NextResponse.json({
      success: true,
      user,
      // Jeton également exposé en réponse pour les clients API (Bearer)
      token: createSessionToken(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 })
  }
}
