import { Document, Model, model, models, Schema } from 'mongoose'
import { IVendorInput } from '@/types'

export interface IVendor extends Document, IVendorInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const vendorSchema = new Schema<IVendor>(
  {
    userId: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      street: String,
      city: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    stripeAccountId: {
      type: String,
      default: '',
    },
    stripeOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    stripeRequirementsDue: {
      type: [String],
      default: [],
    },
    commissionRate: {
      type: Number,
      default: 10,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    // Subscription tier management
    subscriptionTier: {
      type: String,
      enum: ['free', 'starter', 'pro'],
      default: 'free',
    },
    subscriptionId: {
      type: String,
      default: '',
    },
    stripeCustomerId: {
      type: String,
      default: '',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing'],
      default: 'active',
    },
    subscriptionCurrentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-generate slug from businessName if not provided
vendorSchema.pre('validate', function (this: Document & IVendor, next: () => void) {
  if (this.businessName && !this.slug) {
    this.slug = this.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  next()
})

// Indexes for performance
vendorSchema.index({ userId: 1 })
vendorSchema.index({ slug: 1 })
vendorSchema.index({ status: 1 })

const Vendor = (models.Vendor as Model<IVendor>) || model<IVendor>('Vendor', vendorSchema)

export default Vendor
