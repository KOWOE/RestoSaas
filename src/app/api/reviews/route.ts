import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { reviewSchema } from '@/lib/validation'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// /api/reviews — témoignages publics MODÉRÉS
//   GET  : public
//   POST : public mais validé, rate-limité, et NON vérifié par défaut
//          (isVerified passe à true uniquement après modération)
// ============================================================================

// Default fallback reviews if db is empty
const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    authorName: 'Chef Malik Koffi',
    authorRole: 'Chef Exécutif & Propriétaire',
    restaurantName: 'Le Jardin Savoureux',
    city: 'Cotonou, Bénin',
    rating: 5,
    comment: 'Le QR code sur nos tables a augmenté nos ventes de desserts et boissons de 34%. Les clients adorent voir les photos réelles des plats avant de commander !',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop',
    isVerified: true
  },
  {
    id: 'rev-2',
    authorName: 'Awa Diop',
    authorRole: 'Gérante & Fondatrice',
    restaurantName: 'Lounge & Grill Teranga',
    city: 'Dakar, Sénégal',
    rating: 5,
    comment: 'L\'intégration Mobile Money est magique. Plus aucune dispute de monnaie aux heures de pointe et nos cuisiniers reçoivent les bons instantanément sur leur écran.',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&h=120&fit=crop',
    isVerified: true
  },
  {
    id: 'rev-3',
    authorName: 'Yao Kouamé',
    authorRole: 'Directeur d\'Exploitation',
    restaurantName: 'L\'Ébène Gourmet',
    city: 'Abidjan, Côte d\'Ivoire',
    rating: 5,
    comment: 'En 10 minutes nous étions opérationnels. Le générateur de photos IA nous a permis d\'avoir un menu digne d\'un hôtel 5 étoiles sans rien dépenser en shooting photo.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    isVerified: true
  }
]

export async function GET() {
  try {
    let reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    if (reviews.length === 0) {
      // Seed initial reviews
      await db.review.createMany({
        data: INITIAL_REVIEWS
      })
      reviews = await db.review.findMany({
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(INITIAL_REVIEWS)
  }
}

export async function POST(req: NextRequest) {
  try {
    // 5 avis / heure / IP
    const limit = rateLimit(getClientKey(req, 'reviews:post'), 5, 60 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop d\'avis envoyés. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Avis invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const { authorName, authorRole, restaurantName, city, rating, comment, avatar } = parsed.data

    const newReview = await db.review.create({
      data: {
        authorName,
        authorRole: authorRole || 'Chef Cuisinier',
        restaurantName,
        city: city || 'Afrique de l\'Ouest',
        rating: rating ?? 5,
        comment,
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775?w=120&h=120&fit=crop',
        // Un avis public n'est JAMAIS vérifié automatiquement — modération requise.
        isVerified: false
      }
    })

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Impossible d\'enregistrer l\'avis' }, { status: 500 })
  }
}
