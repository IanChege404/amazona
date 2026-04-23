/**
 * Webhook Integration Module
 * Connects webhook triggers to order, payment, product, and vendor actions
 *
 * This module provides high-level integration points for triggering webhooks
 * at key business events throughout the application lifecycle.
 */

'use server'

import {
  triggerOrderCreated,
  triggerOrderPaid,
  triggerOrderDelivered,
  triggerOrderCancelled,
  triggerProductCreated,
  triggerProductUpdated,
  triggerLowStockAlert,
  triggerVendorApproved,
  triggerVendorRejected,
  triggerUserRegistered,
  triggerReviewCreated,
  triggerPayoutProcessed,
} from './triggers'
import { IOrder } from '@/lib/db/models/order.model'
import { IProduct } from '@/lib/db/models/product.model'
import { IVendor } from '@/lib/db/models/vendor.model'
import { dispatchToVendorWebhooks } from '@/lib/actions/vendor-webhook'

/**
 * Webhook integration for order creation
 * Triggers both platform and vendor webhooks
 */
export async function integrateOrderCreated(order: IOrder) {
  try {
    // Trigger platform webhook for order.created event
    await triggerOrderCreated(order)

    // Dispatch to vendor-specific webhooks if they're subscribed
    await dispatchToVendorWebhooks('order.created', {
      orderId: order._id?.toString(),
      vendorId: order.vendorId?.toString(),
      customerId: order.userId?.toString(),
      total: order.totalPrice,
      itemsCount: order.orderItems?.length || 0,
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Order created event triggered for order ${order._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger order.created:', error)
    // Don't throw - allow order to be created even if webhook fails
  }
}

/**
 * Webhook integration for order payment received
 */
export async function integrateOrderPaid(order: IOrder, payment: any) {
  try {
    // Trigger platform webhook
    await triggerOrderPaid(order, payment)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('order.paid', {
      orderId: order._id?.toString(),
      vendorId: order.vendorId?.toString(),
      customerId: order.userId?.toString(),
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Order paid event triggered for order ${order._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger order.paid:', error)
  }
}

/**
 * Webhook integration for order delivery confirmation
 */
export async function integrateOrderDelivered(order: IOrder, deliveryDate?: Date) {
  try {
    // Trigger platform webhook
    await triggerOrderDelivered(order, deliveryDate)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('order.delivered', {
      orderId: order._id?.toString(),
      vendorId: order.vendorId?.toString(),
      customerId: order.userId?.toString(),
      deliveryDate: deliveryDate || new Date(),
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Order delivered event triggered for order ${order._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger order.delivered:', error)
  }
}

/**
 * Webhook integration for order cancellation
 */
export async function integrateOrderCancelled(order: IOrder, reason?: string) {
  try {
    // Trigger platform webhook
    await triggerOrderCancelled(order, reason)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('order.cancelled', {
      orderId: order._id?.toString(),
      vendorId: order.vendorId?.toString(),
      customerId: order.userId?.toString(),
      reason: reason || 'Not specified',
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Order cancelled event triggered for order ${order._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger order.cancelled:', error)
  }
}

/**
 * Webhook integration for product creation
 */
export async function integrateProductCreated(product: IProduct) {
  try {
    // Trigger platform webhook
    await triggerProductCreated(product)

    // Dispatch to vendor webhooks (their own webhook subscriptions)
    await dispatchToVendorWebhooks('product.created', {
      productId: product._id?.toString(),
      vendorId: product.vendorId?.toString(),
      name: product.name,
      sku: product.sku,
      price: product.price,
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Product created event triggered for product ${product._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger product.created:', error)
  }
}

/**
 * Webhook integration for product update
 */
export async function integrateProductUpdated(
  product: IProduct,
  changes: Record<string, any>
) {
  try {
    // Trigger platform webhook
    await triggerProductUpdated(product, changes)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('product.updated', {
      productId: product._id?.toString(),
      vendorId: product.vendorId?.toString(),
      changes,
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Product updated event triggered for product ${product._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger product.updated:', error)
  }
}

/**
 * Webhook integration for low stock alert
 */
export async function integrateProductLowStock(product: IProduct, currentStock: number) {
  try {
    // Trigger platform webhook
    await triggerLowStockAlert(product, currentStock)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('product.low_stock', {
      productId: product._id?.toString(),
      vendorId: product.vendorId?.toString(),
      name: product.name,
      currentStock,
      lowStockThreshold: 10, // Configurable
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Low stock alert triggered for product ${product._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger product.low_stock:', error)
  }
}

/**
 * Webhook integration for vendor approval
 */
export async function integrateVendorApproved(vendor: IVendor) {
  try {
    // Trigger platform webhook
    await triggerVendorApproved(vendor)

    console.log(`[WEBHOOK] Vendor approved event triggered for vendor ${vendor._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger vendor.approved:', error)
  }
}

/**
 * Webhook integration for vendor rejection
 */
export async function integrateVendorRejected(vendor: IVendor, reason?: string) {
  try {
    // Trigger platform webhook
    await triggerVendorRejected(vendor, reason)

    console.log(`[WEBHOOK] Vendor rejected event triggered for vendor ${vendor._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger vendor.rejected:', error)
  }
}

/**
 * Webhook integration for user registration
 */
export async function integrateUserRegistered(user: any) {
  try {
    // Trigger platform webhook
    await triggerUserRegistered(user)

    console.log(`[WEBHOOK] User registered event triggered for user ${user._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger user.registered:', error)
  }
}

/**
 * Webhook integration for product review/rating
 */
export async function integrateReviewCreated(review: any, product: IProduct) {
  try {
    // Trigger platform webhook
    await triggerReviewCreated(review)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('review.created', {
      reviewId: review._id?.toString(),
      productId: product._id?.toString(),
      vendorId: product.vendorId?.toString(),
      rating: review.rating,
      customerId: review.userId?.toString(),
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Review created event triggered for product ${product._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger review.created:', error)
  }
}

/**
 * Webhook integration for payout processed
 */
export async function integratePayoutProcessed(payout: any) {
  try {
    // Trigger platform webhook
    await triggerPayoutProcessed(payout)

    // Dispatch to vendor webhooks
    await dispatchToVendorWebhooks('payout.processed', {
      payoutId: payout._id?.toString(),
      vendorId: payout.vendorId?.toString(),
      amount: payout.amount,
      period: payout.period,
      timestamp: new Date(),
    })

    console.log(`[WEBHOOK] Payout processed event triggered for payout ${payout._id}`)
  } catch (error) {
    console.error('[WEBHOOK] Failed to trigger payout.processed:', error)
  }
}

export default {
  integrateOrderCreated,
  integrateOrderPaid,
  integrateOrderDelivered,
  integrateOrderCancelled,
  integrateProductCreated,
  integrateProductUpdated,
  integrateProductLowStock,
  integrateVendorApproved,
  integrateVendorRejected,
  integrateUserRegistered,
  integrateReviewCreated,
  integratePayoutProcessed,
}
