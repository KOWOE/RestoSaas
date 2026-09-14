import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// GET - Fetch orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      })
      return NextResponse.json(order)
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { restaurantId }
    if (status) where.status = status

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
      isDemo 
    } = body

    // Check if this is a demo order or demo restaurant
    const isDemoOrder = Boolean(isDemo || restaurantId === 'demo-restaurant');

    // Calculate totals
    let subtotal = 0
    const orderItems: Array<{ productId: string; quantity: number; price: number; notes?: string | null }> = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        notes: item.notes,
      })
    }

    // Get restaurant tax rate
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    })

    const isDemoRestaurant = isDemoOrder || restaurant?.slug === 'le-jardin-savoureux' || restaurant?.id === 'demo-restaurant'
    const taxRate = restaurant?.taxRate || 0.18
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        restaurantId,
        customerName,
        customerPhone,
        customerEmail,
        tableNumber,
        notes,
        type: type || 'dine_in',
        subtotal,
        tax,
        total,
        status: 'pending',
        paymentStatus: isDemoRestaurant && (paymentMethod === 'mobile_money' || paymentMethod === 'card') ? 'paid' : 'pending',
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

    // En mode Démo ou Test, aucun appel Moneroo : la commande passe instantanément et tranquillement
    if (isDemoRestaurant) {
      return NextResponse.json({ ...order, isDemo: true, checkoutUrl: null })
    }

    // Pour un vrai restaurant avec paiement en ligne sélectionné (Mobile Money, Carte, Moneroo, FedaPay)
    const isOnlinePayment = ['mobile_money', 'card', 'moneroo', 'fedapay', 'assazara'].includes(paymentMethod || '')
    
    if (isOnlinePayment && !isDemoRestaurant) {
      try {
        const MONEROO_URL = process.env.MONEROO_URL || 'https://api.moneroo.io/v1/payments/initialize'
        const MONEROO_SECRET = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_SECRET || 'pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6'
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const returnUrl = `${origin}/success?type=order&orderId=${order.id}&slug=${restaurant?.slug || ''}&amount=${Math.round(order.total)}`

        const rawCurrency = (restaurant?.currency || 'XOF').toUpperCase()
        const finalAmount = Math.round(order.total)
        const isLive = MONEROO_SECRET.startsWith('pvk_live_')

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

        let monerooResponse = await fetch(MONEROO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MONEROO_SECRET}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        // Fallback sandbox si XOF n'est pas activé en mode test
        if (!monerooResponse.ok && !isLive && rawCurrency === 'XOF') {
          monerooResponse = await fetch(MONEROO_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${MONEROO_SECRET}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              ...payload,
              amount: Math.max(1, Math.round(finalAmount / 600)),
              currency: 'USD'
            })
          })
        }

        if (monerooResponse.ok) {
          const monerooData = await monerooResponse.json()
          const checkoutUrl = monerooData?.data?.checkout_url || monerooData?.checkout_url || monerooData?.checkoutUrl || monerooData?.data?.url || monerooData?.url || null
          return NextResponse.json({ ...order, checkoutUrl, paymentData: monerooData })
        }
      } catch (err) {
        console.error('Error triggering Moneroo / FedaPay payment:', err)
      }
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create order' }, { status: 500 })
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, paymentStatus, paymentMethod } = body

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod

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

    // If payment is successful, create payment record
    if (paymentStatus === 'paid' && paymentMethod) {
      const existingPayment = await db.payment.findUnique({
        where: { orderId: id },
      })

      if (!existingPayment) {
        await db.payment.create({
          data: {
            orderId: id,
            restaurantId: order.restaurantId,
            amount: order.total,
            status: 'success',
            method: paymentMethod,
            transactionId: `TXN-${Date.now()}`,
          },
        })
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE - Delete an order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    await db.order.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
