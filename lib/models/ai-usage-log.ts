import { Document, Model, model, models, Schema } from 'mongoose'

export interface IAIUsageLog extends Document {
  vendorId: string
  featureType: 'generate-description' | 'remove-background' | 'embeddings' | 'other'
  status: 'success' | 'failed' | 'rate_limited'
  tokensUsed?: number
  inputTokens?: number
  outputTokens?: number
  costEstimate?: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

const aiUsageLogSchema = new Schema<IAIUsageLog>(
  {
    vendorId: {
      type: String,
      required: true,
      index: true,
    },
    featureType: {
      type: String,
      enum: ['generate-description', 'remove-background', 'embeddings', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'rate_limited'],
      default: 'success',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    costEstimate: {
      type: Number,
      default: 0,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
)

// Index for efficient daily quota checks
aiUsageLogSchema.index({ vendorId: 1, createdAt: -1 })

const AIUsageLog =
  (models.AIUsageLog as Model<IAIUsageLog>) ||
  model<IAIUsageLog>('AIUsageLog', aiUsageLogSchema)

export default AIUsageLog
