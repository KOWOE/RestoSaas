import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/auth/me — renvoie l'utilisateur de la session courante (ou null)
export async function GET(request: NextRequest) {
  const user = getSessionFromRequest(request)
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({ user })
}
