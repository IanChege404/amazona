/**
 * Subscription Tier Enforcement
 * Handles access control and feature gating based on vendor subscription tier
 */

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import { getTierLimits, hasExceededLimit, isUnlimited } from '@/lib/config/subscription-tiers'

export class SubscriptionError extends Error {
  constructor(
    public message: string,
    public tier: string,
    public feature: string,
    public limit?: number,
    public current?: number
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

/**
 * Get current vendor subscription tier
 */
export async function getVendorSubscriptionTier(): Promise<{
  tier: string
  limits: ReturnType<typeof getTierLimits>
  vendor: any
}> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('User not authenticated')
  }

  await connectToDatabase()

  const vendor = await Vendor.findOne({ userId: session.user.id })
  if (!vendor) {
    throw new Error('Vendor account not found')
  }

  const tier = (vendor.subscriptionTier as string) || 'free'
  const limits = getTierLimits(tier as keyof typeof getTierLimits)

  return { tier, limits, vendor }
}

/**
 * Enforce: Product creation limit
 */
export async function enforceProductLimit() {
  const { tier, limits, vendor } = await getVendorSubscriptionTier()

  if (isUnlimited(limits.productLimit)) {
    return { allowed: true }
  }

  await connectToDatabase()

  const productCount = await (
    await import('@/lib/db/models/product.model')
  ).default.countDocuments({
    vendorId: vendor._id,
    isPublished: true,
  })

  if (hasExceededLimit(productCount, limits.productLimit)) {
    throw new SubscriptionError(
      `You've reached your product limit (${limits.productLimit}) for the ${tier} tier. Upgrade to add more products.`,
      tier,
      'products',
      limits.productLimit,
      productCount
    )
  }

  return { allowed: true, current: productCount, limit: limits.productLimit }
}

/**
 * Enforce: AI generations limit (daily quota)
 */
export async function enforceAIGenerationLimit() {
  const { tier, limits, vendor } = await getVendorSubscriptionTier()

  if (isUnlimited(limits.aiGenerations)) {
    return { allowed: true }
  }

  await connectToDatabase()

  // Get AI usage for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default

  const todayUsage = await AIUsageLog.countDocuments({
    vendorId: vendor._id,
    createdAt: { $gte: today },
  })

  if (hasExceededLimit(todayUsage, limits.aiGenerations)) {
    throw new SubscriptionError(
      `Daily AI generation limit (${limits.aiGenerations}) reached for ${tier} tier. Try again tomorrow or upgrade.`,
      tier,
      'ai_generations',
      limits.aiGenerations,
      todayUsage
    )
  }

  return { allowed: true, current: todayUsage, limit: limits.aiGenerations }
}

/**
 * Enforce: Analytics access
 */
export async function enforceAnalyticsAccess() {
  const { tier, limits } = await getVendorSubscriptionTier()

  if (!limits.analyticsAccess) {
    throw new SubscriptionError(
      `Analytics is not included in the ${tier} tier. Upgrade to Starter or Pro to access analytics.`,
      tier,
      'analytics'
    )
  }

  return { allowed: true }
}

/**
 * Enforce: Webhook access
 */
export async function enforceWebhookAccess() {
  const { tier, limits } = await getVendorSubscriptionTier()

  if (!limits.webhooks) {
    throw new SubscriptionError(
      `Webhooks are not included in the ${tier} tier. Upgrade to Starter or Pro to set up webhooks.`,
      tier,
      'webhooks'
    )
  }

  return { allowed: true }
}

/**
 * Enforce: Custom domain access
 */
export async function enforceCustomDomainAccess() {
  const { tier, limits } = await getVendorSubscriptionTier()

  if (!limits.customDomain) {
    throw new SubscriptionError(
      `Custom domains are only available in the Pro tier. Upgrade now to claim your brand domain.`,
      tier,
      'custom_domain'
    )
  }

  return { allowed: true }
}

/**
 * Enforce: Priority support
 */
export async function enforcePrioritySupport() {
  const { tier, limits } = await getVendorSubscriptionTier()

  if (!limits.prioritySupport) {
    throw new SubscriptionError(
      `Priority support is only available in the Pro tier.`,
      tier,
      'priority_support'
    )
  }

  return { allowed: true }
}

/**
 * Get full feature access object for a vendor
 * Useful for frontend feature flags
 */
export async function getVendorFeatureAccess() {
  try {
    const { tier, limits, vendor } = await getVendorSubscriptionTier()

    // Get current usage metrics
    await connectToDatabase()
    const Product = (await import('@/lib/db/models/product.model')).default
    const productCount = await Product.countDocuments({
      vendorId: vendor._id,
      isPublished: true,
    })

    return {
      tier,
      features: limits,
      usage: {
        products: {
          current: productCount,
          limit: limits.productLimit,
          unlimited: isUnlimited(limits.productLimit),
        },
        aiGenerations: {
          limit: limits.aiGenerations,
          unlimited: isUnlimited(limits.aiGenerations),
        },
      },
    }
  } catch (error) {
    console.error('Error getting vendor feature access:', error)
    // Return free tier as default
    return {
      tier: 'free',
      features: getTierLimits('free'),
      usage: {
        products: { current: 0, limit: 10, unlimited: false },
        aiGenerations: { limit: 5, unlimited: false },
      },
    }
  }
}
