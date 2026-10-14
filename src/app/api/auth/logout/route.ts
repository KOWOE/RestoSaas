import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

// POST /api/auth/logout — déconnexion (efface le cookie de session)
export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}
