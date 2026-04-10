import { stripe } from '@/lib/stripe/connect'
import {
  ReconciliationDiscrepancyModel,
  StripeBalanceSnapshotModel,
  ReconciliationRunModel,
  PayoutVerificationModel,
} from '@/lib/models/reconciliation'
import Order from '@/lib/db/models/order.model'
import Payment from '@/lib/db/models/payment.model'
import Payout from '@/lib/db/models/payout.model'

// Alias models for compatibility
const OrderModel = Order
const PaymentModel = Payment
const PayoutModel = Payout

/**
 * Verify order totals against payment records
 */
export async function verifyOrderPayments() {
  try {
    const orders = await OrderModel.find({ status: { $ne: 'cancelled' } }).lean() as any[]
    let discrepanciesFound = 0

    for (const order of orders) {
      try {
        const expectedTotal = order.totalPrice || 0
        const payments = await PaymentModel.find({ orderId: order._id }).lean() as any[]
        const actualTotal = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

        if (Math.abs(expectedTotal - actualTotal) > 0.01) {
          // Allow 1 cent rounding difference
          discrepanciesFound++

          await ReconciliationDiscrepancyModel.findOneAndUpdate(
            { orderId: order._id, type: 'payment_mismatch' },
            {
              type: 'payment_mismatch',
              severity: Math.abs(expectedTotal - actualTotal) > 100 ? 'critical' : 'high',
              status: 'pending',
              expectedAmount: expectedTotal,
              actualAmount: actualTotal,
              difference: expectedTotal - actualTotal,
              details: {
                orderId: order._id,
                paymentCount: payments.length,
                orderStatus: order.status,
              },
            },
            { upsert: true, new: true }
          )
        }
      } catch (error) {
        console.error(`[Reconciliation] Error checking order ${order._id}:`, error)
      }
    }

    return { discrepanciesFound, ordersChecked: orders.length }
  } catch (error) {
    console.error('[Reconciliation] Order verification failed:', error)
    throw error
  }
}

/**
 * Verify Stripe balance matches expected totals
 */
export async function verifyStripeBalance() {
  try {
    const balance = await stripe.balance.retrieve()

    // Record balance snapshot
    const snapshot = await StripeBalanceSnapshotModel.create({
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      total: (balance.available[0]?.amount || 0) + (balance.pending[0]?.amount || 0),
      currency: balance.available[0]?.currency || 'usd',
      details: {
        available: balance.available,
        pending: balance.pending,
      },
    })

    // Get expected balance from successful orders
    const orders = await OrderModel.find({
      status: 'delivered',
      isPaid: true,
    }).lean() as any[]

    const expectedBalance = orders.reduce(
      (sum: number, order: any) => sum + (order.totalPrice || 0),
      0
    )

    const actualTotal = (snapshot.available + snapshot.pending) / 100 // Convert cents to dollars

    // Check if balance matches within 1% tolerance
    const tolerance = expectedBalance * 0.01
    if (Math.abs(expectedBalance - actualTotal) > tolerance) {
      await ReconciliationDiscrepancyModel.create({
        type: 'balance_mismatch',
        severity: 'high',
        status: 'pending',
        expectedAmount: expectedBalance,
        actualAmount: actualTotal,
        difference: expectedBalance - actualTotal,
        details: {
          availableBalance: snapshot.available,
          pendingBalance: snapshot.pending,
          paidOrdersCount: orders.length,
        },
      })
    }

    return {
      available: snapshot.available,
      pending: snapshot.pending,
      total: snapshot.total,
      expectedBalance,
      actualTotal,
      balanced: Math.abs(expectedBalance - actualTotal) <= tolerance,
    }
  } catch (error) {
    console.error('[Reconciliation] Stripe balance verification failed:', error)
    throw error
  }
}

/**
 * Verify vendor payouts
 */
export async function verifyVendorPayouts() {
  try {
    const payouts = await PayoutModel.find({ status: 'paid' }).lean() as any[]
    let discrepanciesFound = 0

    for (const payout of payouts) {
      try {
        const vendorId = payout.vendorId
        const payoutOrders = await OrderModel.find({
          _id: { $in: payout.orderIds || [] },
          isPaid: true,
        }).lean() as any[]

        const expectedAmount = payoutOrders.reduce((sum: number, o: any) => {
          // Calculate vendor's share (after platform fee)
          const platformFee = (o.totalPrice || 0) * 0.05 // 5% platform fee
          return sum + (o.totalPrice - platformFee)
        }, 0)

        const actualAmount = payout.amount || 0

        if (Math.abs(expectedAmount - actualAmount) > 0.01) {
          discrepanciesFound++

          const existingVerification = await PayoutVerificationModel.findOne({
            payoutId: payout._id,
          })

          if (!existingVerification) {
            await PayoutVerificationModel.create({
              vendorId,
              payoutId: payout._id as string,
              stripePayoutId: payout.stripePayoutId || '',
              expectedAmount,
              actualAmount,
              status: 'mismatch',
              orders: payout.orderIds || [],
              discrepancyDetails: {
                expectedAfterFee: expectedAmount,
                actualPaid: actualAmount,
                difference: expectedAmount - actualAmount,
              },
            })
          }
        } else {
          await PayoutVerificationModel.findOneAndUpdate(
            { payoutId: payout._id },
            {
              status: 'verified',
              verifiedAt: new Date(),
              expectedAmount,
              actualAmount,
            },
            { upsert: true }
          )
        }
      } catch (error) {
        console.error(`[Reconciliation] Error verifying payout ${payout._id}:`, error)
      }
    }

    return { discrepanciesFound, payoutsChecked: payouts.length }
  } catch (error) {
    console.error('[Reconciliation] Payout verification failed:', error)
    throw error
  }
}

