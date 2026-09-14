import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    // Get date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // Total orders
    const totalOrders = await db.order.count({
      where: { restaurantId },
    })

    // Today's orders
    const todayOrders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: today },
      },
      include: {
        items: true,
      },
    })

    // Monthly orders
    const monthlyOrders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfMonth },
      },
      include: {
        items: true,
      },
    })

    // Last month orders for comparison
    const lastMonthOrders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    })

    // Calculate revenue
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0)
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0)

    // Orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: true,
    })

    // Orders by payment status
    const ordersByPaymentStatus = await db.order.groupBy({
      by: ['paymentStatus'],
      where: { restaurantId },
      _count: true,
    })

    // Top products
    const orderItems = await db.orderItem.findMany({
      where: {
        product: { restaurantId },
      },
      include: {
        product: true,
      },
    })

    const productSales: Record<string, { name: string; count: number; revenue: number }> = {}
    orderItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.product.name,
          count: 0,
          revenue: 0,
        }
      }
      productSales[item.productId].count += item.quantity
      productSales[item.productId].revenue += item.price * item.quantity
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Recent orders
    const recentOrders = await db.order.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Daily revenue for the last 7 days
    const last7Days: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayOrders = await db.order.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      })

      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      })
    }

    // Calculate growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0
    const orderGrowth = lastMonthOrders.length > 0 
      ? ((monthlyOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
      : 0

    return NextResponse.json({
      overview: {
        totalOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        monthlyRevenue,
        revenueGrowth,
        orderGrowth,
      },
      ordersByStatus,
      ordersByPaymentStatus,
      topProducts,
      recentOrders,
      dailyRevenue: last7Days,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
