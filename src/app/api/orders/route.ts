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
    const { restaurantId, items, customerName, customerPhone, customerEmail, tableNumber, notes, type, paymentMethod } = body

    // Calculate totals
    let subtotal = 0
    const orderItems = []

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
        paymentStatus: 'pending',
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

    // Initier le paiement Moneroo si sélectionné
    if (paymentMethod === 'moneroo') {
      const MONEROO_URL = 'https://api.moneroo.io/v1/payments/initialize'
      const MONEROO_SECRET = process.env.MONEROO_SECRET || 'pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6'
      const returnUrl = request.headers.get('origin') ? `${request.headers.get('origin')}/success` : 'http://localhost:3000/success'

      const monerooResponse = await fetch(MONEROO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MONEROO_SECRET}`
        },
        body: JSON.stringify({
          amount: Math.max(1, Math.round(order.total / 600)), // Convertir en USD approx pour test
          currency: 'USD', // Forcer USD car XOF n'est pas activé dans le sandbox Moneroo du client
          description: `Commande ${order.orderNumber}`,
          customer: {
            email: 'client@example.com',
            first_name: customerName?.split(' ')[0] || 'Client',
            last_name: customerName?.split(' ').slice(1).join(' ') || 'Client',
            phone: customerPhone || ''
          },
          return_url: returnUrl,
          metadata: {
            orderId: order.id
          }
        })
      })

      if (monerooResponse.ok) {
        const monerooData = await monerooResponse.json()
        return NextResponse.json({ ...order, paymentData: monerooData })
      } else {
        const errorText = await monerooResponse.text()
        console.error('Moneroo error:', errorText)
        return NextResponse.json({ ...order, paymentError: errorText })
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
