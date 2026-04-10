import { Document, Model, model, models, Schema } from 'mongoose'

export interface IPayout extends Document {
  vendorId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled'
  stripePayoutId?: string
  bankDetails?: {
    accountHolderName?: string
    accountNumber?: string
    routingNumber?: string
    bankName?: string
  }
  orderIds?: string[]
  periodStart?: Date
  periodEnd?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const payoutSchema = new Schema<IPayout>(
  {
    vendorId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    stripePayoutId: String,
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String,
    },
    orderIds: [String],
    periodStart: Date,
    periodEnd: Date,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
)

payoutSchema.index({ vendorId: 1, status: 1 })
payoutSchema.index({ vendorId: 1, createdAt: -1 })
payoutSchema.index({ status: 1 })
payoutSchema.index({ createdAt: -1 })

const Payout =
  (models.Payout as Model<IPayout>) || model<IPayout>('Payout', payoutSchema)

export default Payout
