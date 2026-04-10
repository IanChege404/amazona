/**
 * Vendor subscription tier configuration
 * Update Stripe price IDs from your Stripe dashboard after creating products/prices
 */

export const VENDOR_SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    features: {
      productLimit: 10,
      aiGenerations: 5,
      analyticsAccess: false,
      prioritySupport: false,
      customDomain: false,
      webhooks: false,
    },
  },
  starter: {
    name: 'Starter',
    description: 'For growing businesses',
    price: 9,
    billingInterval: 'month',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_',
    features: {
      productLimit: 100,
      aiGenerations: 50,
      analyticsAccess: true,
      prioritySupport: false,
      customDomain: false,
      webhooks: true,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For established vendors',
    price: 29,
    billingInterval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_',
    features: {
      productLimit: -1, // Unlimited
      aiGenerations: -1, // Unlimited
      analyticsAccess: true,
      prioritySupport: true,
      customDomain: true,
      webhooks: true,
    },
  },
}

export function getTierLimits(tier: keyof typeof VENDOR_SUBSCRIPTION_TIERS) {
  return VENDOR_SUBSCRIPTION_TIERS[tier].features
}

export function isUnlimited(limit: number): boolean {
  return limit === -1
}

export function hasExceededLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false
  return current >= limit
}
