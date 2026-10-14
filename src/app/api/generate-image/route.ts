import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// POST /api/generate-image — réservé aux utilisateurs authentifiés (rate-limité)
// La génération d'images IA a un coût : aucun accès anonyme.
export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, 'restaurant_owner', 'manager', 'staff')
    if (auth instanceof NextResponse) return auth

    // 10 générations / 10 min / utilisateur
    const limit = rateLimit(`genimg:${auth.id}`, 10, 10 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de générations d\'images. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await request.json().catch(() => null)
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt || prompt.length < 3 || prompt.length > 500) {
      return NextResponse.json({ error: 'Prompt is required (3-500 caractères)' }, { status: 400 })
    }

    // Use the z-ai-web-dev-sdk to generate an image
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt: `${prompt}, professional food photography, appetizing, high quality`,
      size: '1024x1024'
    })

    const imageBase64 = response.data[0].base64
    const imageUrl = `data:image/png;base64,${imageBase64}`

    return NextResponse.json({ image: imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
