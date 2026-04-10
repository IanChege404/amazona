import mongoose from 'mongoose'

export interface WebhookReplayAttempt {
  _id?: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  statusCode?: number
  latency: number
  errorMessage?: string
  responseBody?: string
  timestamp?: Date
}

export interface WebhookReplay {
  _id?: string
  originalEventId: string
  eventType: string
  subscriptionId?: string // For vendor webhooks
  vendorId?: string // If vendor webhook
  url?: string // If vendor webhook
  secret?: string
  payload: Record<string, any>
  reason: string // Why replay was initiated
  initiatedBy: string // admin or vendor ID
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  totalAttempts: number
  successCount: number
  failureCount: number
  attempts: WebhookReplayAttempt[]
  maxAttempts: number
  nextRetryAt?: Date
  completedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface WebhookReplayBatch {
  _id?: string
  eventIds: string[]
  eventType?: string
  subscriptionId?: string
  vendorId?: string
  reason: string
  initiatedBy: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  totalReplays: number
  completedReplays: number
  successCount: number
  failureCount: number
  createdAt?: Date
  updatedAt?: Date
}

const WebhookReplayAttemptSchema = new mongoose.Schema<WebhookReplayAttempt>(
  {
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    statusCode: { type: Number },
    latency: { type: Number, required: true },
    errorMessage: { type: String },
    responseBody: { type: String, maxlength: 5000 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
)

const WebhookReplaySchema = new mongoose.Schema<WebhookReplay>(
  {
    originalEventId: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    subscriptionId: { type: String, index: true },
    vendorId: { type: String, index: true },
    url: { type: String },
    secret: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    initiatedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    totalAttempts: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    attempts: [WebhookReplayAttemptSchema],
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, expires: 7776000 } // 90 days TTL
)

const WebhookReplayBatchSchema = new mongoose.Schema<WebhookReplayBatch>(
  {
    eventIds: [{ type: String }],
    eventType: { type: String },
    subscriptionId: { type: String },
    vendorId: { type: String, index: true },
    reason: { type: String, required: true, maxlength: 500 },
    initiatedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    totalReplays: { type: Number, default: 0 },
    completedReplays: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
  },
  { timestamps: true, expires: 7776000 } // 90 days TTL
)

// Indexes
WebhookReplaySchema.index({ createdAt: -1 })
WebhookReplaySchema.index({ vendorId: 1, createdAt: -1 })
WebhookReplaySchema.index({ subscriptionId: 1, status: 1 })
WebhookReplayBatchSchema.index({ createdAt: -1 })

export const WebhookReplayModel =
  mongoose.models.WebhookReplay ||
  mongoose.model<WebhookReplay>('WebhookReplay', WebhookReplaySchema)

export const WebhookReplayBatchModel =
  mongoose.models.WebhookReplayBatch ||
  mongoose.model<WebhookReplayBatch>('WebhookReplayBatch', WebhookReplayBatchSchema)
