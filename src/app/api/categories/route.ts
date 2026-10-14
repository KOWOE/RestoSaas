import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireRestaurant, getSessionFromRequest, unauthorized } from '@/lib/auth'
import { createCategorySchema, updateCategorySchema } from '@/lib/validation'

// ============================================================================
// /api/categories
//   GET    : public (menu du restaurant)
//   POST   : propriétaire / manager / super_admin — validé Zod
//   PUT    : idem
//   DELETE : idem
// ============================================================================

// GET - Fetch categories (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const categories = await db.category.findMany({
      where: { restaurantId },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - Create a category (protégé)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Catégorie invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const data = parsed.data

    const auth = requireRestaurant(request, data.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    const category = await db.category.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        image: data.image ?? null,
        icon: data.icon ?? null,
        restaurantId: data.restaurantId,
        sortOrder: data.sortOrder || 0,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT - Update a category (protégé)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Mise à jour invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const { id, restaurantId: _ignored, ...data } = parsed.data

    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    const category = await db.category.update({
      where: { id },
      data,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE - Delete a category (protégé)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    await db.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
