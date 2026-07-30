import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tracking - Search orders by order number or phone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const phone = searchParams.get('phone')
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 })
    }

    const whereClause: Record<string, unknown> = {
      restaurantId,
    }

    // Search by order number (exact match)
    if (orderNumber) {
      whereClause.orderNumber = orderNumber.toUpperCase()
    }
    // Search by phone (partial match)
    else if (phone) {
      whereClause.customerPhone = {
        contains: phone.replace(/\s/g, ''),
      }
    } else {
      return NextResponse.json({ error: 'Order number or phone required' }, { status: 400 })
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Format orders for client
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      notes: order.notes,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        product: item.product,
      })),
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
