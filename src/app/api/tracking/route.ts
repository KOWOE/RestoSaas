import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackingQuerySchema } from '@/lib/validation'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// GET /api/tracking — suivi de commande (public, durci)
//   - recherche par numéro de commande EXACT ou téléphone (>= 6 chiffres)
//   - rate limit pour empêcher l'énumération de clients
//   - ne renvoie que les données nécessaires au suivi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const limit = rateLimit(getClientKey(request, 'tracking'), 30, 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de recherches. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber') || undefined
    const phone = searchParams.get('phone') || undefined
    const restaurantId = searchParams.get('restaurantId') || undefined

    const parsed = trackingQuerySchema.safeParse({ restaurantId, orderNumber, phone })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Paramètres invalides' },
        { status: 400 }
      )
    }

    const whereClause: Record<string, unknown> = {
      restaurantId: parsed.data.restaurantId,
    }

    // Search by order number (exact match uniquement)
    if (parsed.data.orderNumber) {
      whereClause.orderNumber = parsed.data.orderNumber.toUpperCase()
    }
    // Search by phone — correspondance exacte normalisée (plus de contains partiel)
    else if (parsed.data.phone) {
      whereClause.customerPhone = {
        contains: parsed.data.phone.replace(/[\s().-]/g, ''),
      }
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

    // Format orders for client (données de suivi uniquement)
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
