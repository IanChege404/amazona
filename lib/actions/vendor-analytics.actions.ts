/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import Order from '../db/models/order.model'
import { DateRange } from 'react-day-picker'
import { round2 } from '../utils'

export async function getVendorAnalytics(vendorId: string, dateRange: DateRange) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')

    // Get orders containing this vendor's items
    const orders = await Order.find({
      'items.vendorId': vendorId,
      createdAt: {
        $gte: dateRange.from,
        $lte: dateRange.to,
      },
    }).lean()

    // Filter and calculate metrics for vendor's items only
    let totalRevenue = 0
    const totalOrders = new Set<string>()
    let totalItemsSold = 0
    orders.forEach((order) => {
      order.items.filter((item: any) => item.vendorId === vendorId).forEach((item: any) => {
        totalOrders.add(order._id.toString())
        totalRevenue += item.price * item.quantity
        totalItemsSold += item.quantity
      })
    })

    const uniqueOrders = totalOrders.size
    const avgOrderValue = uniqueOrders > 0 ? round2(totalRevenue / uniqueOrders) : 0
    const conversionMetric = orders.length > 0 ? round2((uniqueOrders / orders.length) * 100) : 0

    return {
      success: true,
      data: {
        totalRevenue: round2(totalRevenue),
        totalOrders: uniqueOrders,
        totalItemsSold,
        avgOrderValue,
        conversionMetric,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch analytics',
    }
  }
}

export async function getVendorRevenueTrend(
  vendorId: string,
  dateRange: DateRange
) {
  try {
    await connectToDatabase()

    const result = await Order.aggregate([
      {
        $match: {
          'items.vendorId': vendorId,
          createdAt: {
            $gte: dateRange.from,
            $lte: dateRange.to,
          },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorId,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] },
          },
          orders: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.day', 10] },
                  { $concat: ['0', { $toString: '$_id.day' }] },
                  { $toString: '$_id.day' },
                ],
              },
            ],
          },
          revenue: 1,
          orderCount: { $size: '$orders' },
        },
      },
      { $sort: { date: 1 } },
    ])

    return {
      success: true,
      data: result.map((item) => ({
        date: item.date,
        revenue: round2(item.revenue),
        orders: item.orderCount,
      })),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch revenue trend',
    }
  }
}

export async function getVendorTopProducts(
  vendorId: string,
  dateRange: DateRange,
  limit = 10
) {
  try {
    await connectToDatabase()

    const result = await Order.aggregate([
      {
        $match: {
          'items.vendorId': vendorId,
          createdAt: {
            $gte: dateRange.from,
            $lte: dateRange.to,
          },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorId,
        },
      },
      {
        $group: {
          _id: {
            productId: '$items.product',
            name: '$items.name',
            image: '$items.image',
          },
          totalRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] },
          },
          quantitySold: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          productId: '$_id.productId',
          name: '$_id.name',
          image: '$_id.image',
          revenue: '$totalRevenue',
          quantity: '$quantitySold',
          orders: { $size: '$orders' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ])

    return {
      success: true,
      data: result.map((item) => ({
        ...item,
        revenue: round2(item.revenue),
      })),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch top products',
    }
  }
}

export async function getVendorCategoryBreakdown(
  vendorId: string,
  dateRange: DateRange
) {
  try {
    await connectToDatabase()

    const result = await Order.aggregate([
      {
        $match: {
          'items.vendorId': vendorId,
          createdAt: {
            $gte: dateRange.from,
            $lte: dateRange.to,
          },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorId,
        },
      },
      {
        $group: {
          _id: '$items.category',
          revenue: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] },
          },
          quantity: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          revenue: '$revenue',
          quantity: '$quantity',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$revenue', { $sum: '$revenue' }] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    // Need to calculate percentages correctly
    const total = result.reduce((sum: number, item: any) => sum + item.revenue, 0)
    return {
      success: true,
      data: result.map((item: any) => ({
        category: item.category || 'Uncategorized',
        revenue: round2(item.revenue),
        quantity: item.quantity,
        percentage: total > 0 ? round2((item.revenue / total) * 100) : 0,
      })),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch category breakdown',
    }
  }
}

export async function getVendorOrderStats(
  vendorId: string,
  dateRange: DateRange
) {
  try {
    await connectToDatabase()

    const orders = await Order.find({
      'items.vendorId': vendorId,
      createdAt: {
        $gte: dateRange.from,
        $lte: dateRange.to,
      },
    }).lean()

    const stats = {
      total: orders.length,
      paid: orders.filter((o: any) => o.isPaid).length,
      delivered: orders.filter((o: any) => o.isDelivered).length,
      pending: orders.filter((o: any) => !o.isPaid).length,
    }

    return {
      success: true,
      data: {
        total: stats.total,
        paid: stats.paid,
        delivered: stats.delivered,
        pending: stats.pending,
        paidRate: stats.total > 0 ? round2((stats.paid / stats.total) * 100) : 0,
        deliveryRate: stats.total > 0 ? round2((stats.delivered / stats.total) * 100) : 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch order stats',
    }
  }
}