/**
 * Run full reconciliation
 */
export async function runFullReconciliation(type: 'full' | 'partial' | 'stripe' | 'payout' = 'full') {
  try {
    const run = await ReconciliationRunModel.create({
      status: 'running',
      type,
    })

    const results = {
      ordersChecked: 0,
      paymentsChecked: 0,
      discrepanciesFound: 0,
      errorList: [] as Array<{ phase: string; error: string }>,
    }

    // Verify order payments
    if (type === 'full' || type === 'partial') {
      try {
        const orderResult = await verifyOrderPayments()
        results.ordersChecked = orderResult.ordersChecked
        results.paymentsChecked = orderResult.ordersChecked // Rough estimate
        results.discrepanciesFound += orderResult.discrepanciesFound
      } catch (error) {
        results.errorList.push({
          phase: 'order_payment_verification',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Verify Stripe balance
    if (type === 'full' || type === 'stripe') {
      try {
        await verifyStripeBalance()
      } catch (error) {
        results.errorList.push({
          phase: 'stripe_balance_verification',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Verify vendor payouts
    if (type === 'full' || type === 'payout') {
      try {
        const payoutResult = await verifyVendorPayouts()
        results.discrepanciesFound += payoutResult.discrepanciesFound
      } catch (error) {
        results.errorList.push({
          phase: 'payout_verification',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Get resolved discrepancies count
    const resolvedCount = await ReconciliationDiscrepancyModel.countDocuments({
      status: { $in: ['resolved', 'ignored'] },
    })

    // Update reconciliation run
    await ReconciliationRunModel.findByIdAndUpdate(run._id, {
      status: 'completed',
      completedAt: new Date(),
      ordersChecked: results.ordersChecked,
      paymentsChecked: results.paymentsChecked,
      discrepanciesFound: results.discrepanciesFound,
      discrepanciesResolved: resolvedCount,
      errorList: results.errorList,
      summary: {
        totalDiscrepancies: results.discrepanciesFound,
        totalResolved: resolvedCount,
        pending: results.discrepanciesFound - resolvedCount,
        errors: results.errorList.length,
      },
    })

    return results
  } catch (error) {
    console.error('[Reconciliation] Full reconciliation failed:', error)
    throw error
  }
}

/**
 * Get reconciliation status
 */
export async function getReconciliationStatus() {
  try {
    const latestRun = await ReconciliationRunModel.findOne()
      .sort({ startedAt: -1 })
      .lean() as any

    const pendingDiscrepancies = await ReconciliationDiscrepancyModel.find({
      status: 'pending',
    }).lean() as any[]

    const criticalDiscrepancies = await ReconciliationDiscrepancyModel.find({
      severity: 'critical',
      status: { $ne: 'resolved' },
    }).lean() as any[]

    const recentRuns = await ReconciliationRunModel.find()
      .sort({ startedAt: -1 })
      .limit(10)
      .lean() as any[]

    const balanceSnapshots = await StripeBalanceSnapshotModel.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean() as any[]

    return {
      latestRun,
      pendingCount: pendingDiscrepancies.length,
      criticalCount: criticalDiscrepancies.length,
      pendingDiscrepancies,
      criticalDiscrepancies,
      recentRuns,
      balanceHistory: balanceSnapshots,
    }
  } catch (error) {
    console.error('[Reconciliation] Failed to get status:', error)
    throw error
  }
}

/**
 * Resolve a discrepancy
 */
export async function resolveDiscrepancy(
  discrepancyId: string,
  resolution: string,
  resolvedBy: string
) {
  try {
    const updated = await ReconciliationDiscrepancyModel.findByIdAndUpdate(
      discrepancyId,
      {
        status: 'resolved',
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
      },
      { new: true }
    )

    return updated
  } catch (error) {
    console.error('[Reconciliation] Failed to resolve discrepancy:', error)
    throw error
  }
}

/**
 * Get discrepancies with filters
 */
export async function getDiscrepancies(filters?: {
  type?: string
  status?: string
  severity?: string
  page?: number
  limit?: number
}) {
  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const query: any = {}
    if (filters?.type) query.type = filters.type
    if (filters?.status) query.status = filters.status
    if (filters?.severity) query.severity = filters.severity

    const discrepancies = await ReconciliationDiscrepancyModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as any[]

    const total = await ReconciliationDiscrepancyModel.countDocuments(query)

    return {
      discrepancies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('[Reconciliation] Failed to get discrepancies:', error)
    throw error
  }
}
