import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireRestaurant, forbidden, getSessionFromRequest, unauthorized } from '@/lib/auth'
import { createOrderSchema, updateOrderSchema } from '@/lib/validation'
import { getClientKey, rateLimit } from '@/lib/rate-limit'

// ============================================================================
// /api/orders
//   GET    : auth requise (staff du restaurant ou super_admin) — paginé
//   POST   : publique (commande client) — validée, démo décidée côté serveur
//   PUT    : auth requise — changement de statut métier UNIQUEMENT
//   DELETE : auth requise (super_admin ou propriétaire)
// ============================================================================

// Slug du restaurant de démonstration — le mode démo est décidé côté serveur uniquement.
const DEMO_RESTAURANT_SLUG = 'le-jardin-savoureux'

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// GET - Fetch orders (protégé + paginé)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')
    const id = searchParams.get('id')
    const limitParam = Number(searchParams.get('limit')) || 100
    const skipParam = Number(searchParams.get('skip')) || 0
    const limit = Math.min(Math.max(limitParam, 1), 500)
    const skip = Math.max(skipParam, 0)

    if (id) {
      // Session exigée AVANT tout accès base (anti-énumération)
      if (!getSessionFromRequest(request)) return unauthorized()

      // Une commande précise : propriétaire du restaurant ou super_admin
      const existing = await db.order.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
      }
      const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager', 'staff')
      if (auth instanceof NextResponse) return auth

      const order = await db.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      })
      return NextResponse.json(order)
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const auth = requireRestaurant(request, restaurantId, 'restaurant_owner', 'manager', 'staff')
    if (auth instanceof NextResponse) return auth

    const where: Record<string, unknown> = { restaurantId }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, limit, skip })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST - Create a new order (publique, validée)
export async function POST(request: NextRequest) {
  try {
    // Rate limit commande : 20 / 10 min / IP
    const limit = rateLimit(getClientKey(request, 'orders:post'), 20, 10 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Trop de commandes envoyées. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Commande invalide', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }
    const {
      restaurantId,
      items,
      customerName,
      customerPhone,
      customerEmail,
      tableNumber,
      notes,
      type,
      paymentMethod,
      paymentProvider,
      paymentPhone,
    } = parsed.data

    // Calculate totals — TOUJOURS depuis le prix en base, jamais depuis le client
    let subtotal = 0
    const orderItems: Array<{ productId: string; quantity: number; price: number; notes?: string | null }> = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || product.restaurantId !== restaurantId) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        notes: item.notes,
      })
    }

    // Get restaurant tax rate
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
    }

    // Restaurant suspendu / non activé (pas encore payé) : commande refusée
    if (restaurant.isActive === false) {
      return forbidden('Ce restaurant n\'est pas encore activé. Finalisez l\'abonnement pour recevoir des commandes.')
    }

    // Mode démo : décidé côté serveur UNIQUEMENT (le flag client isDemo est ignoré)
    const isDemoRestaurant = restaurant.slug === DEMO_RESTAURANT_SLUG || restaurant.id === 'demo-restaurant'

    const taxRate = typeof restaurant.taxRate === 'number' ? restaurant.taxRate : 0.18
    const tax = Math.round(subtotal * taxRate * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        restaurantId,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        tableNumber: tableNumber || null,
        notes: notes || null,
        type: type || 'dine_in',
        subtotal,
        tax,
        total,
        status: 'pending',
        // Le mode démo simule le paiement immédiat (aucune vraie transaction)
        paymentStatus:
          isDemoRestaurant && (paymentMethod === 'mobile_money' || paymentMethod === 'card')
            ? 'paid'
            : 'pending',
        paymentMethod: paymentMethod || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // En mode Démo, aucun appel Moneroo
    if (isDemoRestaurant) {
      return NextResponse.json({ ...order, isDemo: true, checkoutUrl: null })
    }

    // Paiement en ligne pour un vrai restaurant
    const isOnlinePayment = ['mobile_money', 'card', 'moneroo', 'fedapay', 'assazara'].includes(paymentMethod || '')

    if (isOnlinePayment) {
      try {
        const MONEROO_URL = process.env.MONEROO_URL || 'https://api.moneroo.io/v1/payments/initialize'
        const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET
        if (!MONEROO_SECRET) {
          console.warn('[Orders] MONEROO_SECRET_KEY non configuré — paiement en ligne indisponible.')
          return NextResponse.json(order)
        }
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const returnUrl = `${origin}/success?type=order&orderId=${order.id}&slug=${encodeURIComponent(restaurant?.slug || '')}&amount=${Math.round(order.total)}`

        const rawCurrency = (restaurant?.currency || 'XOF').toUpperCase()
        const finalAmount = Math.round(order.total)

        const payload = {
          amount: finalAmount,
          currency: rawCurrency,
          description: `Commande ${order.orderNumber} - ${restaurant?.name || 'Restaurant'}`,
          customer: {
            email: (customerEmail && customerEmail.includes('@')) ? customerEmail : 'client@resto-saas.com',
            first_name: customerName?.split(' ')[0] || 'Client',
            last_name: customerName?.split(' ').slice(1).join(' ') || 'RestoSaas',
            phone: paymentPhone || customerPhone || ''
          },
          return_url: returnUrl,
          metadata: {
            orderId: order.id,
            restaurantId: restaurant?.id,
            slug: restaurant?.slug,
            type: 'order',
            paymentProvider: paymentProvider || 'mobile_money',
            paymentPhone: paymentPhone || customerPhone || null
          }
        }

        const monerooResponse = await fetch(MONEROO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MONEROO_SECRET}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (monerooResponse.ok) {
          const monerooData = await monerooResponse.json()
          const checkoutUrl = monerooData?.data?.checkout_url || monerooData?.checkout_url || monerooData?.checkoutUrl || monerooData?.data?.url || monerooData?.url || null
          return NextResponse.json({ ...order, checkoutUrl, paymentData: monerooData })
        } else {
          const errText = await monerooResponse.text()
          console.error('[Orders] Erreur Moneroo:', monerooResponse.status, errText)
        }
      } catch (err) {
        console.error('Error triggering Moneroo / FedaPay payment:', err)
      }
    }

    return NextResponse.json(order)
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    const message = error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT - Update order status (statut métier uniquement — protégé)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Mise à jour invalide. Le statut de paiement ne peut être modifié que par la passerelle de paiement.',
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        },
        { status: 400 }
      )
    }
    const { id, status, paymentStatus, paymentMethod } = parsed.data

    // Session exigée AVANT tout accès base (anti-énumération)
    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner', 'manager', 'staff')
    if (auth instanceof NextResponse) return auth

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    // Encaissement manuel (espèces) par le staff — impossible sans session valide
    if (paymentStatus) updateData.paymentStatus = paymentStatus

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE - Delete an order (protégé : propriétaire ou super_admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Session exigée AVANT tout accès base (anti-énumération)
    if (!getSessionFromRequest(request)) return unauthorized()

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const auth = requireRestaurant(request, existing.restaurantId, 'restaurant_owner')
    if (auth instanceof NextResponse) return auth

    await db.order.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
