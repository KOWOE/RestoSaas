import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireRestaurant, requireRole, forbidden, unauthorized } from '@/lib/auth'
import { createRestaurantSchema, updateRestaurantSchema } from '@/lib/validation'

// ============================================================================
// /api/restaurants
//   GET    : public par slug (menu) ; par id = auth + propriétaire ; liste = auth
//   POST   : super_admin uniquement
//   PUT    : propriétaire du restaurant ou super_admin
//   DELETE : propriétaire du restaurant ou super_admin
// ============================================================================

// GET - Fetch restaurants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')

    // Public : menu du restaurant par slug (catégories + produits + tables)
    if (slug) {
      const restaurant = await db.restaurant.findUnique({
        where: { slug },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              products: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          tables: {
            where: { isActive: true },
          },
        },
      })
      return NextResponse.json(restaurant)
    }

    if (id) {
      // Protégé : uniquement le propriétaire (ou super_admin) — plus de fuite `users`
      const auth = requireRestaurant(request, id, 'restaurant_owner', 'manager')
      if (auth instanceof NextResponse) return auth

      const restaurant = await db.restaurant.findUnique({
        where: { id },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              products: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          tables: true,
        },
      })
      return NextResponse.json(restaurant)
    }

    // Liste : réservée aux utilisateurs authentifiés (super_admin voit tout,
    // un gérant ne voit que son restaurant)
    const auth = requireRole(request, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    const where = auth.role === 'super_admin' ? { isActive: true } : { id: auth.restaurantId || '__none__' }
    const restaurants = await db.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
        createdAt: true,
      },
    })
    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}

// POST - Create a new restaurant (super_admin)
export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => null)
    const parsed = createRestaurantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const { name, slug, description, address, phone, email, currency, taxRate, plan, serviceType, orderModes } = parsed.data

    const restaurant = await db.restaurant.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        address,
        phone,
        email,
        currency: currency || 'XOF',
        taxRate: taxRate ?? 0.18,
        plan: plan || 'basic',
        serviceType: serviceType || 'both',
        orderModes: orderModes || (serviceType === 'online' ? 'takeaway,delivery' : 'dine_in,takeaway,delivery'),
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}

// PUT - Update a restaurant (propriétaire ou super_admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = updateRestaurantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const { id, ...data } = parsed.data

    const auth = requireRestaurant(request, id, 'restaurant_owner', 'manager')
    if (auth instanceof NextResponse) return auth

    // Un non-super_admin ne peut pas changer isActive / plan lui-même
    if (auth.role !== 'super_admin') {
      delete (data as Record<string, unknown>).isActive
      delete (data as Record<string, unknown>).plan
    }

    const restaurant = await db.restaurant.update({
      where: { id },
      data,
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}

// DELETE - Delete a restaurant (propriétaire ou super_admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const auth = requireRestaurant(request, id, 'restaurant_owner')
    if (auth instanceof NextResponse) return auth

    await db.restaurant.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 })
  }
}
