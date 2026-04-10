import { Schema, model, Document } from 'mongoose'

/**
 * Reconciliation Discrepancy - Represents a mismatch between expected and actual state
 */
export interface ReconciliationDiscrepancy extends Document {
  type: 'order_mismatch' | 'payment_mismatch' | 'payout_mismatch' | 'balance_mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'investigating' | 'resolved' | 'ignored'
  orderId?: string
  paymentId?: string
  payoutId?: string
  expectedAmount: number
  actualAmount: number
  difference: number
  details: Record<string, any>
  resolution?: string
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Stripe Balance Snapshot - Track Stripe account balance over time
 */
export interface StripeBalanceSnapshot extends Document {
  available: number
  pending: number
  total: number
  currency: string
  connectedAccountId?: string
  details: Record<string, any>
  createdAt: Date
}

/**
 * Reconciliation Run - Track each reconciliation execution
 */
export interface ReconciliationRun extends Document {
  startedAt: Date
  completedAt?: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  type: 'full' | 'partial' | 'stripe' | 'payout'
  ordersChecked: number
  paymentsChecked: number
  discrepanciesFound: number
  discrepanciesResolved: number
  errorList: Array<{
    phase: string
    error: string
    timestamp: Date
  }>
  summary: Record<string, any>
}

/**
 * Payout Verification - Track vendor payouts and verify amounts
 */
export interface PayoutVerification extends Document {
  vendorId: string
  payoutId: string
  stripePayoutId: string
  expectedAmount: number
  actualAmount: number
  currency: string
  status: 'pending' | 'verified' | 'mismatch' | 'failed'
  orders: string[]
  verifiedAt?: Date
  discrepancyDetails?: Record<string, any>
  createdAt: Date
}

// Schemas
const ReconciliationDiscrepancySchema = new Schema<ReconciliationDiscrepancy>(
  {
    type: {
      type: String,
      enum: ['order_mismatch', 'payment_mismatch', 'payout_mismatch', 'balance_mismatch'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'ignored'],
      default: 'pending',
    },
    orderId: String,
    paymentId: String,
    payoutId: String,
    expectedAmount: { type: Number, required: true },
    actualAmount: { type: Number, required: true },
    difference: { type: Number, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    resolution: String,
    resolvedBy: String,
    resolvedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

ReconciliationDiscrepancySchema.index({ type: 1, status: 1 })
ReconciliationDiscrepancySchema.index({ orderId: 1 })
ReconciliationDiscrepancySchema.index({ severity: 1, status: 1 })
ReconciliationDiscrepancySchema.index({ createdAt: -1 })

const StripeBalanceSnapshotSchema = new Schema<StripeBalanceSnapshot>(
  {
    available: { type: Number, required: true },
    pending: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    connectedAccountId: String,
    details: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
)

StripeBalanceSnapshotSchema.index({ createdAt: -1 })
StripeBalanceSnapshotSchema.index({ connectedAccountId: 1, createdAt: -1 })
// TTL: Keep 12 months of balance data
StripeBalanceSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 })

const ReconciliationRunSchema = new Schema<ReconciliationRun>(
  {
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['full', 'partial', 'stripe', 'payout'],
      default: 'full',
    },
    ordersChecked: { type: Number, default: 0 },
    paymentsChecked: { type: Number, default: 0 },
    discrepanciesFound: { type: Number, default: 0 },
    discrepanciesResolved: { type: Number, default: 0 },
    errorList: [
      {
        phase: String,
        error: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    summary: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
)

ReconciliationRunSchema.index({ startedAt: -1 })
ReconciliationRunSchema.index({ status: 1 })
ReconciliationRunSchema.index({ type: 1, startedAt: -1 })

const PayoutVerificationSchema = new Schema<PayoutVerification>(
  {
    vendorId: { type: String, required: true, index: true },
    payoutId: { type: String, required: true },
    stripePayoutId: { type: String, required: true, index: true },
    expectedAmount: { type: Number, required: true },
    actualAmount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'verified', 'mismatch', 'failed'],
      default: 'pending',
    },
    orders: [String],
    verifiedAt: Date,
    discrepancyDetails: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
)

PayoutVerificationSchema.index({ vendorId: 1, status: 1 })
PayoutVerificationSchema.index({ createdAt: -1 })
PayoutVerificationSchema.index({ status: 1 })

// Models with type safety
export const ReconciliationDiscrepancyModel =
  typeof global !== 'undefined' && (global as any).mongooseModels?.['ReconciliationDiscrepancy']
    ? (global as any).mongooseModels['ReconciliationDiscrepancy']
    : model<ReconciliationDiscrepancy>(
        'ReconciliationDiscrepancy',
        ReconciliationDiscrepancySchema
      )

export const StripeBalanceSnapshotModel =
  typeof global !== 'undefined' && (global as any).mongooseModels?.['StripeBalanceSnapshot']
    ? (global as any).mongooseModels['StripeBalanceSnapshot']
    : model<StripeBalanceSnapshot>('StripeBalanceSnapshot', StripeBalanceSnapshotSchema)

export const ReconciliationRunModel =
  typeof global !== 'undefined' && (global as any).mongooseModels?.['ReconciliationRun']
    ? (global as any).mongooseModels['ReconciliationRun']
    : model<ReconciliationRun>('ReconciliationRun', ReconciliationRunSchema)

export const PayoutVerificationModel =
  typeof global !== 'undefined' && (global as any).mongooseModels?.['PayoutVerification']
    ? (global as any).mongooseModels['PayoutVerification']
    : model<PayoutVerification>('PayoutVerification', PayoutVerificationSchema)

// Export for caching
if (typeof global !== 'undefined') {
  const g = global as any
  if (!g.mongooseModels) {
    g.mongooseModels = {}
  }
  g.mongooseModels['ReconciliationDiscrepancy'] = ReconciliationDiscrepancyModel
  g.mongooseModels['StripeBalanceSnapshot'] = StripeBalanceSnapshotModel
  g.mongooseModels['ReconciliationRun'] = ReconciliationRunModel
  g.mongooseModels['PayoutVerification'] = PayoutVerificationModel
}
