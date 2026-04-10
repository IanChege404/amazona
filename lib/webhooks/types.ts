/**
 * Webhook Event Types and Models
 * Defines all webhook events in the system
 */

export enum WebhookEventType {
  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_PAID = 'order.paid',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_RETURNED = 'order.returned',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYMENT_DISPUTED = 'payment.disputed',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_OUT_OF_STOCK = 'product.out_of_stock',
  PRODUCT_LOW_STOCK = 'product.low_stock',

  // Vendor events
  VENDOR_CREATED = 'vendor.created',
  VENDOR_APPROVED = 'vendor.approved',
  VENDOR_SUSPENDED = 'vendor.suspended',
  VENDOR_SETTINGS_UPDATED = 'vendor.settings_updated',

  // User events
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_BANNED = 'user.banned',

  // Payout events
  PAYOUT_INITIATED = 'payout.initiated',
  PAYOUT_COMPLETED = 'payout.completed',
  PAYOUT_FAILED = 'payout.failed',

  // Review events
  REVIEW_CREATED = 'review.created',
  REVIEW_UPDATED = 'review.updated',
}

export interface WebhookPayload {
  id: string
  event: WebhookEventType
  timestamp: Date
  version: string
  data: Record<string, any>
  attempts: number
  lastAttempt?: Date
  nextRetry?: Date
  error?: string
}

/**
 * Webhook subscription model
 */
export interface WebhookSubscription {
  id: string
  userId: string
  vendorId?: string
  url: string
  events: WebhookEventType[]
  active: boolean
  secret: string
  headers?: Record<string, string>
  maxRetries: number
  retryInterval: number // in seconds
  createdAt: Date
  updatedAt: Date
  lastTriggeredAt?: Date
  failureCount: number
  successCount: number
}

/**
 * Webhook delivery log
 */
export interface WebhookDeliveryLog {
  id: string
  webhookSubscriptionId: string
  payloadId: string
  statusCode?: number
  response?: string
  error?: string
  duration: number // in milliseconds
  attempt: number
  createdAt: Date
  success: boolean
}

/**
 * Type-safe webhook data builders
 */
export const webhookDataBuilders = {
  orderCreated: (order: any) => ({
    orderId: order._id.toString(),
    customerId: order.userId.toString(),
    vendorId: order.vendorId.toString(),
    totalAmount: order.totalAmount,
    status: order.status,
  }),

  orderPaid: (order: any, payment: any) => ({
    orderId: order._id.toString(),
    paymentMethod: payment.paymentMethod,
    amount: payment.amount,
    transactionId: payment.transactionId,
  }),

  productCreated: (product: any) => ({
    productId: product._id.toString(),
    vendorId: product.vendorId.toString(),
    name: product.name,
    sku: product.sku,
    price: product.price,
  }),

  productLowStock: (product: any, currentStock: number) => ({
    productId: product._id.toString(),
    vendorId: product.vendorId.toString(),
    name: product.name,
    currentStock,
    lowStockThreshold: product.lowStockThreshold,
  }),

  paymentFailed: (order: any, error: string) => ({
    orderId: order._id.toString(),
    customerId: order.userId.toString(),
    reason: error,
    amount: order.totalAmount,
  }),

  vendorApproved: (vendor: any) => ({
    vendorId: vendor._id.toString(),
    businessName: vendor.businessName,
    email: vendor.email,
  }),
}
