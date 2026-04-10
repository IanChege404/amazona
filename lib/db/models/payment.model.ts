import { Document, Model, model, models, Schema } from 'mongoose'

export interface IPayment extends Document {
  orderId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer'
  transactionId?: string
  stripePaymentIntentId?: string
  paypalTransactionId?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
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
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer'],
      required: true,
    },
    transactionId: String,
    stripePaymentIntentId: String,
    paypalTransactionId: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
)

paymentSchema.index({ orderId: 1, status: 1 })
paymentSchema.index({ createdAt: -1 })

const Payment =
  (models.Payment as Model<IPayment>) || model<IPayment>('Payment', paymentSchema)

export default Payment
