/**
 * Internal Webhook Event Triggers
 * Functions to trigger webhooks for internal events
 */

import { WebhookEventType, webhookDataBuilders } from '@/lib/webhooks/types'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

function toStringId(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)

  if (value && typeof value === 'object') {
    const id = (value as { _id?: unknown; id?: unknown })._id ?? (value as { id?: unknown }).id
    if (id !== undefined) return toStringId(id)
  }

  return undefined
}

function getOrderVendorIds(order: any): string[] {
  const vendorIds = (order.items || [])
    .map((item: any): string | undefined => toStringId(item.vendorId))
    .filter((vendorId: string | undefined): vendorId is string => Boolean(vendorId))

  return [...new Set<string>(vendorIds)]
}

/**
 * Trigger order created event
 */
export async function triggerOrderCreated(order: any) {
  return dispatchWebhook(WebhookEventType.ORDER_CREATED, webhookDataBuilders.orderCreated(order))
}

/**
 * Trigger order paid event
 */
export async function triggerOrderPaid(order: any, payment: any) {
  return dispatchWebhook(WebhookEventType.ORDER_PAID, webhookDataBuilders.orderPaid(order, payment))
}

/**
 * Trigger order delivered event
 */
export async function triggerOrderDelivered(order: any, deliveryDate?: Date) {
  return dispatchWebhook(WebhookEventType.ORDER_DELIVERED, {
    orderId: order._id.toString(),
    customerId: toStringId(order.user),
    vendorIds: getOrderVendorIds(order),
    deliveryDate: deliveryDate || new Date(),
  })
}

/**
 * Trigger order cancelled event
 */
export async function triggerOrderCancelled(order: any, reason?: string) {
  return dispatchWebhook(WebhookEventType.ORDER_CANCELLED, {
    orderId: order._id.toString(),
    customerId: toStringId(order.user),
    vendorIds: getOrderVendorIds(order),
    reason: reason || 'Customer requested cancellation',
  })
}

/**
 * Trigger product created event
 */
export async function triggerProductCreated(product: any) {
  return dispatchWebhook(
    WebhookEventType.PRODUCT_CREATED,
    webhookDataBuilders.productCreated(product)
  )
}

/**
 * Trigger product updated event
 */
export async function triggerProductUpdated(product: any, changes: Record<string, any>) {
  return dispatchWebhook(WebhookEventType.PRODUCT_UPDATED, {
    productId: product._id.toString(),
    vendorId: product.vendorId.toString(),
    changes,
  })
}

/**
 * Trigger product out of stock event
 */
export async function triggerProductOutOfStock(product: any) {
  return dispatchWebhook(WebhookEventType.PRODUCT_OUT_OF_STOCK, {
    productId: product._id.toString(),
    vendorId: product.vendorId.toString(),
    name: product.name,
  })
}

/**
 * Trigger low stock alert
 */
export async function triggerLowStockAlert(product: any, currentStock: number) {
  return dispatchWebhook(
    WebhookEventType.PRODUCT_LOW_STOCK,
    webhookDataBuilders.productLowStock(product, currentStock)
  )
}

/**
 * Trigger vendor approved event
 */
export async function triggerVendorApproved(vendor: any) {
  return dispatchWebhook(
    WebhookEventType.VENDOR_APPROVED,
    webhookDataBuilders.vendorApproved(vendor)
  )
}

/**
 * Trigger vendor rejected event
 */
export async function triggerVendorRejected(vendor: any, reason?: string) {
  return dispatchWebhook(WebhookEventType.VENDOR_REJECTED, {
    vendorId: vendor._id.toString(),
    businessName: vendor.businessName,
    reason: reason || 'Application rejected',
  })
}

/**
 * Trigger vendor suspended event
 */
export async function triggerVendorSuspended(vendor: any, reason?: string) {
  return dispatchWebhook(WebhookEventType.VENDOR_SUSPENDED, {
    vendorId: vendor._id.toString(),
    businessName: vendor.businessName,
    reason: reason || 'Policy violation',
  })
}

/**
 * Trigger user registered event
 */
export async function triggerUserRegistered(user: any) {
  return dispatchWebhook(WebhookEventType.USER_REGISTERED, {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  })
}

/**
 * Trigger review created event
 */
export async function triggerReviewCreated(review: any) {
  return dispatchWebhook(WebhookEventType.REVIEW_CREATED, {
    reviewId: review._id.toString(),
    productId: review.productId.toString(),
    userId: review.userId.toString(),
    rating: review.rating,
    title: review.title,
  })
}

/**
 * Trigger payout initiated event
 */
export async function triggerPayoutInitiated(payout: any) {
  return dispatchWebhook(WebhookEventType.PAYOUT_INITIATED, {
    payoutId: payout._id.toString(),
    vendorId: payout.vendorId.toString(),
    amount: payout.amount,
    bankAccount: payout.bankAccount,
  })
}

/**
 * Trigger payout processed event
 */
export async function triggerPayoutProcessed(payout: any) {
  return dispatchWebhook(WebhookEventType.PAYOUT_PROCESSED, {
    payoutId: payout._id.toString(),
    vendorId: payout.vendorId.toString(),
    amount: payout.amount,
    currency: payout.currency,
    status: payout.status,
    periodStart: payout.periodStart,
    periodEnd: payout.periodEnd,
  })
}
