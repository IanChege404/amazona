'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import { IVendorApplication, IVendorInput } from '@/types'
import Vendor from '@/lib/db/models/vendor.model'
import User from '@/lib/db/models/user.model'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { VendorApplicationSchema } from '@/lib/validator'
import { sendVendorApprovedEmail, sendVendorApplicationReceivedEmail } from '@/emails'

// Create a vendor application
export async function createVendorApplication(data: IVendorApplication) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    // Validate input
    const validatedData = VendorApplicationSchema.parse(data)

    await connectToDatabase()

    // Check if user already has a vendor account
    const existingVendor = await Vendor.findOne({ userId: session.user.id })
    if (existingVendor) {
      throw new Error('You already have a vendor account')
    }

    // Create vendor with pending status
    const vendor = await Vendor.create({
      userId: session.user.id,
      businessName: validatedData.businessName,
      description: validatedData.description,
      email: validatedData.email,
      phone: validatedData.phone,
      address: validatedData.address,
      logo: validatedData.logo || '',
      banner: validatedData.banner || '',
      status: 'pending',
      stripeOnboardingComplete: false,
      commissionRate: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10'),
    })

    // Send confirmation to vendor
    try {
      await sendVendorApplicationReceivedEmail({
        vendor,
        vendorName: session.user.name || 'Vendor',
        adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
      })
    } catch (emailError) {
      console.error('Failed to send vendor application email:', emailError)
      // Continue even if email fails
    }

    revalidatePath('/admin/vendors')

    return {
      success: true,
      message: 'Vendor application submitted successfully',
      data: vendor,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create vendor application',
    }
  }
}

// Get vendor by ID
export async function getVendorById(vendorId: string) {
  try {
    await connectToDatabase()
    const vendor = await Vendor.findById(vendorId)
    return {
      success: true,
      data: vendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vendor',
    }
  }
}

// Get vendor by user ID
export async function getVendorByUserId(userId: string) {
  try {
    await connectToDatabase()
    const vendor = await Vendor.findOne({ userId })
    return {
      success: true,
      data: vendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vendor',
    }
  }
}

// Get vendor by slug
export async function getVendorBySlug(slug: string) {
  try {
    await connectToDatabase()
    const vendor = await Vendor.findOne({ slug, status: 'approved' })
    return {
      success: true,
      data: vendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vendor',
    }
  }
}

// Get all vendors (for admin)
export async function getAllVendors(filters?: {
  status?: 'pending' | 'approved' | 'suspended'
}) {
  try {
    await connectToDatabase()

    const query: { status?: string } = {}
    if (filters?.status) {
      query.status = filters.status
    }

    const vendors = await Vendor.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    return {
      success: true,
      data: vendors,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vendors',
    }
  }
}

// Approve vendor
export async function approveVendor(vendorId: string) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    await connectToDatabase()

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status: 'approved' },
      { new: true }
    )

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Update user role to vendor
    await User.findByIdAndUpdate(vendor.userId, { role: 'vendor' })

    // Send approval email
    try {
      const user = await User.findById(vendor.userId)
      await sendVendorApprovedEmail({
        vendor,
        vendorName: user?.name || 'Vendor',
      })
    } catch (emailError) {
      console.error('Failed to send vendor approval email:', emailError)
      // Continue even if email fails
    }

    revalidatePath('/admin/vendors')
    revalidatePath('/vendor/dashboard')

    return {
      success: true,
      message: 'Vendor approved successfully',
      data: vendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve vendor',
    }
  }
}

// Suspend vendor
export async function suspendVendor(vendorId: string) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    await connectToDatabase()

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status: 'suspended' },
      { new: true }
    )

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // TODO: Send suspension email
    // await sendVendorSuspendedEmail({ vendor, reason })

    revalidatePath('/admin/vendors')

    return {
      success: true,
      message: 'Vendor suspended successfully',
      data: vendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to suspend vendor',
    }
  }
}

// Update vendor profile
export async function updateVendorProfile(vendorId: string, data: Partial<IVendorInput>) {
  try {
    const session = await auth()

    await connectToDatabase()

    // Verify ownership
    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }
    if (vendor.userId.toString() !== session?.user?.id && session?.user?.role !== 'admin') {
      throw new Error('Unauthorized: You can only edit your own vendor profile')
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(vendorId, data, { new: true })

    revalidatePath('/vendor/settings')

    return {
      success: true,
      message: 'Vendor profile updated successfully',
      data: updatedVendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update vendor profile',
    }
  }
}

