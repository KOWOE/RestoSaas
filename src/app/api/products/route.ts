import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireRestaurant, getSessionFromRequest, unauthorized } from '@/lib/auth'
import { createProductSchema, updateProductSchema } from '@/lib/validation'

// ============================================================================
// /api/products
//   GET    : public (menu du restaurant)
//   POST   : propriétaire / manager / super_admin — validé Zod
//   PUT    : idem
//   DELETE : idem
// ============================================================================

// GET - Fetch products (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { restaurantId }
    if (categoryId) where.categoryId = categoryId
    if (featured === 'true') where.isFeatured = true

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Create a product (protégé)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Produit invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const data = parsed.data

    const auth = requireRestaurant(request, data.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    // La catégorie doit appartenir au même restaurant
    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category || category.restaurantId !== data.restaurantId) {
      return NextResponse.json({ error: 'Catégorie invalide pour ce restaurant' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        image: data.image ?? null,
        categoryId: data.categoryId,
        restaurantId: data.restaurantId,
        isAvailable: data.isAvailable ?? true,
        isFeatured: data.isFeatured ?? false,
        preparationTime: data.preparationTime ?? null,
        calories: data.calories ?? null,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - Update a product (protégé)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Mise à jour invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const { id, restaurantId: providedRestaurantId, ...data } = parsed.data

    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    if (data.categoryId) {
      const category = await db.category.findUnique({ where: { id: data.categoryId } })
      if (!category || category.restaurantId !== existing.restaurantId) {
        return NextResponse.json({ error: 'Catégorie invalide pour ce restaurant' }, { status: 400 })
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Delete a product (protégé)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
