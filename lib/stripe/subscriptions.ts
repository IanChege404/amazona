/**
 * Stripe Billing subscription management for vendor tiers
 */

import Stripe from 'stripe'
import { VENDOR_SUBSCRIPTION_TIERS } from '@/lib/config/subscription-tiers'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
})

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

/**
 * Create or retrieve a Stripe customer for a vendor
 */
export async function getOrCreateStripeCustomer(
  email: string,
  vendorId: string
): Promise<string> {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return customers.data[0].id
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        vendorId,
      },
    })

    return customer.id
  } catch (error) {
    console.error('Failed to get/create Stripe customer:', error)
    throw error
  }
}

/**
 * Create a subscription for a vendor tier upgrade
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: params.metadata,
    } as any)

    return subscription as Stripe.Subscription
  } catch (error) {
    console.error('Failed to create subscription:', error)
    throw error
  }
}

/**
 * Get active subscription for a vendor
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    return subscriptions.data[0] || null
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return null
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediate,
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }
}

/**
 * Update subscription to a different price (plan upgrade/downgrade)
 */
export async function updateSubscriptionPrice(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (subscription.items.data.length === 0) {
      throw new Error('No items found in subscription')
    }

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Adjust billing immediately
    })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Failed to retrieve subscription:', error)
    throw error
  }
}

/**
 * Determine tier from subscription status
 */
export function getTierFromSubscription(subscription: Stripe.Subscription | null): 'free' | 'starter' | 'pro' {
  if (!subscription) return 'free'

  const priceId = subscription.items.data[0]?.price.id

  if (priceId === VENDOR_SUBSCRIPTION_TIERS.pro.stripePriceId) {
    return 'pro'
  }
  if (priceId === VENDOR_SUBSCRIPTION_TIERS.starter.stripePriceId) {
    return 'starter'
  }

  return 'free'
}
