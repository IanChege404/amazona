import mongoose from 'mongoose'
import { WebhookEventType } from '@/lib/webhooks/types'

export interface VendorWebhookSubscription {
  _id?: string
  vendorId: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  description?: string
  retryAttempts: number
  timeoutSeconds: number
  headers?: Record<string, string>
  failureCount: number
  lastFailureAt?: Date
  lastSuccessAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface VendorWebhookTest {
  _id?: string
  vendorId: string
  subscriptionId: string
  eventType: string
  status: 'pending' | 'success' | 'failed'
  responseStatus?: number
  responseBody?: string
  duration: number
  createdAt?: Date
}

export interface VendorWebhookDelivery {
  _id?: string
  vendorId: string
  subscriptionId: string
  eventId: string
  eventType: string
  status: 'success' | 'failed' | 'pending' | 'retry'
  statusCode?: number
  latency: number
  errorMessage?: string
  retryAttempt: number
  deliveredAt?: Date
  nextRetryAt?: Date
  createdAt?: Date
}

const VendorWebhookSubscriptionSchema = new mongoose.Schema<VendorWebhookSubscription>(
  {
    vendorId: { type: String, required: true, index: true },
    url: { type: String, required: true, minlength: 10, maxlength: 2048 },
    events: [
      {
        type: String,
        enum: Object.values(WebhookEventType),
      },
    ],
    secret: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    description: { type: String, maxlength: 500 },
    retryAttempts: { type: Number, default: 5, min: 0, max: 10 },
    timeoutSeconds: { type: Number, default: 10, min: 5, max: 60 },
    headers: { type: Map, of: String },
    failureCount: { type: Number, default: 0 },
    lastFailureAt: { type: Date },
    lastSuccessAt: { type: Date },
  },
  { timestamps: true }
)

const VendorWebhookTestSchema = new mongoose.Schema<VendorWebhookTest>(
  {
    vendorId: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    responseStatus: { type: Number },
    responseBody: { type: String, maxlength: 5000 },
    duration: { type: Number, required: true },
  },
  { timestamps: true }
)

const VendorWebhookDeliverySchema = new mongoose.Schema<VendorWebhookDelivery>(
  {
    vendorId: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'retry'],
      default: 'pending',
      index: true,
    },
    statusCode: { type: Number },
    latency: { type: Number, required: true },
    errorMessage: { type: String },
    retryAttempt: { type: Number, default: 0 },
    deliveredAt: { type: Date },
    nextRetryAt: { type: Date },
  },
  { timestamps: true, expires: 2592000 }
) // 30 days TTL

// Indexes for efficient querying
VendorWebhookSubscriptionSchema.index({ vendorId: 1, isActive: 1 })
VendorWebhookTestSchema.index({ vendorId: 1, createdAt: -1 })
VendorWebhookDeliverySchema.index({ vendorId: 1, subscriptionId: 1, createdAt: -1 })
VendorWebhookDeliverySchema.index({ subscriptionId: 1, status: 1 })

// Instance methods
VendorWebhookSubscriptionSchema.methods.recordSuccess = function () {
  this.lastSuccessAt = new Date()
  this.failureCount = 0
  return this.save()
}

VendorWebhookSubscriptionSchema.methods.recordFailure = function () {
  this.lastFailureAt = new Date()
  this.failureCount = (this.failureCount || 0) + 1
  if (this.failureCount >= 5) {
    this.isActive = false
  }
  return this.save()
}

VendorWebhookSubscriptionSchema.methods.isHealthy = function (): boolean {
  if (!this.isActive) return false
  if (!this.lastSuccessAt) return false

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return this.lastSuccessAt > oneDayAgo
}

export const VendorWebhookSubscriptionModel =
  mongoose.models.VendorWebhookSubscription ||
  mongoose.model<VendorWebhookSubscription>(
    'VendorWebhookSubscription',
    VendorWebhookSubscriptionSchema
  )

export const VendorWebhookTestModel =
  mongoose.models.VendorWebhookTest ||
  mongoose.model<VendorWebhookTest>('VendorWebhookTest', VendorWebhookTestSchema)

export const VendorWebhookDeliveryModel =
  mongoose.models.VendorWebhookDelivery ||
  mongoose.model<VendorWebhookDelivery>(
    'VendorWebhookDelivery',
    VendorWebhookDeliverySchema
  )