// Update vendor Stripe account
export async function updateVendorStripeAccount(
  vendorId: string,
  stripeAccountId: string,
  stripeOnboardingComplete: boolean
) {
  try {
    const session = await auth()

    await connectToDatabase()

    // Verify ownership
    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }
    if (vendor.userId.toString() !== session?.user?.id && session?.user?.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        stripeAccountId,
        stripeOnboardingComplete,
      },
      { new: true }
    )

    revalidatePath('/vendor/settings')

    return {
      success: true,
      message: 'Stripe account updated',
      data: updatedVendor,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update Stripe account',
    }
  }
}

// Get vendor statistics
export async function getVendorStats(vendorId: string) {
  try {
    await connectToDatabase()

    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Get product count
    const Product = (await import('@/lib/db/models/product.model')).default
    const totalProducts = await Product.countDocuments({
      vendorId: vendor._id,
      isPublished: true,
    })

    return {
      success: true,
      data: {
        totalRevenue: vendor.totalRevenue,
        totalOrders: vendor.totalOrders,
        totalProducts,
        rating: vendor.rating,
        numReviews: vendor.numReviews,
        status: vendor.status,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vendor stats',
    }
  }
}

// ==================== SUBSCRIPTION MANAGEMENT ====================

import {
  getOrCreateStripeCustomer,
  createSubscription,
  getActiveSubscription,
  getTierFromSubscription,
  cancelSubscription,
  updateSubscriptionPrice,
} from '@/lib/stripe/subscriptions'
import { VENDOR_SUBSCRIPTION_TIERS } from '@/lib/config/subscription-tiers'

export async function upgradeVendorSubscription(tierId: 'starter' | 'pro') {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const tier = VENDOR_SUBSCRIPTION_TIERS[tierId]
    if (!tier.stripePriceId || tier.stripePriceId.includes('price_')) {
      throw new Error('Subscription tier not configured. Contact support.')
    }

    // Get or create Stripe customer
    let customerId = vendor.stripeCustomerId
    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(vendor.email, vendor._id.toString())
      await Vendor.findByIdAndUpdate(vendor._id, { stripeCustomerId: customerId })
    }

    // Check for existing subscription
    const subscriptionId = vendor.subscriptionId
    if (subscriptionId) {
      // Update existing subscription to new tier
      const subscription = await updateSubscriptionPrice(subscriptionId, tier.stripePriceId)
      await Vendor.findByIdAndUpdate(vendor._id, {
        subscriptionTier: tierId,
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      })

      revalidatePath('/vendor/settings')
      return {
        success: true,
        message: `Upgraded to ${tier.name} plan`,
        subscription,
      }
    }

    // Create new subscription
    const subscription = await createSubscription({
      customerId,
      priceId: tier.stripePriceId,
      metadata: {
        vendorId: vendor._id.toString(),
        tier: tierId,
      },
    })

    // Update vendor with subscription info
    await Vendor.findByIdAndUpdate(vendor._id, {
      subscriptionTier: tierId,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })

    revalidatePath('/vendor/settings')

    return {
      success: true,
      message: `Subscribed to ${tier.name} plan`,
      subscription,
    }
  } catch (error) {
    console.error('Upgrade subscription error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upgrade subscription',
    }
  }
}

export async function cancelVendorSubscription() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor || !vendor.subscriptionId) {
      throw new Error('No active subscription')
    }

    await cancelSubscription(vendor.subscriptionId)

    // Update vendor to free tier
    await Vendor.findByIdAndUpdate(vendor._id, {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
    })

    revalidatePath('/vendor/settings')

    return {
      success: true,
      message: 'Subscription canceled. You have been downgraded to Free plan.',
    }
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel subscription',
    }
  }
}

export async function getVendorSubscriptionStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id }).select(
      'subscriptionTier subscriptionStatus subscriptionCurrentPeriodEnd stripeCustomerId subscriptionId'
    )

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // If they have a Stripe customer, fetch latest subscription info
    let subscription = null
    if (vendor.stripeCustomerId) {
      subscription = await getActiveSubscription(vendor.stripeCustomerId)
      if (subscription) {
        // Update local data if subscription state changed
        const newTier = getTierFromSubscription(subscription)
        if (newTier !== vendor.subscriptionTier) {
          await Vendor.findByIdAndUpdate(vendor._id, {
            subscriptionTier: newTier,
            subscriptionStatus: subscription.status,
          })
        }
      }
    }

    return {
      success: true,
      tier: vendor.subscriptionTier || 'free',
      status: vendor.subscriptionStatus,
      periodEnd: vendor.subscriptionCurrentPeriodEnd,
      subscription,
    }
  } catch (error) {
    console.error('Get subscription status error:', error)
    return {
      success: false,
      tier: 'free',
      message: error instanceof Error ? error.message : 'Failed to fetch subscription status',
    }
  }
}
