import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireRestaurant } from '@/lib/auth'

// GET - Dashboard statistics (protégé : staff du restaurant ou super_admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const auth = requireRestaurant(request, restaurantId, 'restaurant_owner', 'manager', 'staff')
    if (auth instanceof NextResponse) return auth

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
      select: { id: true, total: true },
    })

    // Monthly orders
    const monthlyOrders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfMonth },
      },
      select: { id: true, total: true },
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
      select: { id: true, total: true },
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

    // Top products — une seule requête (plus de N+1)
    const orderItems = await db.orderItem.findMany({
      where: {
        product: { restaurantId },
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: { select: { name: true } },
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

    // Daily revenue for the last 7 days — UNE seule requête au lieu de 7
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const last7DaysOrders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { total: true, createdAt: true },
    })

    const last7Days: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const dayOrders = last7DaysOrders.filter(o => {
        const d = new Date(o.createdAt)
        return d.getFullYear() === date.getFullYear()
          && d.getMonth() === date.getMonth()
          && d.getDate() === date.getDate()
      })
      last7Days.push({
        date: dateKey,
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
