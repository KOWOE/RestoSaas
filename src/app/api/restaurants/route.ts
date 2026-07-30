import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch all restaurants or a specific restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')

    if (slug) {
      const restaurant = await db.restaurant.findUnique({
        where: { slug },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              products: {
                where: { isAvailable: true },
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
          users: true,
        },
      })
      return NextResponse.json(restaurant)
    }

    // Get all restaurants
    const restaurants = await db.restaurant.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}

// POST - Create a new restaurant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, address, phone, email, currency, taxRate, plan } = body

    const restaurant = await db.restaurant.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        address,
        phone,
        email,
        currency: currency || 'XOF',
        taxRate: taxRate || 0.18,
        plan: plan || 'basic',
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}

// PUT - Update a restaurant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

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

// DELETE - Delete a restaurant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    await db.restaurant.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 })
  }
}
