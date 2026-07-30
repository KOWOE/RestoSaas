import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch products
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

// POST - Create a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, comparePrice, image, categoryId, restaurantId, isAvailable, isFeatured, preparationTime, calories, allergens, sortOrder } = body

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        image,
        categoryId,
        restaurantId,
        isAvailable: isAvailable ?? true,
        isFeatured: isFeatured ?? false,
        preparationTime,
        calories,
        allergens,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (data.price) data.price = parseFloat(data.price)
    if (data.comparePrice) data.comparePrice = parseFloat(data.comparePrice)

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

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
