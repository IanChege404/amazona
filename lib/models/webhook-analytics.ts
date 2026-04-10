import mongoose from 'mongoose'

export interface WebhookMetric {
  _id?: string
  eventType: string
  totalDispatched: number
  successfulDeliveries: number
  failedDeliveries: number
  averageLatency: number
  minLatency: number
  maxLatency: number
  p95Latency: number
  p99Latency: number
  retryCount: number
  lastOccurrence: Date
  timestamp: Date
}

export interface WebhookEventLog {
  _id?: string
  eventId: string
  eventType: string
  subscriptionId: string
  url: string
  status: 'success' | 'failed' | 'pending' | 'retry'
  statusCode?: number
  deliveredAt?: Date
  latency: number
  errorMessage?: string
  retryAttempt: number
  nextRetryAt?: Date
  signature: string
  timestamp: Date
}

export interface WebhookTrend {
  _id?: string
  date: Date
  eventType: string
  count: number
  successRate: number
  averageLatency: number
  failureRate: number
}

const WebhookMetricSchema = new mongoose.Schema<WebhookMetric>(
  {
    eventType: { type: String, required: true, index: true },
    totalDispatched: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    averageLatency: { type: Number, default: 0 },
    minLatency: { type: Number, default: 0 },
    maxLatency: { type: Number, default: 0 },
    p95Latency: { type: Number, default: 0 },
    p99Latency: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    lastOccurrence: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now, expires: 2592000 }, // 30 days TTL
  },
  { timestamps: true }
)

const WebhookEventLogSchema = new mongoose.Schema<WebhookEventLog>(
  {
    eventId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'retry'],
      default: 'pending',
      index: true,
    },
    statusCode: { type: Number },
    deliveredAt: { type: Date },
    latency: { type: Number, required: true },
    errorMessage: { type: String },
    retryAttempt: { type: Number, default: 0 },
    nextRetryAt: { type: Date },
    signature: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, expires: 2592000, index: true }, // 30 days TTL
  },
  { timestamps: true }
)

const WebhookTrendSchema = new mongoose.Schema<WebhookTrend>(
  {
    date: { type: Date, required: true, index: true },
    eventType: { type: String, required: true },
    count: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageLatency: { type: Number, default: 0 },
    failureRate: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Create compound index for efficient querying
WebhookTrendSchema.index({ date: -1, eventType: 1 })
WebhookEventLogSchema.index({ eventType: 1, timestamp: -1 })
WebhookEventLogSchema.index({ status: 1, timestamp: -1 })

export const WebhookMetricModel =
  mongoose.models.WebhookMetric ||
  mongoose.model<WebhookMetric>('WebhookMetric', WebhookMetricSchema)

export const WebhookEventLogModel =
  mongoose.models.WebhookEventLog ||
  mongoose.model<WebhookEventLog>('WebhookEventLog', WebhookEventLogSchema)

export const WebhookTrendModel =
  mongoose.models.WebhookTrend ||
  mongoose.model<WebhookTrend>('WebhookTrend', WebhookTrendSchema)
